import { describe, expect, it } from 'vitest';
import { execute } from '../engine/execute';
import { scenario } from '../engine/scenario';
import type { RepoState } from '../engine/types';
import { preparedFiles } from './prepared-files';

function run(state: RepoState, command: string): RepoState {
  const result = execute(state, command);
  if (result.error) throw new Error(result.error.message);
  return result.newState;
}

describe('fichiers préparés du briefing', () => {
  it('liste les modifications, ajouts et fichiers indexés', () => {
    let state = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'v1', 'b.txt': 'v1' })
      .write('a.txt', 'v2')
      .write('nouveau.ts', 'export const x = 1;')
      .build();
    state = run(state, 'git add b.txt');

    const files = preparedFiles(state);
    const byPath = Object.fromEntries(files.map((file) => [file.path, file]));

    expect(byPath['a.txt']?.status).toBe('modifié');
    expect(byPath['nouveau.ts']?.status).toBe('nouveau');
    expect(files.map((file) => file.path)).not.toContain('b.txt');
  });

  it('ne liste rien sur un arbre propre', () => {
    const state = scenario().init().commit('Initial', { 'a.txt': 'v1' }).build();
    expect(preparedFiles(state)).toEqual([]);
  });

  it('tronque les aperçus trop longs', () => {
    const long = 'x'.repeat(300);
    const state = scenario().init().commit('Initial', { 'a.txt': 'v1' }).write('a.txt', long).build();
    const [file] = preparedFiles(state);
    expect(file?.preview.length).toBeLessThanOrEqual(91);
    expect(file?.preview.endsWith('…')).toBe(true);
  });
});
