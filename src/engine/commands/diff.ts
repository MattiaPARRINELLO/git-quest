import type { ExecuteResult, ParsedCommand, RepoState, TerminalLine } from '../types';
import { headCommitOf, snapshotOf } from '../ops/refs';
import { activeWorktree } from '../ops/refs';
import { treeDiff } from '../ops/unified-diff';
import type { DiffLineKind } from '../ops/unified-diff';
import { failure, line, requireRepository, success } from './shared';

type DiffCommand = Extract<ParsedCommand, { kind: 'git-diff' }>;

const TONES: Record<DiffLineKind, TerminalLine['tone']> = {
  meta: 'muted',
  context: 'default',
  add: 'success',
  del: 'error',
};

/**
 * `git diff` : n'affiche que les fichiers suivis (les untracked n'apparaissent pas),
 * comme le vrai Git.
 */
export function gitDiff(state: RepoState, command: DiffCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  const headSnapshot = snapshotOf(state, headCommitOf(state, worktree.head));

  const from =
    command.target === 'worktree' ? worktree.index : headSnapshot;
  const to = command.target === 'staged' ? worktree.index : worktree.workingDir;

  return success(
    state,
    treeDiff(from, to, command.paths).map((entry) => line(entry.text, TONES[entry.kind])),
    [],
  );
}
