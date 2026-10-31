import type { ExecuteResult, MergeConflict, RepoState, TerminalLine } from '../types';
import { activeWorktree, headCommitOf, shortHash } from '../ops/refs';
import { worktreeStatus } from '../ops/diff';
import type { FileChange } from '../ops/diff';
import { failure, line, requireRepository, success } from './shared';

const LABELS: Record<FileChange['status'], string> = {
  added: 'new file:   ',
  modified: 'modified:   ',
  deleted: 'deleted:    ',
};

function changeLines(changes: readonly FileChange[]): TerminalLine[] {
  return changes.map((change) => line(`\t${LABELS[change.status]}${change.path}`));
}

function conflictKind(conflict: MergeConflict): string {
  if (conflict.ours === undefined) return 'deleted by us:   ';
  if (conflict.theirs === undefined) return 'deleted by them: ';
  if (conflict.base === undefined) return 'both added:      ';
  return 'both modified:   ';
}

export function gitStatus(state: RepoState): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  const head = headCommitOf(state, worktree.head);
  const status = worktreeStatus(state, worktree);
  const merge = worktree.merge;
  const conflicted = new Set(merge?.conflicts.map((conflict) => conflict.path) ?? []);
  const output: TerminalLine[] = [];

  if (worktree.head.kind === 'detached') {
    output.push(line(`HEAD detached at ${shortHash(worktree.head.commit)}`));
  } else {
    output.push(line(`On branch ${worktree.head.branch}`));
    if (head === undefined) output.push(line(''), line('No commits yet'));
  }

  if (merge !== undefined) {
    if (merge.conflicts.length > 0) {
      output.push(
        line(''),
        line('You have unmerged paths.', 'warning'),
        line('  (fix conflicts and run "git commit")'),
        line('  (use "git merge --abort" to abort the merge)'),
      );
    } else {
      output.push(
        line(''),
        line('All conflicts fixed but you are still merging.', 'success'),
        line('  (use "git commit" to conclude merge)'),
      );
    }
  }

  const staged = status.staged.filter((change) => !conflicted.has(change.path));
  const unstaged = status.unstaged.filter((change) => !conflicted.has(change.path));

  if (staged.length > 0) {
    output.push(
      line(''),
      line('Changes to be committed:'),
      line('  (use "git restore --staged <file>..." to unstage)'),
      ...changeLines(staged),
    );
  }

  if (unstaged.length > 0) {
    output.push(
      line(''),
      line('Changes not staged for commit:'),
      line('  (use "git add <file>..." to update what will be committed)'),
      ...changeLines(unstaged),
    );
  }

  if (status.untracked.length > 0) {
    output.push(
      line(''),
      line('Untracked files:'),
      line('  (use "git add <file>..." to include in what will be committed)'),
      ...status.untracked.map((path) => line(`\t${path}`)),
    );
  }

  if (merge !== undefined && merge.conflicts.length > 0) {
    output.push(
      line(''),
      line('Unmerged paths:'),
      line('  (use "git add/rm <file>..." as appropriate to mark resolution)'),
      ...merge.conflicts.map((conflict) =>
        line(`\t${conflictKind(conflict)}${conflict.path}`, 'warning'),
      ),
    );
    return success(state, output, []);
  }

  const hasAnything = staged.length > 0 || unstaged.length > 0 || status.untracked.length > 0;

  if (merge !== undefined) {
    if (!hasAnything) output.push(line(''), line('nothing to commit (merge in progress)'));
    return success(state, output, []);
  }

  if (!hasAnything) {
    output.push(line(''), line('nothing to commit, working tree clean'));
  } else if (staged.length === 0) {
    output.push(
      line(''),
      line(
        status.untracked.length > 0
          ? 'nothing added to commit but untracked files present (use "git add" to track)'
          : 'no changes added to commit (use "git add" and/or "git commit -a")',
      ),
    );
  }

  return success(state, output, []);
}
