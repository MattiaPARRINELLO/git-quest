import type { ExecuteResult, ParsedCommand, RepoState, Worktree } from '../types';
import { gitError } from '../errors';
import { activeWorktree, replaceWorktree } from '../ops/refs';
import { failure, line, requireRepository, success } from './shared';

type RmCommand = Extract<ParsedCommand, { kind: 'git-rm' }>;

/**
 * `git rm <fichier>` : supprime le fichier du working dir ET de l'index.
 * La suppression est donc directement indexée (visible en `git status` comme
 * `deleted`, prête pour le prochain commit).
 */
export function gitRm(state: RepoState, command: RmCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  const inIndex = worktree.index[command.path] !== undefined;
  const onDisk = worktree.workingDir[command.path] !== undefined;

  if (!inIndex) {
    return failure(
      state,
      gitError(
        'pathspec-no-match',
        `fatal: pathspec '${command.path}' did not match any files`,
      ),
    );
  }

  const workingDir = { ...worktree.workingDir };
  delete workingDir[command.path];
  const index = { ...worktree.index };
  delete index[command.path];

  const updated: Worktree = { ...worktree, workingDir, index };

  return success(
    replaceWorktree(state, updated),
    [line(`rm '${command.path}'`)],
    [
      ...(onDisk
        ? ([{ type: 'working-file-removed', path: command.path }] as const)
        : []),
      { type: 'file-staged', path: command.path },
    ],
  );
}
