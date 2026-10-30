import type { FileTree } from '../types';

export interface ThreeWayResult {
  readonly tree: FileTree;
  readonly conflicts: readonly string[];
}

/**
 * Fusion 3-way au niveau fichier, relativement à la merge-base.
 * - un seul côté modifié → ce côté ;
 * - les deux côtés ont fait la même chose → OK ;
 * - sinon conflit (les conflits sont hors MVP, on refuse la fusion).
 */
export function mergeTrees(base: FileTree, ours: FileTree, theirs: FileTree): ThreeWayResult {
  const paths = new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)]);
  const tree: Record<string, string> = {};
  const conflicts: string[] = [];

  for (const path of [...paths].sort()) {
    const baseValue = base[path];
    const ourValue = ours[path];
    const theirValue = theirs[path];

    if (ourValue === theirValue) {
      if (ourValue !== undefined) tree[path] = ourValue;
      continue;
    }

    if (ourValue === baseValue) {
      if (theirValue !== undefined) tree[path] = theirValue;
      continue;
    }

    if (theirValue === baseValue) {
      if (ourValue !== undefined) tree[path] = ourValue;
      continue;
    }

    conflicts.push(path);
  }

  return { tree, conflicts };
}
