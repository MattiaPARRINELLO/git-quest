import type {
  ExecuteResult,
  FileTree,
  GitEvent,
  MergeState,
  ParsedCommand,
  RepoState,
  Worktree,
} from '../types';
import { gitError, mergeInProgress, unmergedFilesError } from '../errors';
import { DEFAULT_AUTHOR, hashFor, timestampFor } from '../hashes';
import { diffTrees } from '../ops/diff';
import { conflictedTree, mergeTrees } from '../ops/merge';
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

function updateHead(
  state: RepoState,
  worktree: Worktree,
  hash: string,
  ours: string,
  message: string,
): { state: RepoState; events: GitEvent[] } {
  const currentBranch = worktree.head.kind === 'branch' ? worktree.head.branch : null;
  const events: GitEvent[] = [
    {
      type: 'commit-created',
      commit: hash,
      message,
      worktree: worktree.id,
      ...(currentBranch === null ? {} : { branch: currentBranch }),
    },
  ];

  let finalState = state;
  let head = worktree.head;

  if (currentBranch !== null) {
    finalState = {
      ...state,
      branches: { ...state.branches, [currentBranch]: hash },
    };
    events.push(branchMoved(currentBranch, ours, hash));
  } else {
    const next = { kind: 'detached' as const, commit: hash };
    head = next;
    events.push(headMoved(worktree.head, next));
  }

  return {
    state: {
      ...finalState,
      worktrees: {
        ...finalState.worktrees,
        [worktree.id]: { ...worktree, head },
      },
    },
    events,
  };
}

/**
 * Termine une fusion : crée le commit de fusion à deux parents à partir de
 * l'index courant (les conflits doivent avoir été résolus par `git add`).
 */
export function concludeMerge(
  state: RepoState,
  worktree: Worktree,
  merge: MergeState,
  message: string,
): ExecuteResult {
  if (merge.conflicts.length > 0) {
    return failure(state, unmergedFilesError(merge.conflicts.map((conflict) => conflict.path)));
  }

  const hash = hashFor(state.nextId);
  const snapshot = worktree.index;

  const withCommit: RepoState = {
    ...state,
    commits: {
      ...state.commits,
      [hash]: {
        hash,
        parents: [merge.ours, merge.theirs],
        message,
        snapshot,
        author: DEFAULT_AUTHOR,
        timestamp: timestampFor(state.clock + 1),
        ...(worktree.head.kind === 'branch' ? { branch: worktree.head.branch } : {}),
      },
    },
    clock: state.clock + 1,
    nextId: state.nextId + 1,
  };

  const updated = updateHead(withCommit, worktree, hash, merge.ours, message);

  const { merge: _discarded, ...rest } = worktree;
  const finalState: RepoState = {
    ...updated.state,
    worktrees: {
      ...updated.state.worktrees,
      [worktree.id]: { ...rest, head: updated.state.worktrees[worktree.id]?.head ?? worktree.head },
    },
  };

  return success(
    finalState,
    [
      line(
        `[${worktree.head.kind === 'branch' ? worktree.head.branch : 'detached HEAD'} ${shortHash(hash)}] ${message}`,
        'success',
      ),
      line(` ${describeChanges(diffTrees(snapshotOf(state, merge.ours), snapshot).length)}`, 'muted'),
    ],
    [
      ...updated.events,
      { type: 'merge-commit', commit: hash, parents: [merge.ours, merge.theirs] },
    ],
  );
}

function abortMerge(state: RepoState, worktree: Worktree, merge: MergeState): ExecuteResult {
  const oursSnapshot = snapshotOf(state, merge.ours);
  const { merge: _discarded, ...rest } = worktree;
  return success(
    {
      ...state,
      worktrees: {
        ...state.worktrees,
        [worktree.id]: { ...rest, index: oursSnapshot, workingDir: oursSnapshot },
      },
    },
    [],
    [{ type: 'merge-aborted', branch: merge.branch }],
  );
}

