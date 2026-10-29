import type { ExecuteResult, RepoState, Worktree } from '../types';
import { success, REPO_ROOT, line, requireRepository } from './shared';

export function gitInit(state: RepoState): ExecuteResult {
  const existingError = requireRepository(state);
  if (!existingError) {
    return success(state, [
      line(`Reinitialized existing Git repository in ${REPO_ROOT}/.git/`),
    ]);
  }

  const main: Worktree = {
    id: 'main',
    path: REPO_ROOT,
    isMain: true,
    head: { kind: 'branch', branch: 'main' },
    index: {},
    workingDir: {},
  };

  const newState: RepoState = {
    ...state,
    initialized: true,
    commits: {},
    branches: {},
    worktrees: { main },
    activeWorktree: 'main',
    clock: 0,
    nextId: 0,
  };

  return success(
    newState,
    [line(`Initialized empty Git repository in ${REPO_ROOT}/.git/`, 'success')],
    [{ type: 'repo-initialized', path: REPO_ROOT }],
  );
}
