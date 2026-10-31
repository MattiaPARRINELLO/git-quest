import type { FileTree, MergeConflict } from '../types';

export interface ThreeWayResult {
  readonly tree: FileTree;
  readonly conflicts: readonly MergeConflict[];
}

/**
 * Fusion 3-way au niveau fichier, relativement à la merge-base.
 * - un seul côté modifié → ce côté ;
 * - les deux côtés ont fait la même chose → OK ;
 * - sinon conflit : les trois versions sont conservées pour écrire les marqueurs.
 */
export function mergeTrees(base: FileTree, ours: FileTree, theirs: FileTree): ThreeWayResult {
  const paths = new Set([...Object.keys(base), ...Object.keys(ours), ...Object.keys(theirs)]);
  const tree: Record<string, string> = {};
  const conflicts: MergeConflict[] = [];

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

    conflicts.push({
      path,
      ...(baseValue === undefined ? {} : { base: baseValue }),
      ...(ourValue === undefined ? {} : { ours: ourValue }),
      ...(theirValue === undefined ? {} : { theirs: theirValue }),
    });
  }

  return { tree, conflicts };
}

/**
 * Contenu écrit sur le disque pour un fichier en conflit, avec les même marqueurs
 * que Git. Une branche vaut `HEAD`, l'autre le nom de la branche fusionnée.
 */
export function conflictMarkers(conflict: MergeConflict, branch: string): string {
  return [
    '<<<<<<< HEAD',
    conflict.ours ?? '',
    '=======',
    conflict.theirs ?? '',
    `>>>>>>> ${branch}`,
    '',
  ].join('\n');
}

/** Arbre de travail d'une fusion en conflit : fichiers résolus + marqueurs. */
export function conflictedTree(merged: FileTree, conflicts: readonly MergeConflict[], branch: string): FileTree {
  const tree: Record<string, string> = { ...merged };
  for (const conflict of conflicts) {
    tree[conflict.path] = conflictMarkers(conflict, branch);
  }
  return tree;
}
