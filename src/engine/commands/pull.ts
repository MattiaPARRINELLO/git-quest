import type { ExecuteResult, ParsedCommand, RepoState } from '../types';
import { gitError, mergeInProgress } from '../errors';
import { activeWorktree } from '../ops/refs';
import { remoteOf, upstreamOf } from '../ops/remotes';
import { fetchRemote, unknownRemote } from './fetch';
import { mergeTargets } from './merge';
import { failure, requireRepository, success } from './shared';

type PullCommand = Extract<ParsedCommand, { kind: 'git-pull' }>;

export function gitPull(state: RepoState, command: PullCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  if (worktree.merge !== undefined) return failure(state, mergeInProgress());

  const branchName = worktree.head.kind === 'branch' ? worktree.head.branch : undefined;
  const upstream = branchName === undefined ? undefined : upstreamOf(state, branchName);

  const remoteName = command.remote ?? upstream?.remote;
  if (remoteName === undefined) {
    return failure(
      state,
      gitError(
        'no-upstream',
        [
          'There is no tracking information for the current branch.',
          'Please specify which branch you want to merge with.',
          'See git-pull(1) for details.',
          '',
          '    git pull <remote> <branch>',
          '',
          'If you wish to set tracking information for this branch you can do so with:',
          '',
          `    git branch --set-upstream-to=<remote>/<branch> ${branchName ?? '<branch>'}`,
        ].join('\n'),
      ),
    );
  }

  const targetBranch = command.branch ?? upstream?.branch ?? branchName;
  if (targetBranch === undefined) {
    return failure(
      state,
      gitError('not-on-a-branch', 'You are not currently on a branch.'),
    );
  }

  const remote = remoteOf(state, remoteName);
  if (remote === undefined) return failure(state, unknownRemote(remoteName));

  const tip = remote.branches[targetBranch];
  if (tip === undefined) {
    return failure(
      state,
      gitError('remote-ref-not-found', `fatal: couldn't find remote ref ${targetBranch}`),
    );
  }

  const fetched = fetchRemote(state, remote);
  const merged = mergeTargets(fetched.state, worktree, tip, `${remoteName}/${targetBranch}`);
  if (merged.error) return failure(state, merged.error);

  return success(
    merged.newState,
    [...fetched.output, ...merged.output],
    [...fetched.events, ...merged.events],
  );
}
