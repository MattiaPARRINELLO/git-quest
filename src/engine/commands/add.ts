import type { ExecuteResult, ParsedCommand, RepoState } from '../types';
import { gitError } from '../errors';
import { activeWorktree, replaceWorktree } from '../ops/refs';
import { stagePaths } from '../ops/index';
import { failure, requireRepository, success } from './shared';

type AddCommand = Extract<ParsedCommand, { kind: 'git-add' }>;

export function gitAdd(state: RepoState, command: AddCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  const targets = command.all ? ['.'] : command.paths;
  const result = stagePaths(worktree, targets);

  if (result.unmatched.length > 0) {
    const [first] = result.unmatched;
    return failure(
      state,
      gitError(
        'pathspec-no-match',
        `error: pathspec '${first ?? ''}' did not match any file(s) known to git`,
      ),
    );
  }

  if (result.staged.length === 0) {
    return success(state, [], []);
  }

  return success(
    replaceWorktree(state, result.worktree),
    [],
    result.staged.map((path) => ({ type: 'file-staged', path }) as const),
  );
}
