import type {
  ExecuteResult,
  ParsedCommand,
  RepoState,
  Worktree,
} from '../types';
import { gitError, noSuchPath } from '../errors';
import { activeWorktree, replaceWorktree } from '../ops/refs';
import { resolveWorktreePath } from './worktree';
import {
  failure,
  line,
  requireRepository,
  success,
} from './shared';

type TouchCommand = Extract<ParsedCommand, { kind: 'shell-touch' }>;
type EditCommand = Extract<ParsedCommand, { kind: 'shell-edit' }>;
type RmCommand = Extract<ParsedCommand, { kind: 'shell-rm' }>;
type CdCommand = Extract<ParsedCommand, { kind: 'shell-cd' }>;

export function shellTouch(state: RepoState, command: TouchCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  if (worktree.workingDir[command.path] !== undefined) {
    return success(state, [], []);
  }

  const updated: Worktree = {
    ...worktree,
    workingDir: { ...worktree.workingDir, [command.path]: '' },
  };
  return success(
    replaceWorktree(state, updated),
    [],
    [{ type: 'working-file-created', path: command.path }],
  );
}

export function shellEdit(state: RepoState, command: EditCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  const existing = worktree.workingDir[command.path];
  const existed = existing !== undefined;

  const nextContent =
    command.content !== undefined
      ? command.content
      : `${existing ?? ''}${
          existing !== undefined && existing !== '' && !existing.endsWith('\n') ? '\n' : ''
        }modification ${state.clock + 1}`;

  const updated: Worktree = {
    ...worktree,
    workingDir: { ...worktree.workingDir, [command.path]: nextContent },
  };

  return success(
    { ...replaceWorktree(state, updated), clock: state.clock + 1 },
    [],
    [
      existed
        ? { type: 'working-file-edited', path: command.path }
        : { type: 'working-file-created', path: command.path },
    ],
  );
}

/** `rm <fichier>` : supprime uniquement du working dir, l'index reste intact. */
export function shellRm(state: RepoState, command: RmCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  if (worktree.workingDir[command.path] === undefined) {
    return failure(
      state,
      gitError(
        'file-not-found',
        `rm: cannot remove '${command.path}': No such file or directory`,
      ),
    );
  }

  const workingDir = { ...worktree.workingDir };
  delete workingDir[command.path];

  return success(
    replaceWorktree(state, { ...worktree, workingDir }),
    [],
    [{ type: 'working-file-removed', path: command.path }],
  );
}

export function shellLs(state: RepoState): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const worktree = activeWorktree(state);
  return success(
    state,
    Object.keys(worktree.workingDir).sort().map((path) => line(path)),
    [],
  );
}

export function shellCd(state: RepoState, command: CdCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const target =
    command.target === '.'
      ? activeWorktree(state).path
      : resolveWorktreePath(state, command.target);

  const worktree =
    Object.values(state.worktrees).find((candidate) => candidate.path === target) ??
    Object.values(state.worktrees).find((candidate) => candidate.path.endsWith(`/${command.target}`));

  if (worktree === undefined) {
    return failure(state, noSuchPath(command.target));
  }

  return success(
    { ...state, activeWorktree: worktree.id },
    [],
    [{ type: 'worktree-activated', id: worktree.id, path: worktree.path }],
  );
}
