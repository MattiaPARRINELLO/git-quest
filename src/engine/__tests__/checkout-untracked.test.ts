import { describe, expect, it } from 'vitest';
import { Scenario, scenario } from '../scenario';
import { execute } from '../execute';
import type { RepoState } from '../types';

function run(state: RepoState, command: string): RepoState {
  const result = execute(state, command);
  if (result.error) throw new Error(`« ${command} » a échoué : ${result.error.message}`);
  return result.newState;
}

describe('changement de branche et fichiers non suivis', () => {
  it('conserve un fichier non suivi, comme Git', () => {
    const repo = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'a' })
      .build();

    const withUntracked = run(repo, 'touch brouillon.txt');
    const switched = run(withUntracked, 'git switch -c feature');

    expect(switched.worktrees.main?.workingDir['brouillon.txt']).toBeDefined();
    expect(switched.worktrees.main?.workingDir['a.txt']).toBe('a');
  });

  it('refuse toujours un non-suivi qui serait écrasé', () => {
    const base = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'a' })
      .branch('feature')
      .build();
    const withShared = Scenario.from(base)
      .commit('shared', { 'shared.txt': 'main' })
      .build();

    const onFeature = run(withShared, 'git switch feature');
    const withUntracked = run(onFeature, 'touch shared.txt');

    const result = execute(withUntracked, 'git switch main');
    expect(result.error?.code).toBe('untracked-files-would-be-overwritten');
    expect(result.newState).toBe(withUntracked);
  });
});