/**
 * Cœur de la fusion : fusionne `theirs` dans le HEAD du worktree.
 * `label` sert au message par défaut et aux marqueurs (`origin/main` pour un pull).
 */
export function mergeTargets(
  state: RepoState,
  worktree: Worktree,
  theirs: string,
  label: string,
): ExecuteResult {
  const ours = activeHeadCommit(state);

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

  // Conflits : Git s'arrête au milieu de la fusion, écrit les deux versions et
  // laisse le dépôt dans un état « fusion en cours » (MERGE_HEAD).
  if (merged.conflicts.length > 0) {
    const workingTree = conflictedTree(merged.tree, merged.conflicts, label);
    const plan = planCheckout(worktree, oursSnapshot, workingTree);
    if (!plan.ok) return failure(state, plan.error);

    const merge: MergeState = {
      branch: label,
      base,
      ours,
      theirs,
      conflicts: merged.conflicts,
    };

    const newState: RepoState = {
      ...state,
      worktrees: {
        ...state.worktrees,
        [worktree.id]: {
          ...worktree,
          merge,
          index: oursSnapshot,
          workingDir: plan.workingDir,
        },
      },
    };

    return success(
      newState,
      [
        ...merged.conflicts.map((conflict) => line(`Auto-merging ${conflict.path}`)),
        ...merged.conflicts.map((conflict) =>
          line(`CONFLICT (content): Merge conflict in ${conflict.path}`, 'warning'),
        ),
        line(
          'Automatic merge failed; fix conflicts and then commit the result.',
          'warning',
        ),
      ],
      [
        {
          type: 'merge-conflict',
          branch: label,
          paths: merged.conflicts.map((conflict) => conflict.path),
          worktree: worktree.id,
        },
      ],
    );
  }

  const plan = planCheckout(worktree, oursSnapshot, merged.tree);
  if (!plan.ok) return failure(state, plan.error);

  const hash = hashFor(state.nextId);
  const message = `Merge branch '${label}'`;
  const withCommit: RepoState = {
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
        ...(currentBranch === null ? {} : { branch: currentBranch }),
      },
    },
    clock: state.clock + 1,
    nextId: state.nextId + 1,
  };

  const updated = updateHead(withCommit, worktree, hash, ours, message);
  const finalState: RepoState = {
    ...updated.state,
    worktrees: {
      ...updated.state.worktrees,
      [worktree.id]: {
        ...worktree,
        head: updated.state.worktrees[worktree.id]?.head ?? worktree.head,
        index: plan.index,
        workingDir: plan.workingDir,
      },
    },
  };

  return success(
    finalState,
    [
      line("Merge made by the 'ort' strategy.", 'success'),
      line(` ${stats(oursSnapshot, merged.tree)}`, 'muted'),
    ],
    [
      ...updated.events,
      { type: 'merge-commit', commit: hash, parents: [ours, theirs] },
    ],
  );
}

export function gitMerge(state: RepoState, command: MergeCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);

  if (command.action === 'abort' || command.action === 'continue') {
    const merge = worktree.merge;
    if (merge === undefined) {
      return failure(
        state,
        gitError(
          'no-merge-in-progress',
          'fatal: There is no merge in progress (MERGE_HEAD missing).',
        ),
      );
    }
    if (command.action === 'abort') return abortMerge(state, worktree, merge);
    return concludeMerge(state, worktree, merge, `Merge branch '${merge.branch}'`);
  }

  if (worktree.merge !== undefined) return failure(state, mergeInProgress());

  const branch = command.branch;
  if (branch === undefined) {
    return failure(state, gitError('invalid-option', 'fatal: missing branch to merge'));
  }

  const theirs = state.branches[branch];
  if (theirs === undefined) {
    return failure(
      state,
      gitError('branch-not-found', `merge: ${branch} - not something we can merge`),
    );
  }

  return mergeTargets(state, worktree, theirs, branch);
}
