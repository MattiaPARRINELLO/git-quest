import type { ExecuteResult, ParsedCommand, RepoState } from '../types';
import { gitError } from '../errors';
import {
  activeWorktree,
  resolveCommit,
  shortHash,
  snapshotOf,
} from '../ops/refs';
import { headDetached } from './events';
import { failure, line, requireRepository } from './shared';
import { moveHeadWithCheckout, switchToBranch } from './switch';

type CheckoutCommand = Extract<ParsedCommand, { kind: 'git-checkout' }>;

export function gitCheckout(state: RepoState, command: CheckoutCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const { target } = command;

  if (state.branches[target] !== undefined) {
    return switchToBranch(state, target, false);
  }

  const commit = resolveCommit(state, target);
  if (commit === undefined) {
    return failure(
      state,
      gitError(
        'pathspec-no-match',
        `error: pathspec '${target}' did not match any file(s) known to git`,
      ),
    );
  }

  const worktree = activeWorktree(state);
  const moved = moveHeadWithCheckout(state, worktree, snapshotOf(state, commit), {
    kind: 'detached',
    commit,
  });
  if (moved.error) return moved;

  return {
    ...moved,
    output: [
      line(`Note: switching to '${target}'.`),
      line(''),
      line("You are in 'detached HEAD' state. You can look around, make experimental"),
      line('changes and commit them, and you can discard any commits you make in this'),
      line('state without impacting any branches by switching back to a branch.'),
      line(''),
      line(`HEAD is now at ${shortHash(commit)} ${state.commits[commit]?.message ?? ''}`),
    ],
    events: [headDetached(commit)],
  };
}
