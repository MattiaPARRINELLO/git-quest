import type { FileTree, Worktree } from '../types';

export interface StageResult {
  readonly worktree: Worktree;
  /** Chemins dont l'index a réellement changé. */
  readonly staged: readonly string[];
}

function stageOne(
  index: Record<string, string>,
  workingDir: FileTree,
  path: string,
): boolean {
  const current = index[path];
  const desired = workingDir[path];
  if (desired === undefined) {
    if (current === undefined) return false;
    delete index[path];
    return true;
  }
  if (current === desired) return false;
  index[path] = desired;
  return true;
}

/** Indexe une liste de chemins ; renvoie les chemins non résolus. */
export function stagePaths(
  worktree: Worktree,
  targets: readonly string[],
): { readonly worktree: Worktree; readonly staged: readonly string[]; readonly unmatched: readonly string[] } {
  const index: Record<string, string> = { ...worktree.index };
  const staged = new Set<string>();
  const unmatched: string[] = [];

  for (const target of targets) {
    if (target === '.' || target === './') {
      const paths = new Set([...Object.keys(worktree.workingDir), ...Object.keys(worktree.index)]);
      for (const path of paths) {
        if (stageOne(index, worktree.workingDir, path)) staged.add(path);
      }
      continue;
    }

    const direct = worktree.workingDir[target] !== undefined || worktree.index[target] !== undefined;
    const prefix = target.endsWith('/') ? target : `${target}/`;
    const paths = direct
      ? [target]
      : Object.keys(worktree.workingDir)
          .filter((path) => path.startsWith(prefix))
          .concat(Object.keys(worktree.index).filter((path) => path.startsWith(prefix)));

    if (paths.length === 0) {
      unmatched.push(target);
      continue;
    }
    for (const path of new Set(paths)) {
      if (stageOne(index, worktree.workingDir, path)) staged.add(path);
    }
  }

  return {
    worktree: { ...worktree, index },
    staged: [...staged].sort(),
    unmatched,
  };
}

/**
 * `git commit -a` : indexe les fichiers déjà suivis (modifications et suppressions),
 * jamais les fichiers non suivis. `git add -A` passe par `stagePaths` avec `.`.
 */
export function stageAllTracked(worktree: Worktree): StageResult {
  const index: Record<string, string> = { ...worktree.index };
  const staged = new Set<string>();
  for (const path of Object.keys(worktree.index)) {
    if (stageOne(index, worktree.workingDir, path)) staged.add(path);
  }
  return { worktree: { ...worktree, index }, staged: [...staged].sort() };
}
