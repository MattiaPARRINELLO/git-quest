import type { ExecuteResult, FileTree, ParsedCommand, RepoState, TerminalLine } from '../types';
import { headCommitOf, snapshotOf } from '../ops/refs';
import { activeWorktree } from '../ops/refs';
import { treeDiff } from '../ops/unified-diff';
import type { DiffLineKind } from '../ops/unified-diff';
import { failure, line, requireRepository, success } from './shared';

type DiffCommand = Extract<ParsedCommand, { kind: 'git-diff' }>;

const TONES: Record<DiffLineKind, TerminalLine['tone']> = {
  meta: 'muted',
  context: 'default',
  add: 'success',
  del: 'error',
};

/**
 * Ne garde que les chemins suivis. Un fichier non suivi n'apparaît dans aucun
 * diff, comme dans Git.
 */
function trackedOnly(tree: FileTree, tracked: readonly string[]): FileTree {
  const result: Record<string, string> = {};
  for (const path of tracked) {
    const content = tree[path];
    if (content !== undefined) result[path] = content;
  }
  return result;
}

/**
 * `git diff` : compare uniquement les fichiers suivis (les untracked
 * n'apparaissent pas), comme le vrai Git.
 */
export function gitDiff(state: RepoState, command: DiffCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  const headSnapshot = snapshotOf(state, headCommitOf(state, worktree.head));

  const from =
    command.target === 'worktree' ? worktree.index : headSnapshot;

  let to: FileTree;
  if (command.target === 'staged') {
    to = worktree.index;
  } else {
    const tracked =
      command.target === 'head'
        ? [...Object.keys(headSnapshot), ...Object.keys(worktree.index)]
        : Object.keys(worktree.index);
    to = trackedOnly(worktree.workingDir, tracked);
  }

  return success(
    state,
    treeDiff(from, to, command.paths).map((entry) => line(entry.text, TONES[entry.kind])),
    [],
  );
}
