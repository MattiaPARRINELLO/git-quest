import type { ExecuteResult, ParsedCommand, RepoState, Worktree } from '../types';
import { gitError } from '../errors';
import { activeWorktree, replaceWorktree } from '../ops/refs';
import { stagePaths } from '../ops/index';
import { failure, requireRepository, success } from './shared';

type AddCommand = Extract<ParsedCommand, { kind: 'git-add' }>;

interface MergeResolution {
  readonly worktree: Worktree;
  readonly resolved: readonly string[];
}

/**
 * `git add <fichier en conflit>` marque le conflit comme résolu, comme Git :
 * le contenu du disque (marqueurs compris) devient la version indexée.
 */
function resolveConflicts(worktree: Worktree, matched: readonly string[]): MergeResolution {
  const merge = worktree.merge;
  if (merge === undefined) return { worktree, resolved: [] };

  const resolved = merge.conflicts
    .filter((conflict) => matched.includes(conflict.path))
    .map((conflict) => conflict.path);
  if (resolved.length === 0) return { worktree, resolved: [] };

  return {
    worktree: {
      ...worktree,
      merge: {
        ...merge,
        conflicts: merge.conflicts.filter((conflict) => !resolved.includes(conflict.path)),
      },
    },
    resolved,
  };
}

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

  const resolution = resolveConflicts(result.worktree, result.matched);
  if (result.staged.length === 0 && resolution.resolved.length === 0) {
    return success(state, [], []);
  }

  return success(
    replaceWorktree(state, resolution.worktree),
    [],
    [
      ...resolution.resolved.map(
        (path) => ({ type: 'conflict-resolved', path }) as const,
      ),
      ...result.staged.map((path) => ({ type: 'file-staged', path }) as const),
    ],
  );
}
