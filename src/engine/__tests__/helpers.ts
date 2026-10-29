import { expect } from 'vitest';
import { execute } from '../execute';
import { scenario } from '../scenario';
import type { ExecuteResult, GitError, RepoState } from '../types';

export function emptyRepo(): RepoState {
  return scenario().init().build();
}

export function basicRepo(): RepoState {
  return scenario()
    .init()
    .commit('Initial commit', {
      'README.md': '# Projet',
      'src/app.ts': 'export const app = 1;',
    })
    .build();
}

export function run(state: RepoState, command: string): ExecuteResult {
  const result = execute(state, command);
  if (result.error) {
    throw new Error(`« ${command} » a échoué : ${result.error.message}`);
  }
  return result;
}

export function runAll(state: RepoState, commands: readonly string[]): RepoState {
  return commands.reduce((current, command) => run(current, command).newState, state);
}

export function expectError(
  state: RepoState,
  command: string,
  code: GitError['code'],
): GitError {
  const result = execute(state, command);
  expect(result.error, `« ${command} » aurait dû échouer`).toBeDefined();
  expect(result.error?.code).toBe(code);
  expect(result.newState).toBe(state);
  return result.error as GitError;
}

export function commitMessages(state: RepoState): string[] {
  return Object.values(state.commits)
    .sort((left, right) => left.timestamp - right.timestamp)
    .map((commit) => commit.message);
}

export function activeWorktree(state: RepoState): RepoState['worktrees'][string] {
  const worktree = state.worktrees[state.activeWorktree];
  if (!worktree) throw new Error('worktree actif introuvable');
  return worktree;
}

export function branchNames(state: RepoState): string[] {
  return Object.keys(state.branches).sort();
}

/** Retire un fichier du working dir actif (le moteur n'expose pas `rm`). */
export function removeWorkingFile(state: RepoState, path: string): RepoState {
  const worktree = activeWorktree(state);
  const workingDir = { ...worktree.workingDir };
  delete workingDir[path];
  return {
    ...state,
    worktrees: {
      ...state.worktrees,
      [worktree.id]: { ...worktree, workingDir },
    },
  };
}
