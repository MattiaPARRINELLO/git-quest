import type { Head, RepoState } from '../engine/types';
import { shortHash } from '../engine/ops/refs';

export function headLabel(head: Head | undefined): string {
  if (!head) return '—';
  if (head.kind === 'branch') return head.branch;
  return `${shortHash(head.commit)} détaché`;
}

export function promptFor(state: RepoState): string {
  const worktree = state.worktrees[state.activeWorktree];
  if (!worktree) return '~ $';
  return `${worktree.path} (${headLabel(worktree.head)}) $`;
}
