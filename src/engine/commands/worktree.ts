import type {
  ExecuteResult,
  GitEvent,
  ParsedCommand,
  RepoState,
  Worktree,
} from '../types';
import { branchCheckedOutElsewhere, gitError } from '../errors';
import { isWorktreeDirty } from '../ops/diff';
import {
  activeWorktree,
  headCommitOf,
  resolveCommit,
  shortHash,
  snapshotOf,
  worktreesWithBranch,
} from '../ops/refs';
import { branchCreated } from './events';
import {
  activePath,
  failure,
  line,
  requireRepository,
  success,
} from './shared';
import { isValidBranchName } from './validate-name';

type WorktreeCommand = Extract<ParsedCommand, { kind: 'git-worktree' }>;

function normalizePath(input: string): string {
  const absolute = input.startsWith('/');
  const stack: string[] = [];
  for (const part of input.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') {
      const top = stack[stack.length - 1];
      if (top !== undefined && top !== '~' && top !== '..') stack.pop();
      else if (top === undefined && !absolute) stack.push('..');
      continue;
    }
    stack.push(part);
  }
  return `${absolute ? '/' : ''}${stack.join('/')}`;
}

export function resolveWorktreePath(state: RepoState, input: string): string {
  if (input.startsWith('/') || input.startsWith('~')) return normalizePath(input);
  const base = activePath(state);
  const baseDir = base.includes('/') ? base.slice(0, base.lastIndexOf('/')) : '.';
  return normalizePath(`${baseDir}/${input}`);
}

function basename(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? 'worktree';
}

function worktreeId(state: RepoState, path: string): string {
  const base = basename(path)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const candidate = base === '' ? 'worktree' : base;
  if (state.worktrees[candidate] === undefined) return candidate;
  let index = 2;
  while (state.worktrees[`${candidate}-${index}`] !== undefined) index += 1;
  return `${candidate}-${index}`;
}

function addWorktree(state: RepoState, command: WorktreeCommand): ExecuteResult {
  const rawPath = command.path ?? '';
  const path = resolveWorktreePath(state, rawPath);

  if (Object.values(state.worktrees).some((worktree) => worktree.path === path)) {
    return failure(
      state,
      gitError('worktree-path-exists', `fatal: '${rawPath}' already exists`),
    );
  }

  const createsBranch = command.createBranch !== undefined || command.branch === undefined;
  const branch = command.createBranch ?? command.branch ?? basename(path);
  // Avec -b, `command.branch` est le point de départ, pas une branche à checkout.
  const startRef = command.createBranch === undefined ? undefined : command.branch;

  if (!isValidBranchName(branch)) {
    return failure(
      state,
      gitError('invalid-branch-name', `fatal: '${branch}' is not a valid branch name`),
    );
  }

  let createdTip: string | undefined;

  if (createsBranch) {
    if (state.branches[branch] !== undefined) {
      return failure(
        state,
        gitError('branch-already-exists', `fatal: a branch named '${branch}' already exists`),
      );
    }
    const head =
      startRef === undefined
        ? headCommitOf(state, activeWorktree(state).head)
        : resolveCommit(state, startRef);
    if (head === undefined) {
      return failure(
        state,
        gitError(
          'invalid-reference',
          startRef === undefined
            ? 'fatal: not a valid object name: HEAD'
            : `fatal: invalid reference: ${startRef}`,
        ),
      );
    }
    createdTip = head;
  } else if (state.branches[branch] === undefined) {
    return failure(
      state,
      gitError('branch-not-found', `fatal: invalid reference: ${branch}`),
    );
  }

  const holder = worktreesWithBranch(state, branch)[0];
  if (holder !== undefined) {
    return failure(state, branchCheckedOutElsewhere(branch, holder.path));
  }

  const tip = createdTip ?? state.branches[branch];
  if (tip === undefined) {
    return failure(
      state,
      gitError('invalid-reference', 'fatal: not a valid object name: HEAD'),
    );
  }

  const snapshot = snapshotOf(state, tip);
  const id = worktreeId(state, path);
  const worktree: Worktree = {
    id,
    path,
    isMain: false,
    head: { kind: 'branch', branch },
    index: snapshot,
    workingDir: snapshot,
  };

  const events: GitEvent[] = [];
  let branches = state.branches;
  if (createsBranch) {
    branches = { ...branches, [branch]: tip };
    events.push(branchCreated(branch, tip));
  }
  events.push({
    type: 'worktree-added',
    id,
    path,
    branch,
  });

  const newState: RepoState = {
    ...state,
    branches,
    worktrees: { ...state.worktrees, [id]: worktree },
  };

  return success(
    newState,
    [
      line(
        createsBranch
          ? `Preparing worktree (new branch '${branch}')`
          : `Preparing worktree (checking out '${branch}')`,
      ),
      line(
        `HEAD is now at ${shortHash(tip)} ${state.commits[tip]?.message ?? ''}`,
      ),
    ],
    events,
  );
}

function listWorktrees(state: RepoState): ExecuteResult {
  const worktrees = Object.values(state.worktrees).sort((left, right) => {
    if (left.isMain !== right.isMain) return left.isMain ? -1 : 1;
    return left.path.localeCompare(right.path);
  });

  const output = worktrees.map((worktree) => {
    const hash = headCommitOf(state, worktree.head);
    const label =
      worktree.head.kind === 'detached'
        ? '(detached HEAD)'
        : `[${worktree.head.branch}]`;
    return line(`${worktree.path}  ${hash === undefined ? '0000000' : shortHash(hash)} ${label}`);
  });

  return success(state, output, []);
}

function removeWorktree(state: RepoState, command: WorktreeCommand): ExecuteResult {
  const rawPath = command.path ?? '';
  const path = resolveWorktreePath(state, rawPath);
  const worktree = Object.values(state.worktrees).find(
    (candidate) => candidate.path === path,
  );

  if (worktree === undefined) {
    return failure(
      state,
      gitError('worktree-not-found', `fatal: '${rawPath}' is not a working tree`),
    );
  }

  if (worktree.isMain) {
    return failure(
      state,
      gitError('worktree-remove-main', `fatal: '${worktree.path}' is a main working tree`),
    );
  }

  if (worktree.id === state.activeWorktree) {
    return failure(
      state,
      gitError(
        'worktree-remove-active',
        `fatal: '${worktree.path}' is the working tree you are in`,
      ),
    );
  }

  if (!command.force && isWorktreeDirty(state, worktree)) {
    return failure(
      state,
      gitError(
        'worktree-has-local-modifications',
        `fatal: '${worktree.path}' has local modifications\n(use --force to override)`,
      ),
    );
  }

  const worktrees = { ...state.worktrees };
  delete worktrees[worktree.id];

  return success(
    { ...state, worktrees },
    [],
    [{ type: 'worktree-removed', id: worktree.id, path: worktree.path }],
  );
}

export function gitWorktree(state: RepoState, command: WorktreeCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  switch (command.action) {
    case 'add':
      return addWorktree(state, command);
    case 'list':
      return listWorktrees(state);
    case 'remove':
      return removeWorktree(state, command);
  }
}
