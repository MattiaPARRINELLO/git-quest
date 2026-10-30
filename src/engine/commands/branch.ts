import type { ExecuteResult, ParsedCommand, RepoState } from '../types';
import { gitError } from '../errors';
import {
  activeHeadCommit,
  activeWorktree,
  isAncestor,
  resolveCommit,
  shortHash,
  worktreesWithBranch,
} from '../ops/refs';
import { branchDeleted, branchCreated } from './events';
import { failure, line, requireRepository, success } from './shared';
import { isValidBranchName } from './validate-name';

type BranchCommand = Extract<ParsedCommand, { kind: 'git-branch' }>;

export function gitBranch(state: RepoState, command: BranchCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);

  if (command.action === 'list') {
    const names = Object.keys(state.branches).sort();
    const output = [];
    if (worktree.head.kind === 'detached') {
      output.push(line(`* (HEAD detached at ${shortHash(worktree.head.commit)})`));
    }
    for (const name of names) {
      const isCurrent = worktree.head.kind === 'branch' && worktree.head.branch === name;
      output.push(line(`${isCurrent ? '*' : ' '} ${name}`));
    }
    return success(state, output, []);
  }

  const name = command.name;
  if (name === undefined) {
    return failure(state, gitError('invalid-branch-name', 'fatal: branch name required'));
  }

  if (!isValidBranchName(name)) {
    return failure(
      state,
      gitError('invalid-branch-name', `fatal: '${name}' is not a valid branch name`),
    );
  }

  if (command.action === 'create') {
    if (state.branches[name] !== undefined) {
      return failure(
        state,
        gitError('branch-already-exists', `fatal: a branch named '${name}' already exists`),
      );
    }
    const head =
      command.start === undefined
        ? activeHeadCommit(state)
        : resolveCommit(state, command.start);
    if (head === undefined) {
      return failure(
        state,
        gitError(
          'invalid-reference',
          command.start === undefined
            ? `fatal: not a valid object name: '${name}'`
            : `fatal: not a valid object name: '${command.start}'`,
        ),
      );
    }
    const newState: RepoState = {
      ...state,
      branches: { ...state.branches, [name]: head },
    };
    return success(newState, [], [branchCreated(name, head)]);
  }

  // Suppression
  const tip = state.branches[name];
  if (tip === undefined) {
    return failure(state, gitError('branch-not-found', `error: branch '${name}' not found.`));
  }

  const holders = worktreesWithBranch(state, name);
  const holder = holders[0];
  if (holder !== undefined) {
    return failure(
      state,
      gitError(
        'branch-checked-out-elsewhere',
        `error: Cannot delete branch '${name}' checked out at '${holder.path}'`,
      ),
    );
  }

  if (!command.force) {
    const head = activeHeadCommit(state);
    const merged = head !== undefined && isAncestor(state, tip, head);
    if (!merged) {
      return failure(
        state,
        gitError(
          'branch-not-fully-merged',
          [
            `error: The branch '${name}' is not fully merged.`,
            `hint: If you are sure you want to delete it, run 'git branch -D ${name}'.`,
          ].join('\n'),
        ),
      );
    }
  }

  const branches = { ...state.branches };
  delete branches[name];
  return success(
    { ...state, branches },
    [line(`Deleted branch ${name} (was ${shortHash(tip)}).`, 'success')],
    [branchDeleted(name, tip, command.force)],
  );
}
