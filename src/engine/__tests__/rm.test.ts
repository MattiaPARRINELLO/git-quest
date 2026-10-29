import { describe, expect, it } from 'vitest';
import { basicRepo, expectError, run, runAll } from './helpers';

describe('rm (shell)', () => {
  it('supprime du working dir mais laisse l’index intact', () => {
    const result = run(basicRepo(), 'rm README.md');
    const worktree = result.newState.worktrees.main;
    expect(worktree?.workingDir['README.md']).toBeUndefined();
    expect(worktree?.index['README.md']).toBe('# Projet');
    expect(result.events).toEqual([{ type: 'working-file-removed', path: 'README.md' }]);

    const status = run(result.newState, 'git status').output.map((line) => line.text).join('\n');
    expect(status).toContain('deleted:    README.md');
  });

  it('refuse un fichier absent', () => {
    expectError(basicRepo(), 'rm inconnu.txt', 'file-not-found');
  });

  it('git rm supprime du working dir et de l’index', () => {
    const result = run(basicRepo(), 'git rm README.md');
    const worktree = result.newState.worktrees.main;
    expect(worktree?.workingDir['README.md']).toBeUndefined();
    expect(worktree?.index['README.md']).toBeUndefined();
    expect(result.events).toEqual([
      { type: 'working-file-removed', path: 'README.md' },
      { type: 'file-staged', path: 'README.md' },
    ]);
  });

  it('git rm refuse un fichier non suivi', () => {
    const repo = run(basicRepo(), 'touch brouillon.txt').newState;
    expectError(repo, 'git rm brouillon.txt', 'pathspec-no-match');
  });

  it('git rm + commit, puis merge : la suppression est conservée', () => {
    let repo = runAll(basicRepo(), ['git branch feature', 'git switch feature']);
    repo = runAll(repo, ['git rm README.md', 'git commit -m "chore: supprime readme"', 'git switch main']);
    repo = runAll(repo, [
      'edit notes.txt "notes"',
      'git add notes.txt',
      'git commit -m "feat: notes"',
    ]);

    const merged = run(repo, 'git merge feature').newState;
    const tip = merged.branches.main;
    if (!tip) throw new Error('main attendue');
    expect(merged.commits[tip]?.snapshot['README.md']).toBeUndefined();
    expect(merged.commits[tip]?.snapshot['notes.txt']).toBe('notes');
  });
});
