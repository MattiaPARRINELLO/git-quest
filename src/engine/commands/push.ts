import type { CommitHash, ExecuteResult, GitEvent, ParsedCommand, Remote, RepoState } from '../types';
import { gitError } from '../errors';
import { isAncestor, shortHash } from '../ops/refs';
import { remoteOf, remotesOf, trackingKey, upstreamOf } from '../ops/remotes';
import { activeWorktree } from '../ops/refs';
import { failure, line, requireRepository, success } from './shared';

type PushCommand = Extract<ParsedCommand, { kind: 'git-push' }>;

/** Branche locale courante, ou null en HEAD détaché. */
function currentBranch(state: RepoState): string | null {
  const head = activeWorktree(state).head;
  return head.kind === 'branch' ? head.branch : null;
}

export function rejectedPush(remote: Remote, branch: string): ReturnType<typeof gitError> {
  return gitError(
    'push-rejected',
    [
      `To ${remote.url}`,
      ` ! [rejected]        ${branch} -> ${branch} (fetch first)`,
      `error: failed to push some refs to '${remote.url}'`,
      'hint: Updates were rejected because the remote contains work that you do not',
      'hint: have locally. This is usually caused by another repository pushing to',
      'hint: the same ref. If you want to integrate the remote changes, use',
      "hint: 'git pull' before pushing again.",
      "hint: See the 'Note about fast-forwards' in 'git push --help' for details.",
    ].join('\n'),
  );
}

/**
 * `git push` : met à jour une branche du serveur. Refuse tout ce qui n'est pas un
 * fast-forward distant, comme un vrai remote.
 */
export function gitPush(state: RepoState, command: PushCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const branch = command.branch ?? currentBranch(state);
  if (branch === null) {
    return failure(
      state,
      gitError('not-on-a-branch', 'fatal: You are not currently on a branch.'),
    );
  }
  if (branch === undefined) {
    return failure(
      state,
      gitError('not-on-a-branch', 'fatal: You are not currently on a branch.'),
    );
  }

  const remotes = remotesOf(state);
  const upstream = upstreamOf(state, branch);

  const remoteName = command.remote ?? upstream?.remote;
  if (remoteName === undefined) {
    const fallback = remotes.origin === undefined ? Object.keys(remotes)[0] : 'origin';
    if (fallback === undefined) {
      return failure(
        state,
        gitError(
          'no-push-destination',
          [
            'fatal: No configured push destination.',
            'Either specify the URL from the command-line or configure a remote repository using',
            '',
            '    git remote add <name> <url>',
          ].join('\n'),
        ),
      );
    }
    return failure(
      state,
      gitError(
        'no-upstream',
        [
          `fatal: The current branch ${branch} has no upstream branch.`,
          'To push the current branch and set the remote as upstream, use',
          '',
          `    git push --set-upstream ${fallback} ${branch}`,
        ].join('\n'),
      ),
    );
  }

  const remote = remoteOf(state, remoteName);
  if (remote === undefined) {
    return failure(
      state,
      gitError('remote-not-found', `fatal: '${remoteName}' does not appear to be a git repository`),
    );
  }

  const localTip = state.branches[branch];
  if (localTip === undefined) {
    return failure(
      state,
      gitError(
        'branch-not-found',
        `error: src refspec ${branch} does not match any`,
      ),
    );
  }

  const targetBranch = command.remoteBranch ?? branch;
  const serverTip = remote.branches[targetBranch];

  const nextUpstream: Record<string, string> = { ...(state.upstream ?? {}) };
  if (command.setUpstream) {
    nextUpstream[branch] = trackingKey(remoteName, targetBranch);
  }

  const events: GitEvent[] = [];
  if (command.setUpstream) {
    events.push({
      type: 'upstream-set',
      branch,
      upstream: trackingKey(remoteName, targetBranch),
    });
  }

  if (serverTip === localTip) {
    return success(
      {
        ...state,
        remoteTracking: {
          ...(state.remoteTracking ?? {}),
          [trackingKey(remoteName, targetBranch)]: localTip,
        },
        upstream: nextUpstream,
      },
      [line('Everything up-to-date')],
      events,
    );
  }

  if (serverTip !== undefined && !isAncestor(state, serverTip, localTip)) {
    return failure(state, rejectedPush(remote, branch));
  }

  const from: CommitHash | null = serverTip ?? null;
  const nextRemote: Remote = {
    ...remote,
    branches: { ...remote.branches, [targetBranch]: localTip },
  };

  return success(
    {
      ...state,
      remotes: { ...remotes, [remoteName]: nextRemote },
      remoteTracking: {
        ...(state.remoteTracking ?? {}),
        [trackingKey(remoteName, targetBranch)]: localTip,
      },
      upstream: nextUpstream,
    },
    [
      line(`To ${remote.url}`),
      line(
        from === null
          ? ` * [new branch]      ${branch} -> ${targetBranch}`
          : `   ${shortHash(from)}..${shortHash(localTip)}  ${branch} -> ${targetBranch}`,
        'success',
      ),
    ],
    [
      ...events,
      {
        type: 'remote-updated',
        remote: remoteName,
        branch: targetBranch,
        from,
        to: localTip,
      },
    ],
  );
}
