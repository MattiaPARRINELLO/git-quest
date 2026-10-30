import type { FileTree, GitError, Worktree } from '../types';
import { localChangesWouldBeOverwritten, untrackedFilesWouldBeOverwritten } from '../errors';

export interface CheckoutPlanOk {
  readonly ok: true;
  readonly workingDir: FileTree;
  readonly index: FileTree;
}

export interface CheckoutPlanError {
  readonly ok: false;
  readonly error: GitError;
}

export type CheckoutPlan = CheckoutPlanOk | CheckoutPlanError;

type CarryValue = string | null;

/**
 * Prépare un changement de commit (switch/checkout/merge), en respectant Git :
 *
 * - Une modification locale est emportée si le fichier est identique entre le commit
 *   source et le commit cible (le changement ne peut pas être écrasé).
 * - Sinon, si la version locale diffère de la cible, Git refuse : on refuse pareil.
 * - Un fichier non suivi qui serait écrasé par la cible est refusé.
 * - L'index et le working dir cibles sont recalculés, puis les modifications
 *   autorisées (working dir et/ou index) sont reportées.
 */
export function planCheckout(
  worktree: Worktree,
  source: FileTree,
  target: FileTree,
): CheckoutPlan {
  const localConflicts = new Set<string>();
  const untrackedConflicts = new Set<string>();
  const workingCarry = new Map<string, CarryValue>();
  const indexCarry = new Map<string, CarryValue>();

  const tracked = new Set([...Object.keys(source), ...Object.keys(worktree.index)]);

  for (const path of tracked) {
    const base = source[path] ?? null;
    const local = worktree.workingDir[path] ?? null;
    const staged = worktree.index[path] ?? null;
    const next = target[path] ?? null;

    if (local !== base) {
      if (base !== next && local !== next) {
        localConflicts.add(path);
      } else if (local !== next) {
        workingCarry.set(path, local);
      }
    }

    if (staged !== base) {
      if (base !== next && staged !== next) {
        localConflicts.add(path);
      } else if (staged !== next) {
        indexCarry.set(path, staged);
      }
    }
  }

  for (const path of Object.keys(worktree.workingDir)) {
    const isUntracked =
      source[path] === undefined && worktree.index[path] === undefined;
    if (!isUntracked) continue;
    const next = target[path];
    const local = worktree.workingDir[path];
    if (next !== undefined && next !== local) {
      untrackedConflicts.add(path);
      continue;
    }
    // Git conserve les fichiers non suivis lors d'un changement de branche.
    if (next === undefined && local !== undefined) {
      workingCarry.set(path, local);
    }
  }

  if (localConflicts.size > 0) {
    return { ok: false, error: localChangesWouldBeOverwritten([...localConflicts]) };
  }
  if (untrackedConflicts.size > 0) {
    return { ok: false, error: untrackedFilesWouldBeOverwritten([...untrackedConflicts]) };
  }

  const workingDir: Record<string, string> = { ...target };
  for (const [path, value] of workingCarry) {
    if (value === null) delete workingDir[path];
    else workingDir[path] = value;
  }

  const index: Record<string, string> = { ...target };
  for (const [path, value] of indexCarry) {
    if (value === null) delete index[path];
    else index[path] = value;
  }

  return { ok: true, workingDir, index };
}
