import { describe, expect, it } from 'vitest';
import { scenario } from '../scenario';
import { basicRepo, expectError, run } from './helpers';

describe('shell simulé', () => {
  it('touch crée un fichier vide et ne le modifie pas s’il existe', () => {
    const created = run(basicRepo(), 'touch notes.txt');
    expect(created.newState.worktrees.main?.workingDir['notes.txt']).toBe('');
    expect(created.events).toEqual([
      { type: 'working-file-created', path: 'notes.txt' },
    ]);

    const again = run(created.newState, 'touch notes.txt');
    expect(again.newState).toBe(created.newState);
  });

  it('edit remplace le contenu, ou ajoute une ligne sans argument', () => {
    const repo = run(basicRepo(), 'edit notes.txt "bonjour"').newState;
    expect(repo.worktrees.main?.workingDir['notes.txt']).toBe('bonjour');

    const appended = run(repo, 'edit notes.txt').newState;
    expect(appended.worktrees.main?.workingDir['notes.txt']).toContain('bonjour\nmodification ');
  });

  it('ls liste les fichiers du worktree actif', () => {
    const output = run(basicRepo(), 'ls').output.map((line) => line.text);
    expect(output).toEqual(['README.md', 'src/app.ts']);
  });

  it('refuse les commandes shell hors dépôt', () => {
    expectError(scenario().build(), 'ls', 'not-a-repository');
    expectError(scenario().build(), 'touch a.txt', 'not-a-repository');
    expectError(scenario().build(), 'cd ..', 'not-a-repository');
  });

  it('edit émet l’événement adapté', () => {
    const created = run(run(basicRepo(), 'touch a.txt').newState, 'edit a.txt "x"');
    expect(created.events).toEqual([{ type: 'working-file-edited', path: 'a.txt' }]);
  });
});
