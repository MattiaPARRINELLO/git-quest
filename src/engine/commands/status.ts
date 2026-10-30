import type { ExecuteResult, RepoState, TerminalLine } from '../types';
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

export function gitStatus(state: RepoState): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  const head = headCommitOf(state, worktree.head);
  const status = worktreeStatus(state, worktree);
  const output: TerminalLine[] = [];

  if (worktree.head.kind === 'detached') {
    output.push(line(`HEAD detached at ${shortHash(worktree.head.commit)}`));
  } else {
    output.push(line(`On branch ${worktree.head.branch}`));
    if (head === undefined) output.push(line(''), line('No commits yet'));
  }

  if (status.staged.length > 0) {
    output.push(
      line(''),
      line('Changes to be committed:'),
      line('  (use "git restore --staged <file>..." to unstage)'),
      ...changeLines(status.staged),
    );
  }

  if (status.unstaged.length > 0) {
    output.push(
      line(''),
      line('Changes not staged for commit:'),
      line('  (use "git add <file>..." to update what will be committed)'),
      ...changeLines(status.unstaged),
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

  const hasAnything =
    status.staged.length > 0 || status.unstaged.length > 0 || status.untracked.length > 0;

  if (!hasAnything) {
    output.push(line(''), line('nothing to commit, working tree clean'));
  } else if (status.staged.length === 0) {
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
