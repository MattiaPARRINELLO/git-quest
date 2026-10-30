import type { BranchName, CommitHash, GitEvent, Head, WorktreeId } from '../types';

export function branchCreated(name: BranchName, commit: CommitHash): GitEvent {
  return { type: 'branch-created', name, commit };
}

export function branchDeleted(name: BranchName, wasAt: CommitHash, force: boolean): GitEvent {
  return { type: 'branch-deleted', name, wasAt, force };
}

export function branchMoved(
  name: BranchName,
  from: CommitHash | null,
  to: CommitHash,
): GitEvent {
  return { type: 'branch-moved', name, from, to };
}

export function headAttached(branch: BranchName, commit: CommitHash): GitEvent {
  return { type: 'head-attached', branch, commit };
}

export function headDetached(commit: CommitHash): GitEvent {
  return { type: 'head-detached', commit };
}

export function headMoved(from: Head, to: Head): GitEvent {
  return { type: 'head-moved', from, to };
}

export function worktreeActivated(id: WorktreeId, path: string): GitEvent {
  return { type: 'worktree-activated', id, path };
}
