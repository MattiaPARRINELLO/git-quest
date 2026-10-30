import type { RepoState } from '../engine/types';
import { headSnapshot } from '../engine/validate';

export interface PreparedFile {
  readonly path: string;
  readonly status: 'nouveau' | 'modifié' | 'indexé';
  readonly preview: string;
}

const PREVIEW_LIMIT = 90;

/**
 * Fichiers déjà présents dans le working dir et différents de HEAD/INDEX.
 * Sert au briefing : le joueur voit ce qui l'attend sans avoir à deviner.
 */
export function preparedFiles(state: RepoState): readonly PreparedFile[] {
  const worktree = state.worktrees[state.activeWorktree];
  if (worktree === undefined) return [];
  const head = headSnapshot(state);
  const files: PreparedFile[] = [];

  for (const path of Object.keys(worktree.workingDir).sort()) {
    const local = worktree.workingDir[path];
    const committed = head[path];
    const staged = worktree.index[path];
    if (local === undefined) continue;

    let status: PreparedFile['status'] | null = null;
    if (committed === undefined && staged === undefined) status = 'nouveau';
    else if (committed !== local) {
      status = staged === local && staged !== committed ? 'indexé' : 'modifié';
    } else if (staged !== committed && staged !== undefined) status = 'indexé';
    if (status === null) continue;

    const line = local.replace(/\s+/g, ' ').trim();
    files.push({
      path,
      status,
      preview: line.length > PREVIEW_LIMIT ? `${line.slice(0, PREVIEW_LIMIT)}…` : line,
    });
  }
  return files;
}
