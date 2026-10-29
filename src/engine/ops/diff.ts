import type { CommitHash, FileTree, RepoState, Worktree } from '../types';
import { headCommitOf, snapshotOf } from './refs';

export type FileStatus = 'added' | 'modified' | 'deleted';

export interface FileChange {
  readonly path: string;
  readonly status: FileStatus;
}

function statusOf(
  before: string | undefined,
  after: string | undefined,
): FileStatus | null {
  if (before === undefined && after === undefined) return null;
  if (before === undefined) return 'added';
  if (after === undefined) return 'deleted';
  if (before === after) return null;
  return 'modified';
}

/** Diff entre deux arbres complets (from -> to). */
export function diffTrees(from: FileTree, to: FileTree): FileChange[] {
  const paths = new Set([...Object.keys(from), ...Object.keys(to)]);
  const changes: FileChange[] = [];
  for (const path of [...paths].sort()) {
    const status = statusOf(from[path], to[path]);
    if (status) changes.push({ path, status });
  }
  return changes;
}

export interface WorktreeStatus {
  /** index vs commit de HEAD */
  readonly staged: readonly FileChange[];
  /** working dir vs index (fichiers suivis uniquement) */
  readonly unstaged: readonly FileChange[];
  /** fichiers du working dir absents de l'index */
  readonly untracked: readonly string[];
}

export function worktreeStatus(state: RepoState, worktree: Worktree): WorktreeStatus {
  const headSnapshot = snapshotOf(state, headCommitOf(state, worktree.head));
  const staged = diffTrees(headSnapshot, worktree.index);
  const unstaged: FileChange[] = [];
  for (const path of [...Object.keys(worktree.index)].sort()) {
    const status = statusOf(worktree.index[path], worktree.workingDir[path]);
    if (status) unstaged.push({ path, status });
  }
  const untracked = Object.keys(worktree.workingDir)
    .filter((path) => worktree.index[path] === undefined)
    .filter((path) => headSnapshot[path] === undefined)
    .sort();
  return { staged, unstaged, untracked };
}

export function isWorktreeDirty(state: RepoState, worktree: Worktree): boolean {
  const status = worktreeStatus(state, worktree);
  return status.staged.length > 0 || status.unstaged.length > 0 || status.untracked.length > 0;
}

export function headSnapshotOf(state: RepoState, worktree: Worktree): FileTree {
  return snapshotOf(state, headCommitOf(state, worktree.head));
}

/** Tous les commits atteignables depuis un point de départ. */
export function reachableCommits(state: RepoState, tip: CommitHash): CommitHash[] {
  const seen = new Set<CommitHash>();
  const queue: CommitHash[] = [tip];
  while (queue.length > 0) {
    const hash = queue.shift();
    if (hash === undefined || seen.has(hash)) continue;
    const commit = state.commits[hash];
    if (!commit) continue;
    seen.add(hash);
    queue.push(...commit.parents);
  }
  return [...seen];
}
