import type {
  ExecuteResult,
  GitEvent,
  ParsedCommand,
  RepoState,
  Worktree,
} from '../types';
import { gitError } from '../errors';
import { DEFAULT_AUTHOR, hashFor, timestampFor } from '../hashes';
import { diffTrees, worktreeStatus } from '../ops/diff';
import { stageAllTracked } from '../ops/index';
import {
  activeWorktree,
  headCommitOf,
  shortHash,
  snapshotOf,
} from '../ops/refs';
import {
  describeChanges,
  failure,
  line,
  requireRepository,
  success,
} from './shared';

type CommitCommand = Extract<ParsedCommand, { kind: 'git-commit' }>;

export function gitCommit(state: RepoState, command: CommitCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  let worktree: Worktree = activeWorktree(state);
  let baseState = state;

  if (command.stageAllTracked) {
    const staged = stageAllTracked(worktree);
    worktree = staged.worktree;
    baseState = {
      ...state,
      worktrees: { ...state.worktrees, [worktree.id]: worktree },
    };
  }

  const headHash = headCommitOf(baseState, worktree.head);
  const headSnapshot = snapshotOf(baseState, headHash);
  const changes = diffTrees(headSnapshot, worktree.index);

  if (changes.length === 0) {
    const status = worktreeStatus(baseState, worktree);
    if (status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0) {
      return failure(
        baseState,
        gitError('nothing-to-commit', 'nothing to commit, working tree clean'),
      );
    }
    if (status.unstaged.length === 0) {
      return failure(
        baseState,
        gitError(
          'no-changes-added',
          'nothing added to commit but untracked files present (use "git add" to track)',
        ),
      );
    }
    return failure(
      baseState,
      gitError('no-changes-added', 'no changes added to commit (use "git add" and/or "git commit -a")'),
    );
  }

  const hash = hashFor(baseState.nextId);
  const branch = worktree.head.kind === 'branch' ? worktree.head.branch : undefined;

  const newState: RepoState = {
    ...baseState,
    commits: {
      ...baseState.commits,
      [hash]: {
        hash,
        parents: headHash === undefined ? [] : [headHash],
        message: command.message,
        snapshot: worktree.index,
        author: DEFAULT_AUTHOR,
        timestamp: timestampFor(baseState.clock + 1),
        ...(branch === undefined ? {} : { branch }),
      },
    },
    clock: baseState.clock + 1,
    nextId: baseState.nextId + 1,
  };

  const events: GitEvent[] = [
    {
      type: 'commit-created',
      commit: hash,
      message: command.message,
      worktree: worktree.id,
      ...(branch === undefined ? {} : { branch }),
    },
  ];

  let finalState = newState;

  if (branch !== undefined) {
    const previous = baseState.branches[branch];
    finalState = {
      ...newState,
      branches: { ...newState.branches, [branch]: hash },
    };
    events.push(
      previous === undefined
        ? { type: 'branch-created', name: branch, commit: hash }
        : { type: 'branch-moved', name: branch, from: previous, to: hash },
    );
  } else if (worktree.head.kind === 'detached') {
    const previous = worktree.head;
    const next = { kind: 'detached' as const, commit: hash };
    finalState = {
      ...newState,
      worktrees: {
        ...newState.worktrees,
        [worktree.id]: { ...worktree, head: next },
      },
    };
    events.push({ type: 'head-moved', from: previous, to: next });
  }

  const label = branch ?? 'detached HEAD';
  return success(
    finalState,
    [
      line(`[${label} ${shortHash(hash)}] ${command.message}`, 'success'),
      line(` ${describeChanges(changes.length)}`, 'muted'),
    ],
    events,
  );
}
