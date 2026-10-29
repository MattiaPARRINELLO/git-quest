import { describe, expect, it } from 'vitest';
import { basicRepo, expectError, removeWorkingFile, run } from './helpers';

describe('git add', () => {
  it('indexe un fichier modifié sans toucher au working dir', () => {
    const repo = basicRepo();
    const edited = run(repo, 'edit src/app.ts "export const app = 2;"').newState;
    const result = run(edited, 'git add src/app.ts');
    const worktree = result.newState.worktrees.main;

    expect(worktree?.index['src/app.ts']).toBe('export const app = 2;');
    expect(worktree?.workingDir['src/app.ts']).toBe('export const app = 2;');
    expect(result.events).toEqual([{ type: 'file-staged', path: 'src/app.ts' }]);
  });

  it('indexe un fichier non suivi', () => {
    const repo = run(basicRepo(), 'touch notes.txt').newState;
    const result = run(repo, 'git add notes.txt');
    expect(result.newState.worktrees.main?.index['notes.txt']).toBe('');
  });

  it('indexe une suppression', () => {
    const repo = removeWorkingFile(basicRepo(), 'README.md');
    const result = run(repo, 'git add README.md');
    expect(result.newState.worktrees.main?.index['README.md']).toBeUndefined();
  });

  it('indexe tout avec . et -A', () => {
    const repo = run(
      run(basicRepo(), 'touch un.txt').newState,
      'edit src/app.ts "modifié"',
    ).newState;

    const dot = run(repo, 'git add .').newState;
    expect(dot.worktrees.main?.index['un.txt']).toBe('');
    expect(dot.worktrees.main?.index['src/app.ts']).toBe('modifié');

    const all = run(repo, 'git add -A').newState;
    expect(all.worktrees.main?.index['un.txt']).toBe('');
  });

  it('indexe un dossier par préfixe', () => {
    const repo = run(basicRepo(), 'touch src/b.ts').newState;
    const result = run(repo, 'git add src');
    expect(result.newState.worktrees.main?.index['src/b.ts']).toBe('');
  });

  it('refuse un chemin inconnu sans muter l’état', () => {
    expectError(basicRepo(), 'git add inconnu.txt', 'pathspec-no-match');
  });

  it('n’émet aucun événement si rien ne change', () => {
    const repo = basicRepo();
    const result = run(repo, 'git add README.md');
    expect(result.newState).toBe(repo);
    expect(result.events).toEqual([]);
  });
});
