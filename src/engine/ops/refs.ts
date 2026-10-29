import type {
  BranchName,
  CommitHash,
  FileTree,
  Head,
  RepoState,
  Worktree,
} from '../types';

export function activeWorktree(state: RepoState): Worktree {
  const worktree = state.worktrees[state.activeWorktree];
  if (!worktree) {
    throw new Error(`Invariant: worktree actif introuvable (${state.activeWorktree})`);
  }
  return worktree;
}

export function headCommitOf(state: RepoState, head: Head): CommitHash | undefined {
  return head.kind === 'branch' ? state.branches[head.branch] : head.commit;
}

export function activeHeadCommit(state: RepoState): CommitHash | undefined {
  return headCommitOf(state, activeWorktree(state).head);
}

export function snapshotOf(state: RepoState, hash: CommitHash | undefined): FileTree {
  if (!hash) return {};
  return state.commits[hash]?.snapshot ?? {};
}

export function shortHash(hash: CommitHash): string {
  return hash.slice(0, 7);
}

/**
 * Résout une référence : nom de branche, `HEAD`, ou préfixe de hash (≥ 4 caractères,
 * comme Git par défaut).
 */
export function resolveCommit(state: RepoState, ref: string): CommitHash | undefined {
  const branch = state.branches[ref];
  if (branch !== undefined) return branch;
  if (ref === 'HEAD') return activeHeadCommit(state);
  if (ref.length < 4) return undefined;
  const matches = Object.keys(state.commits).filter((hash) => hash.startsWith(ref));
  return matches.length === 1 ? matches[0] : undefined;
}

export function ancestorsOf(state: RepoState, tip: CommitHash): Set<CommitHash> {
  const seen = new Set<CommitHash>();
  const stack: CommitHash[] = [tip];
  while (stack.length > 0) {
    const hash = stack.pop();
    if (hash === undefined || seen.has(hash)) continue;
    const commit = state.commits[hash];
    if (!commit) continue;
    seen.add(hash);
    for (const parent of commit.parents) stack.push(parent);
  }
  return seen;
}

export function isAncestor(state: RepoState, ancestor: CommitHash, descendant: CommitHash): boolean {
  if (ancestor === descendant) return true;
  return ancestorsOf(state, descendant).has(ancestor);
}

/**
 * Merge-base : le plus récent ancêtre commun. On filtre les ancêtres communs pour ne
 * garder que ceux qui ne sont pas ancêtres d'un autre ancêtre commun. En cas de
 * merge-base multiple (historique criss-cross), le premier trouvé est retenu : ce cas
 * n'apparaît pas dans le MVP (pas de rebase/cherry-pick), il est documenté.
 */
export function mergeBase(
  state: RepoState,
  left: CommitHash,
  right: CommitHash,
): CommitHash | undefined {
  const leftAncestors = ancestorsOf(state, left);
  const rightAncestors = ancestorsOf(state, right);
  const common = [...leftAncestors].filter((hash) => rightAncestors.has(hash));
  const best = common.filter(
    (candidate) =>
      !common.some(
        (other) =>
          other !== candidate &&
          isAncestor(state, candidate, other) &&
          candidate !== other,
      ),
  );
  return best[0];
}

export function worktreesWithBranch(state: RepoState, branch: BranchName): Worktree[] {
  return Object.values(state.worktrees).filter(
    (worktree) => worktree.head.kind === 'branch' && worktree.head.branch === branch,
  );
}

export function worktreeByPath(state: RepoState, path: string): Worktree | undefined {
  return Object.values(state.worktrees).find((worktree) => worktree.path === path);
}

export function replaceWorktree(state: RepoState, worktree: Worktree): RepoState {
  return {
    ...state,
    worktrees: { ...state.worktrees, [worktree.id]: worktree },
  };
}
