import type {
  ExecuteResult,
  FileTree,
  GitEvent,
  ParsedCommand,
  RepoState,
} from '../types';
import { conflictError, gitError } from '../errors';
import { DEFAULT_AUTHOR, hashFor, timestampFor } from '../hashes';
import { diffTrees } from '../ops/diff';
import { mergeTrees } from '../ops/merge';
import {
  activeHeadCommit,
  activeWorktree,
  isAncestor,
  mergeBase,
  shortHash,
  snapshotOf,
} from '../ops/refs';
import { planCheckout } from '../ops/checkout';
import { branchMoved, headMoved } from './events';
import {
  describeChanges,
  failure,
  line,
  requireRepository,
  success,
} from './shared';

type MergeCommand = Extract<ParsedCommand, { kind: 'git-merge' }>;

function stats(before: FileTree, after: FileTree): string {
  return describeChanges(diffTrees(before, after).length);
}

export function gitMerge(state: RepoState, command: MergeCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  const ours = activeHeadCommit(state);
  const theirs = state.branches[command.branch];

  if (theirs === undefined) {
    return failure(
      state,
      gitError(
        'branch-not-found',
        `merge: ${command.branch} - not something we can merge`,
      ),
    );
  }

  if (ours === undefined) {
    return failure(
      state,
      gitError('no-commits', 'fatal: cannot merge before making any commit'),
    );
  }

  const currentBranch = worktree.head.kind === 'branch' ? worktree.head.branch : null;
  const oursSnapshot = snapshotOf(state, ours);
  const theirsSnapshot = snapshotOf(state, theirs);

  if (theirs === ours || isAncestor(state, theirs, ours)) {
    return success(
      state,
      [line('Already up to date.')],
      [{ type: 'up-to-date', branch: currentBranch ?? 'HEAD' }],
    );
  }

  // Fast-forward : HEAD est un ancêtre de la cible, aucun commit à créer.
  if (isAncestor(state, ours, theirs)) {
    const plan = planCheckout(worktree, oursSnapshot, theirsSnapshot);
    if (!plan.ok) return failure(state, plan.error);

    const events: GitEvent[] = [];
    let branches = state.branches;
    let head = worktree.head;

    if (currentBranch !== null) {
      branches = { ...branches, [currentBranch]: theirs };
      events.push(branchMoved(currentBranch, ours, theirs));
    } else {
      const next = { kind: 'detached' as const, commit: theirs };
      head = next;
      events.push(headMoved(worktree.head, next));
    }

    events.push({
      type: 'merge-fast-forward',
      branch: currentBranch,
      from: ours,
      to: theirs,
    });

    const newState: RepoState = {
      ...state,
      branches,
      worktrees: {
        ...state.worktrees,
        [worktree.id]: {
          ...worktree,
          head,
          index: plan.index,
          workingDir: plan.workingDir,
        },
      },
    };

    return success(
      newState,
      [
        line(`Updating ${shortHash(ours)}..${shortHash(theirs)}`),
        line('Fast-forward', 'success'),
        line(` ${stats(oursSnapshot, theirsSnapshot)}`, 'muted'),
      ],
      events,
    );
  }

  const base = mergeBase(state, ours, theirs);
  if (base === undefined) {
    return failure(
      state,
      gitError(
        'merge-would-conflict',
        'fatal: refusing to merge unrelated histories',
      ),
    );
  }

  const merged = mergeTrees(snapshotOf(state, base), oursSnapshot, theirsSnapshot);
  if (merged.conflicts.length > 0) {
    return failure(state, conflictError(merged.conflicts));
  }

  const plan = planCheckout(worktree, oursSnapshot, merged.tree);
  if (!plan.ok) return failure(state, plan.error);

  const hash = hashFor(state.nextId);
  const message = `Merge branch '${command.branch}'`;
  const newState: RepoState = {
    ...state,
    commits: {
      ...state.commits,
      [hash]: {
        hash,
        parents: [ours, theirs],
        message,
        snapshot: merged.tree,
        author: DEFAULT_AUTHOR,
        timestamp: timestampFor(state.clock + 1),
      },
    },
    clock: state.clock + 1,
    nextId: state.nextId + 1,
  };

  const events: GitEvent[] = [
    {
      type: 'commit-created',
      commit: hash,
      message,
      worktree: worktree.id,
      ...(currentBranch === null ? {} : { branch: currentBranch }),
    },
  ];

  let finalState = newState;
  let head = worktree.head;

  if (currentBranch !== null) {
    finalState = {
      ...newState,
      branches: { ...newState.branches, [currentBranch]: hash },
    };
    events.push(branchMoved(currentBranch, ours, hash));
  } else {
    const next = { kind: 'detached' as const, commit: hash };
    head = next;
    finalState = newState;
    events.push(headMoved(worktree.head, next));
  }

  finalState = {
    ...finalState,
    worktrees: {
      ...finalState.worktrees,
      [worktree.id]: {
        ...worktree,
        head,
        index: plan.index,
        workingDir: plan.workingDir,
      },
    },
  };

  events.push({ type: 'merge-commit', commit: hash, parents: [ours, theirs] });

  return success(
    finalState,
    [
      line("Merge made by the 'ort' strategy.", 'success'),
      line(` ${stats(oursSnapshot, merged.tree)}`, 'muted'),
    ],
    events,
  );
}
