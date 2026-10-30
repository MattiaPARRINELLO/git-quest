import { describe, expect, it } from 'vitest';
import { basicRepo, emptyRepo, expectError, run, runAll } from './helpers';

function repoWithWorktree() {
  return runAll(basicRepo(), [
    'git branch feature',
    'git worktree add ../gitquest-feature feature',
  ]);
}

describe('git worktree', () => {
  it('ajoute un worktree sur une branche existante', () => {
    const result = run(repoWithWorktree(), 'git worktree list');
    const output = result.output.map((line) => line.text).join('\n');
    expect(output).toContain('~/gitquest');
    expect(output).toContain('~/gitquest-feature');
    expect(output).toContain('[feature]');
  });

  it('worktree add -b crée la branche et le worktree', () => {
    const result = run(basicRepo(), 'git worktree add ../hotfix -b hotfix');
    const state = result.newState;
    expect(state.branches.hotfix).toBe(state.branches.main);
    expect(Object.values(state.worktrees).map((worktree) => worktree.path)).toContain(
      '~/hotfix',
    );
    expect(result.events.map((event) => event.type)).toEqual([
      'branch-created',
      'worktree-added',
    ]);
  });

  it('worktree add -b <nouvelle> <point de départ> part d’un autre commit', () => {
    const repo = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit src/app.ts "version feature"',
      'git commit -am "feat: app"',
    ]);
    const result = run(repo, 'git worktree add ../gitquest-hotfix -b hotfix main');
    const state = result.newState;

    expect(state.branches.hotfix).toBe(state.branches.main);
    expect(
      state.commits[state.branches.hotfix ?? '']?.snapshot['src/app.ts'],
    ).toBe('export const app = 1;');
    expect(state.worktrees.main?.head).toEqual({ kind: 'branch', branch: 'feature' });
  });

  it('worktree add sans branche dérive le nom du dossier', () => {
    const result = run(basicRepo(), 'git worktree add ../gitquest-hotfix');
    expect(result.newState.branches['gitquest-hotfix']).toBeDefined();
  });

  it('refuse un chemin déjà utilisé', () => {
    const repo = repoWithWorktree();
    expectError(repo, 'git worktree add ../gitquest-feature feature', 'worktree-path-exists');
  });

  it('refuse une branche déjà checkout ailleurs', () => {
    const repo = repoWithWorktree();
    expectError(repo, 'git switch feature', 'branch-checked-out-elsewhere');
    const error = expectError(
      repo,
      'git worktree add ../autre feature',
      'branch-checked-out-elsewhere',
    );
    expect(error.message).toContain('already checked out');
  });

  it('refuse une branche inexistante et un ajout sans commit', () => {
    expectError(basicRepo(), 'git worktree add ../x inexistante', 'branch-not-found');
    expectError(emptyRepo(), 'git worktree add ../x', 'invalid-reference');
  });

  it('refuse de supprimer le worktree principal ou le worktree actif', () => {
    expectError(repoWithWorktree(), 'git worktree remove ../gitquest', 'worktree-remove-main');
    const active = run(repoWithWorktree(), 'cd ../gitquest-feature').newState;
    expectError(active, 'git worktree remove ../gitquest-feature', 'worktree-remove-active');
  });

  it('refuse un worktree modifié sans --force, puis le supprime avec --force', () => {
    const repo = run(repoWithWorktree(), 'cd ../gitquest-feature').newState;
    const dirty = run(repo, 'touch brouillon.txt').newState;
    const back = run(dirty, 'cd ../gitquest').newState;

    expectError(
      back,
      'git worktree remove ../gitquest-feature',
      'worktree-has-local-modifications',
    );
    const removed = run(back, 'git worktree remove ../gitquest-feature --force');
    expect(
      Object.values(removed.newState.worktrees).map((worktree) => worktree.path),
    ).not.toContain('~/gitquest-feature');
  });

  it('refuse un worktree inconnu', () => {
    expectError(basicRepo(), 'git worktree remove ../inconnu', 'worktree-not-found');
  });

  it('un commit dans B est visible depuis A sans toucher au working dir de A', () => {
    const repo = run(repoWithWorktree(), 'cd ../gitquest-feature').newState;
    const beforeMainTree = repo.worktrees.main?.workingDir;
    const beforeCount = Object.keys(repo.commits).length;

    const committed = runAll(repo, [
      'edit notes.txt "depuis le worktree B"',
      'git add notes.txt',
      'git commit -m "feat: depuis B"',
    ]);

    expect(Object.keys(committed.commits)).toHaveLength(beforeCount + 1);
    expect(committed.branches.feature).toBe(committed.commits[committed.branches.feature ?? '']?.hash);
    expect(committed.worktrees.main?.workingDir).toEqual(beforeMainTree);
    expect(committed.worktrees.main?.head).toEqual({ kind: 'branch', branch: 'main' });
    expect(committed.worktrees['gitquest-feature']?.workingDir['notes.txt']).toBe(
      'depuis le worktree B',
    );
  });

  it('cd active un worktree et refuse un chemin inconnu', () => {
    const repo = run(repoWithWorktree(), 'cd ../gitquest-feature').newState;
    expect(repo.activeWorktree).toBe('gitquest-feature');
    expectError(repo, 'cd ../nulle-part', 'directory-not-found');
  });
});
