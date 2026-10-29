import { describe, expect, it } from 'vitest';
import { basicRepo, emptyRepo, expectError, run } from './helpers';

function createFeature() {
  return run(basicRepo(), 'git branch feature');
}

describe('git branch', () => {
  it('crée une branche sans déplacer HEAD', () => {
    const repo = basicRepo();
    const result = createFeature();
    expect(result.newState.worktrees.main?.head).toEqual(repo.worktrees.main?.head);
    expect(result.newState.branches.feature).toBe(repo.branches.main);
    expect(result.events).toEqual([
      { type: 'branch-created', name: 'feature', commit: repo.branches.main },
    ]);
  });

  it('liste les branches avec un marqueur sur la branche courante', () => {
    const repo = createFeature().newState;
    const output = run(repo, 'git branch').output.map((line) => line.text);
    expect(output).toContain('* main');
    expect(output).toContain('  feature');
  });

  it('refuse un doublon et un nom invalide', () => {
    const repo = createFeature().newState;
    expectError(repo, 'git branch feature', 'branch-already-exists');
    expectError(repo, 'git branch "mauvais nom"', 'invalid-branch-name');
    expectError(repo, 'git branch -d inconnue', 'branch-not-found');
  });

  it('refuse de créer une branche sans commit', () => {
    expectError(emptyRepo(), 'git branch orpheline', 'invalid-reference');
  });

  it('supprime une branche fusionnée avec -d', () => {
    const repo = createFeature().newState;
    const result = run(repo, 'git branch -d feature');
    expect(result.newState.branches.feature).toBeUndefined();
    expect(result.output[0]?.text).toContain('Deleted branch feature');
  });

  it('refuse -d sur une branche non fusionnée, -D force', () => {
    const repo = run(createFeature().newState, 'git switch feature').newState;
    const diverged = run(
      run(repo, 'edit README.md "feature"').newState,
      'git commit -am "feat: readme"',
    ).newState;
    const back = run(diverged, 'git switch main').newState;

    expectError(back, 'git branch -d feature', 'branch-not-fully-merged');
    const forced = run(back, 'git branch -D feature');
    expect(forced.newState.branches.feature).toBeUndefined();
  });

  it('refuse de supprimer la branche checkout, y compris dans un autre worktree', () => {
    expectError(basicRepo(), 'git branch -d main', 'branch-checked-out-elsewhere');

    const withWorktree = run(
      createFeature().newState,
      'git worktree add ../gitquest-feature feature',
    ).newState;
    const error = expectError(
      withWorktree,
      'git branch -d feature',
      'branch-checked-out-elsewhere',
    );
    expect(error.message).toContain('checked out at');
    expect(error.message).toContain('gitquest-feature');
  });
});
