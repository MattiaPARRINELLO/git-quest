import type { ExecuteResult, ParsedCommand, RepoState } from '../types';
import { gitError } from '../errors';
import { activeHeadCommit, activeWorktree, shortHash } from '../ops/refs';
import { reachableCommits } from '../ops/diff';
import { failure, line, requireRepository, success } from './shared';

type LogCommand = Extract<ParsedCommand, { kind: 'git-log' }>;

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().replace('T', ' ').replace('.000Z', ' +0000');
}

export function gitLog(state: RepoState, command: LogCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const tip = activeHeadCommit(state);
  if (tip === undefined) {
    const worktree = activeWorktree(state);
    const label = worktree.head.kind === 'branch' ? worktree.head.branch : 'HEAD';
    return failure(
      state,
      gitError(
        'no-commits',
        `fatal: your current branch '${label}' does not have any commits yet`,
      ),
    );
  }

  const hashes = reachableCommits(state, tip).sort((left, right) => {
    const leftCommit = state.commits[left];
    const rightCommit = state.commits[right];
    const delta = (rightCommit?.timestamp ?? 0) - (leftCommit?.timestamp ?? 0);
    return delta !== 0 ? delta : left.localeCompare(right);
  });

  const output = [];
  for (const hash of hashes) {
    const commit = state.commits[hash];
    if (!commit) continue;

    if (command.oneline) {
      const prefix = command.graph ? '* ' : '';
      output.push(line(`${prefix}${shortHash(commit.hash)} ${commit.message}`));
      continue;
    }

    output.push(
      line(`commit ${commit.hash}`),
      line(`Author: ${commit.author.name} <${commit.author.email}>`),
      line(`Date:   ${formatDate(commit.timestamp)}`),
      line(''),
      line(`    ${commit.message}`),
      line(''),
    );
  }

  return success(state, output, []);
}
