import type { Head, RepoState } from '../engine/types';
import { shortHash } from '../engine/ops/refs';
import { t } from '../i18n';

export function headLabel(head: Head | undefined): string {
  if (!head) return '—';
  if (head.kind === 'branch') return head.branch;
  return t('prompt.detached', { hash: shortHash(head.commit) });
}

export function promptFor(state: RepoState): string {
  const worktree = state.worktrees[state.activeWorktree];
  if (!worktree) return '~ $';
  return `${worktree.path} (${headLabel(worktree.head)}) $`;
}
