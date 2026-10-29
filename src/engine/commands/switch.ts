import type { ExecuteResult, FileTree, ParsedCommand, RepoState, Worktree } from '../types';
import { branchCheckedOutElsewhere, gitError } from '../errors';
import {
  activeWorktree,
  headCommitOf,
  snapshotOf,
  worktreesWithBranch,
} from '../ops/refs';
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

export function switchToBranch(
  state: RepoState,
  branch: string,
  create: boolean,
): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);

  if (!create && worktree.head.kind === 'branch' && worktree.head.branch === branch) {
    return success(state, [line(`Already on '${branch}'`)], []);
  }

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

    const head = headCommitOf(state, worktree.head);
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

    const newState: RepoState = {
      ...state,
      branches: { ...state.branches, [branch]: head },
      worktrees: {
        ...state.worktrees,
        [worktree.id]: { ...worktree, head: { kind: 'branch', branch } },
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

  const moved = moveHeadWithCheckout(state, worktree, snapshotOf(state, tip), {
    kind: 'branch',
    branch,
  });
  if (moved.error) return moved;

  return {
    ...moved,
    output: [line(`Switched to branch '${branch}'`, 'success')],
    events: [headAttached(branch, tip)],
  };
}

export function gitSwitch(state: RepoState, command: SwitchCommand): ExecuteResult {
  return switchToBranch(state, command.branch, command.create);
}
