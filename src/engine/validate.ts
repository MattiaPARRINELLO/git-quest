import type { BranchName, Commit, CommitHash, FileTree, RepoState } from './types';
import {
  activeWorktree,
  headCommitOf,
  snapshotOf,
  worktreesWithBranch,
} from './ops/refs';
import { worktreeStatus } from './ops/diff';

export interface ValidationResult {
  readonly ok: boolean;
  readonly reason?: string;
}

export function pass(): ValidationResult {
  return { ok: true };
}

export function fail(reason: string): ValidationResult {
  return { ok: false, reason };
}

export function check(condition: boolean, reason: string): ValidationResult {
  return condition ? pass() : fail(reason);
}

/** Toutes les validations doivent passer ; la première erreur fournit la raison. */
export function allOf(...results: readonly ValidationResult[]): ValidationResult {
  for (const result of results) {
    if (!result.ok) return result;
  }
  return pass();
}

export function headBranch(state: RepoState): BranchName | undefined {
  const head = activeWorktree(state).head;
  return head.kind === 'branch' ? head.branch : undefined;
}

export function isHeadDetached(state: RepoState): boolean {
  return activeWorktree(state).head.kind === 'detached';
}

export function headCommit(state: RepoState): CommitHash | undefined {
  return headCommitOf(state, activeWorktree(state).head);
}

export function branchTip(state: RepoState, branch: BranchName): CommitHash | undefined {
  return state.branches[branch];
}

export function hasBranch(state: RepoState, branch: BranchName): boolean {
  return state.branches[branch] !== undefined;
}

export function commitCount(state: RepoState): number {
  return Object.keys(state.commits).length;
}

export function headSnapshot(state: RepoState): FileTree {
  return snapshotOf(state, headCommit(state));
}

export function headFile(state: RepoState, path: string): string | undefined {
  return headSnapshot(state)[path];
}

export function branchFile(
  state: RepoState,
  branch: BranchName,
  path: string,
): string | undefined {
  const tip = state.branches[branch];
  if (tip === undefined) return undefined;
  return state.commits[tip]?.snapshot[path];
}

export function commitList(state: RepoState): Commit[] {
  return Object.values(state.commits).sort(
    (left, right) => left.timestamp - right.timestamp,
  );
}

export function commitsWithMessageContaining(state: RepoState, text: string): Commit[] {
  return commitList(state).filter((commit) => commit.message.includes(text));
}

export function worktreePaths(state: RepoState): string[] {
  return Object.values(state.worktrees).map((worktree) => worktree.path);
}

export function worktreeWithBranch(
  state: RepoState,
  branch: BranchName,
): string | undefined {
  return worktreesWithBranch(state, branch)[0]?.path;
}

export function activeWorktreePath(state: RepoState): string {
  return activeWorktree(state).path;
}

/** Contenu d'un fichier dans l'index du worktree actif. */
export function indexFile(state: RepoState, path: string): string | undefined {
  return activeWorktree(state).index[path];
}

/** Contenu d'un fichier dans le working dir du worktree actif. */
export function workingFile(state: RepoState, path: string): string | undefined {
  return activeWorktree(state).workingDir[path];
}

/** Contenu d'un fichier dans le working dir d'un worktree donné (par chemin). */
export function workingFileIn(
  state: RepoState,
  worktreePath: string,
  path: string,
): string | undefined {
  const worktree = Object.values(state.worktrees).find(
    (candidate) => candidate.path === worktreePath,
  );
  return worktree?.workingDir[path];
}

export function isWorkingTreeClean(state: RepoState): boolean {
  const status = worktreeStatus(state, activeWorktree(state));
  return status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0;
}

/** Une fusion (conflit ou résolution en attente) est-elle en cours ? */
export function isMergeInProgress(state: RepoState): boolean {
  return activeWorktree(state).merge !== undefined;
}

/** Conflits non résolus de la fusion en cours. */
export function mergeConflictPaths(state: RepoState): string[] {
  return activeWorktree(state).merge?.conflicts.map((conflict) => conflict.path) ?? [];
}

export function hasRemote(state: RepoState, name: string): boolean {
  return state.remotes?.[name] !== undefined;
}

export function remoteUrl(state: RepoState, name: string): string | undefined {
  return state.remotes?.[name]?.url;
}

/** Sommet d'une branche sur le serveur (`origin/main`). */
export function remoteBranchTip(
  state: RepoState,
  remote: string,
  branch: BranchName,
): CommitHash | undefined {
  return state.remotes?.[remote]?.branches[branch];
}

/** Référence amont d'une branche locale (`origin/main`). */
export function upstreamRef(state: RepoState, branch: BranchName): string | undefined {
  return state.upstream?.[branch];
}

/** Dernier état connu du serveur pour une référence de suivi. */
export function remoteTrackingTip(state: RepoState, ref: string): CommitHash | undefined {
  return state.remoteTracking?.[ref];
}
