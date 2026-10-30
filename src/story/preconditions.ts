import type { BranchName, Commit, RepoState } from '../engine/types';
import {
  allOf,
  branchFile,
  branchTip,
  check,
  hasBranch,
  headBranch,
  isWorkingTreeClean,
  workingFile,
  worktreePaths,
} from '../engine/validate';
import type { Precondition, PreconditionResult } from './types';

/**
 * Préconditions structurelles du story-repo.
 *
 * Toutes portent sur le **résultat** (branches, HEAD, contenus, worktrees,
 * propreté), jamais sur le chemin : ni compte de commits absolu, ni hash
 * littéral. Une condition qui dépend de l'entrée reçoit `entry` en argument.
 */

export { allOf, check };

/** Commits présents dans `state` mais pas dans `entry`, du plus ancien au plus récent. */
export function commitsSince(state: RepoState, entry: RepoState): Commit[] {
  return Object.values(state.commits)
    .filter((commit) => entry.commits[commit.hash] === undefined)
    .sort((left, right) => left.timestamp - right.timestamp);
}

/** Nombre de commits créés depuis l'état d'entrée. */
export function commitDelta(state: RepoState, entry: RepoState): number {
  return commitsSince(state, entry).length;
}

/** La branche pointe-t-elle exactement sur le même commit que dans `entry` ? */
export function branchUnchanged(
  state: RepoState,
  entry: RepoState,
  branch: BranchName,
): boolean {
  return branchTip(state, branch) === branchTip(entry, branch);
}

export function branchExists(branch: BranchName): Precondition {
  return (state) => check(hasBranch(state, branch), `La branche ${branch} doit exister.`);
}

export function branchAbsent(branch: BranchName): Precondition {
  return (state) => check(!hasBranch(state, branch), `La branche ${branch} ne doit pas exister.`);
}

export function headOn(branch: BranchName): Precondition {
  return (state) => check(headBranch(state) === branch, `HEAD doit être sur ${branch}.`);
}

export function branchFileIs(
  branch: BranchName,
  path: string,
  content: string,
): Precondition {
  return (state) =>
    check(
      branchFile(state, branch, path) === content,
      `La branche ${branch} doit contenir ${path} avec le contenu attendu.`,
    );
}

export function branchFileAbsent(branch: BranchName, path: string): Precondition {
  return (state) =>
    check(
      branchFile(state, branch, path) === undefined,
      `La branche ${branch} ne doit pas contenir ${path}.`,
    );
}

export function workingFileIs(path: string, content: string): Precondition {
  return (state) =>
    check(
      workingFile(state, path) === content,
      `Le working dir doit contenir ${path} avec le contenu attendu.`,
    );
}

export function cleanWorkingTree(): Precondition {
  return (state) => check(isWorkingTreeClean(state), 'Le working dir doit être propre.');
}

export function worktreesAre(paths: readonly string[]): Precondition {
  const expected = [...paths].sort().join('|');
  return (state) =>
    check(
      [...worktreePaths(state)].sort().join('|') === expected,
      `Les worktrees doivent être exactement : ${paths.join(', ')}.`,
    );
}

export function branchUnchangedSince(
  branch: BranchName,
  entry: RepoState,
): Precondition {
  return (state) =>
    check(
      branchUnchanged(state, entry, branch),
      `La branche ${branch} ne doit pas bouger.`,
    );
}

export function commitDeltaIs(expected: number, entry: RepoState): Precondition {
  return (state) =>
    check(
      commitDelta(state, entry) === expected,
      expected === 0
        ? 'Aucun commit ne doit être créé.'
        : `${expected} commit(s) attendu(s) depuis l’entrée.`,
    );
}

export function custom(reason: string, predicate: (state: RepoState) => boolean): Precondition {
  return (state) => check(predicate(state), reason);
}

/** Évalue une liste dans l'ordre ; la première erreur fournit la raison. */
export function evaluate(
  state: RepoState,
  preconditions: readonly Precondition[],
): PreconditionResult {
  return allOf(...preconditions.map((precondition) => precondition(state)));
}
