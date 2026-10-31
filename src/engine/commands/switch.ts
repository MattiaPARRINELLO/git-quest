import type {
  ExecuteResult,
  FileTree,
  ParsedCommand,
  RepoState,
  TerminalLine,
  Worktree,
} from '../types';
import { branchCheckedOutElsewhere, gitError, mergeInProgress } from '../errors';
import {
  activeWorktree,
  headCommitOf,
  resolveCommit,
  shortHash,
  snapshotOf,
  worktreesWithBranch,
} from '../ops/refs';
import { reachableCommits } from '../ops/diff';
import { planCheckout } from '../ops/checkout';
import { branchCreated, headAttached } from './events';
import { failure, line, requireRepository, success } from './shared';
import { isValidBranchName } from './validate-name';

type SwitchCommand = Extract<ParsedCommand, { kind: 'git-switch' }>;

export function moveHeadWithCheckout(
  state: RepoState,
  worktree: Worktree,
  targetSnapshot: FileTree,
  nextHead: Worktree['head'],
): ExecuteResult {
  const sourceSnapshot = snapshotOf(state, headCommitOf(state, worktree.head));
  const plan = planCheckout(worktree, sourceSnapshot, targetSnapshot);
  if (!plan.ok) return failure(state, plan.error);

  return success(
    {
      ...state,
      worktrees: {
        ...state.worktrees,
        [worktree.id]: {
          ...worktree,
          head: nextHead,
          index: plan.index,
          workingDir: plan.workingDir,
        },
      },
    },
    [],
    [],
  );
}

/**
 * Reproduit l'avertissement Git quand on quitte un HEAD détaché en laissant des
 * commits qui ne sont plus référencés par aucune branche ni aucun autre HEAD.
 */
function orphanWarning(
  state: RepoState,
  worktree: Worktree,
  oldDetached: string,
): TerminalLine[] {
  const connected = new Set<string>();
  for (const tip of Object.values(state.branches)) {
    for (const hash of reachableCommits(state, tip)) connected.add(hash);
  }
  for (const other of Object.values(state.worktrees)) {
    if (other.id === worktree.id) continue;
    if (other.head.kind === 'detached') {
      for (const hash of reachableCommits(state, other.head.commit)) connected.add(hash);
    }
  }

  const orphans = reachableCommits(state, oldDetached)
    .filter((hash) => !connected.has(hash))
    .sort((left, right) => {
      const leftCommit = state.commits[left];
      const rightCommit = state.commits[right];
      return (rightCommit?.timestamp ?? 0) - (leftCommit?.timestamp ?? 0);
    });

  if (orphans.length === 0) return [];

  const plural = orphans.length > 1;
  const first = orphans[orphans.length - 1];

  return [
    line(
      plural
        ? `Warning: you are leaving ${orphans.length} commits behind, not connected to`
        : `Warning: you are leaving ${orphans.length} commit behind, not connected to`,
      'warning',
    ),
    line('any of your branches:', 'warning'),
    line(''),
    ...orphans.map((hash) =>
      line(`  ${shortHash(hash)} ${state.commits[hash]?.message ?? ''}`),
    ),
    line(''),
    line(
      plural
        ? 'If you want to keep them by creating a new branch, this may be a good time'
        : 'If you want to keep it by creating a new branch, this may be a good time',
    ),
    line('to do so with:'),
    line(''),
    line(` git branch <new-branch-name> ${first === undefined ? '' : shortHash(first)}`),
    line(''),
  ];
}

export function switchToBranch(
  state: RepoState,
  branch: string,
  create: boolean,
  start?: string,
): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);

  if (!create && worktree.head.kind === 'branch' && worktree.head.branch === branch) {
    return success(state, [line(`Already on '${branch}'`)], []);
  }

  // Une fusion non conclue fige le HEAD : on la termine ou on l'annule d'abord.
  if (worktree.merge !== undefined) return failure(state, mergeInProgress());

  if (create) {
    if (!isValidBranchName(branch)) {
      return failure(
        state,
        gitError('invalid-branch-name', `fatal: '${branch}' is not a valid branch name`),
      );
    }
    if (state.branches[branch] !== undefined) {
      return failure(
        state,
        gitError('branch-already-exists', `fatal: a branch named '${branch}' already exists`),
      );
    }

    const startCommit = start === undefined ? undefined : resolveCommit(state, start);
    if (start !== undefined && startCommit === undefined) {
      return failure(
        state,
        gitError('invalid-reference', `fatal: invalid reference: ${start}`),
      );
    }

    const head = startCommit ?? headCommitOf(state, worktree.head);
    if (head === undefined) {
      // Branche à naître : elle sera créée par le premier commit, comme Git.
      return success(
        {
          ...state,
          worktrees: {
            ...state.worktrees,
            [worktree.id]: { ...worktree, head: { kind: 'branch', branch } },
          },
        },
        [line(`Switched to a new branch '${branch}'`, 'success')],
        [],
      );
    }

    const sourceSnapshot = snapshotOf(state, headCommitOf(state, worktree.head));
    const targetSnapshot = snapshotOf(state, head);
    const plan = planCheckout(worktree, sourceSnapshot, targetSnapshot);
    if (!plan.ok) return failure(state, plan.error);

    const newState: RepoState = {
      ...state,
      branches: { ...state.branches, [branch]: head },
      worktrees: {
        ...state.worktrees,
        [worktree.id]: {
          ...worktree,
          head: { kind: 'branch', branch },
          index: plan.index,
          workingDir: plan.workingDir,
        },
      },
    };
    return success(
      newState,
      [line(`Switched to a new branch '${branch}'`, 'success')],
      [branchCreated(branch, head), headAttached(branch, head)],
    );
  }

  const tip = state.branches[branch];
  if (tip === undefined) {
    return failure(state, gitError('branch-not-found', `fatal: invalid reference: ${branch}`));
  }

  const holder = worktreesWithBranch(state, branch).find(
    (candidate) => candidate.id !== worktree.id,
  );
  if (holder !== undefined) {
    return failure(state, branchCheckedOutElsewhere(branch, holder.path));
  }

  const warning =
    worktree.head.kind === 'detached'
      ? orphanWarning(state, worktree, worktree.head.commit)
      : [];

  const moved = moveHeadWithCheckout(state, worktree, snapshotOf(state, tip), {
    kind: 'branch',
    branch,
  });
  if (moved.error) return moved;

  return {
    ...moved,
    output: [...warning, line(`Switched to branch '${branch}'`, 'success')],
    events: [headAttached(branch, tip)],
  };
}

export function gitSwitch(state: RepoState, command: SwitchCommand): ExecuteResult {
  return switchToBranch(state, command.branch, command.create, command.start);
}
