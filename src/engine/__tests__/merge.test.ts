import { describe, expect, it } from 'vitest';
import { execute } from '../execute';
import {
  activeWorktree,
  basicRepo,
  commitMessages,
  expectError,
  removeWorkingFile,
  run,
  runAll,
} from './helpers';

function repoWithFeatureNotes() {
  return runAll(basicRepo(), [
    'git branch feature',
    'git switch feature',
    'edit notes.txt "notes de feature"',
    'git add notes.txt',
    'git commit -m "feat: notes"',
    'git switch main',
  ]);
}

describe('git merge', () => {
  it('fast-forward : déplace la branche sans créer de commit', () => {
    const repo = repoWithFeatureNotes();
    const featureTip = repo.branches.feature;
    const commitCount = Object.keys(repo.commits).length;

    const result = run(repo, 'git merge feature');
    const state = result.newState;

    expect(state.branches.main).toBe(featureTip);
    expect(Object.keys(state.commits)).toHaveLength(commitCount);
    expect(state.worktrees.main?.workingDir['notes.txt']).toBe('notes de feature');
    expect(result.events.map((event) => event.type)).toEqual([
      'branch-moved',
      'merge-fast-forward',
    ]);
    expect(result.output.map((line) => line.text)).toContain('Fast-forward');
  });

  it('« Already up to date » si la cible est déjà un ancêtre', () => {
    const repo = run(run(basicRepo(), 'git branch feature').newState, 'git switch feature').newState;
    const result = run(repo, 'git merge main');
    expect(result.output[0]?.text).toBe('Already up to date.');
    expect(result.newState).toBe(repo);
  });

  it('crée un merge commit à deux parents quand les historiques divergent', () => {
    const feature = repoWithFeatureNotes();
    const advanced = runAll(feature, [
      'edit src/app.ts "version main"',
      'git commit -am "feat: main avance"',
    ]);
    const mainTip = advanced.branches.main;
    const featureTip = advanced.branches.feature;
    if (!mainTip || !featureTip) throw new Error('branches attendues');

    const result = run(advanced, 'git merge feature');
    const state = result.newState;
    const merge = state.branches.main;

    expect(merge).toBeDefined();
    if (!merge) throw new Error('merge attendu');
    expect(state.commits[merge]?.parents).toEqual([mainTip, featureTip]);
    expect(state.commits[merge]?.snapshot['notes.txt']).toBe('notes de feature');
    expect(state.commits[merge]?.snapshot['src/app.ts']).toBe('version main');
    expect(commitMessages(state)).toContain("Merge branch 'feature'");
    expect(result.events.map((event) => event.type)).toEqual([
      'commit-created',
      'branch-moved',
      'merge-commit',
    ]);
  });

  it('3-way : un seul côté modifié → on prend ce côté', () => {
    const feature = repoWithFeatureNotes();
    const advanced = runAll(feature, [
      'edit src/app.ts "main"',
      'git commit -am "feat: app main"',
    ]);
    const merged = run(advanced, 'git merge feature').newState;
    const tip = merged.branches.main;
    if (!tip) throw new Error('main attendue');

    expect(merged.commits[tip]?.snapshot['src/app.ts']).toBe('main');
    expect(merged.commits[tip]?.snapshot['notes.txt']).toBe('notes de feature');
  });

  it('3-way : modifications identiques → pas de conflit', () => {
    const feature = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit README.md "version commune"',
      'git commit -am "feature: readme"',
      'git switch main',
    ]);
    const main = runAll(feature, [
      'edit README.md "version commune"',
      'git commit -am "main: readme"',
    ]);

    const result = execute(main, 'git merge feature');
    expect(result.error).toBeUndefined();
    const tip = result.newState.branches.main;
    if (!tip) throw new Error('main attendue');
    expect(result.newState.commits[tip]?.snapshot['README.md']).toBe('version commune');
  });

  it('3-way : modifications différentes → fusion en conflit', () => {
    const feature = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit README.md "version feature"',
      'git commit -am "feature: readme"',
      'git switch main',
    ]);
    const main = runAll(feature, [
      'edit README.md "version main"',
      'git commit -am "main: readme"',
    ]);
    const mainTip = main.branches.main;

    const result = execute(main, 'git merge feature');
    const worktree = activeWorktree(result.newState);

    expect(result.error).toBeUndefined();
    expect(result.newState.branches.main).toBe(mainTip);
    expect(result.newState.worktrees.main?.merge?.branch).toBe('feature');
    expect(result.newState.worktrees.main?.merge?.conflicts.map((c) => c.path)).toEqual([
      'README.md',
    ]);
    expect(worktree?.workingDir['README.md']).toBe(
      ['<<<<<<< HEAD', 'version main', '=======', 'version feature', '>>>>>>> feature', ''].join(
        '\n',
      ),
    );
    // L'index reste sur la version de HEAD tant que le conflit n'est pas résolu.
    expect(worktree?.index['README.md']).toBe('version main');
    expect(result.output.map((line) => line.text)).toContain(
      'CONFLICT (content): Merge conflict in README.md',
    );
    expect(result.events.map((event) => event.type)).toEqual(['merge-conflict']);
  });

  it('git add puis git commit concluent la fusion', () => {
    const conflicted = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit README.md "version feature"',
      'git commit -am "feature: readme"',
      'git switch main',
      'edit README.md "version main"',
      'git commit -am "main: readme"',
    ]);
    const featureTip = conflicted.branches.feature;
    const mainTip = conflicted.branches.main;

    const merged = run(conflicted, 'git merge feature').newState;
    const resolved = run(merged, 'edit README.md "version finale"').newState;
    const added = run(resolved, 'git add README.md');

    expect(activeWorktree(added.newState).merge?.conflicts).toEqual([]);
    expect(added.events.map((event) => event.type)).toEqual([
      'conflict-resolved',
      'file-staged',
    ]);

    const result = run(added.newState, 'git commit -m "merge: readme"');
    const tip = result.newState.branches.main;
    if (!tip || !featureTip || !mainTip) throw new Error('commits attendus');

    expect(result.newState.worktrees.main?.merge).toBeUndefined();
    expect(result.newState.commits[tip]?.parents).toEqual([mainTip, featureTip]);
    expect(result.newState.commits[tip]?.snapshot['README.md']).toBe('version finale');
    expect(result.events.map((event) => event.type)).toEqual([
      'commit-created',
      'branch-moved',
      'merge-commit',
    ]);
  });

  it('refuse de commiter tant qu’un conflit reste', () => {
    const conflicted = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit README.md "feature"',
      'git commit -am "feature: readme"',
      'git switch main',
      'edit README.md "main"',
      'git commit -am "main: readme"',
      'git merge feature',
    ]);

    const error = expectError(conflicted, 'git commit -m "merge"', 'unmerged-files');
    expect(error.message).toContain('you have unmerged files');
    expectError(conflicted, 'git merge --continue', 'unmerged-files');
  });

  it('git merge --abort restaure l’état d’avant la fusion', () => {
    const before = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit README.md "feature"',
      'git commit -am "feature: readme"',
      'git switch main',
      'edit README.md "main"',
      'git commit -am "main: readme"',
    ]);
    const conflicted = run(before, 'git merge feature').newState;
    const result = run(conflicted, 'git merge --abort');
    const worktree = activeWorktree(result.newState);

    expect(worktree.merge).toBeUndefined();
    expect(worktree.workingDir['README.md']).toBe('main');
    expect(worktree.index['README.md']).toBe('main');
    expect(result.newState.branches.main).toBe(before.branches.main);
    expect(result.events).toEqual([{ type: 'merge-aborted', branch: 'feature' }]);
  });

  it('git merge --continue termine la fusion avec le message par défaut', () => {
    const conflicted = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit README.md "feature"',
      'git commit -am "feature: readme"',
      'git switch main',
      'edit README.md "main"',
      'git commit -am "main: readme"',
      'git merge feature',
      'edit README.md "version finale"',
      'git add README.md',
    ]);

    const result = run(conflicted, 'git merge --continue');
    const tip = result.newState.branches.main;
    if (!tip) throw new Error('main attendue');

    expect(result.newState.commits[tip]?.message).toBe("Merge branch 'feature'");
    expect(result.newState.commits[tip]?.snapshot['README.md']).toBe('version finale');
    expect(activeWorktree(result.newState).merge).toBeUndefined();
  });

  it('git status affiche les chemins en conflit', () => {
    const conflicted = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit README.md "feature"',
      'git commit -am "feature: readme"',
      'git switch main',
      'edit README.md "main"',
      'git commit -am "main: readme"',
      'git merge feature',
    ]);

    const texts = run(conflicted, 'git status').output.map((line) => line.text);
    expect(texts).toContain('You have unmerged paths.');
    expect(texts).toContain('Unmerged paths:');
    expect(texts).toContain('\tboth modified:   README.md');
  });

  it('interdit de changer de branche pendant une fusion', () => {
    const conflicted = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit README.md "feature"',
      'git commit -am "feature: readme"',
      'git switch main',
      'edit README.md "main"',
      'git commit -am "main: readme"',
      'git merge feature',
    ]);

    expectError(conflicted, 'git switch feature', 'merge-in-progress');
    expectError(conflicted, 'git merge main', 'merge-in-progress');
    expectError(conflicted, 'git merge --abort --continue', 'invalid-option');
  });

  it('3-way : une suppression d’un côté est conservée', () => {
    let repo = runAll(basicRepo(), ['git branch feature', 'git switch feature']);
    repo = removeWorkingFile(repo, 'README.md');
    repo = runAll(repo, [
      'git add README.md',
      'git commit -m "chore: supprime readme"',
      'git switch main',
    ]);
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

  it('3-way : suppression d’un côté et modification de l’autre → conflit', () => {
    let repo = runAll(basicRepo(), ['git branch feature', 'git switch feature']);
    repo = removeWorkingFile(repo, 'README.md');
    repo = runAll(repo, [
      'git add README.md',
      'git commit -m "chore: supprime readme"',
      'git switch main',
    ]);
    repo = runAll(repo, [
      'edit README.md "version main"',
      'git commit -am "main: readme"',
    ]);

    const result = execute(repo, 'git merge feature');
    expect(result.error).toBeUndefined();
    expect(result.newState.worktrees.main?.merge?.conflicts).toEqual([
      { path: 'README.md', base: '# Projet', ours: 'version main' },
    ]);
    expect(run(result.newState, 'git status').output.map((line) => line.text)).toContain(
      '\tdeleted by them: README.md',
    );
  });

  it('refuse une branche inconnue', () => {
    expectError(basicRepo(), 'git merge inconnue', 'branch-not-found');
  });

  it('refuse si les modifications locales seraient écrasées', () => {
    const feature = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit README.md "feature"',
      'git commit -am "feature: readme"',
      'git switch main',
    ]);
    const dirty = run(feature, 'edit README.md "local"').newState;
    expectError(dirty, 'git merge feature', 'local-changes-would-be-overwritten');
  });

  it('merge en HEAD détaché : head-moved, aucune branche déplacée', () => {
    const feature = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit notes.txt "notes"',
      'git add notes.txt',
      'git commit -m "feat: notes"',
      'git switch main',
      'edit README.md "main"',
      'git commit -am "main: readme"',
    ]);
    const mainTip = feature.branches.main;
    if (!mainTip) throw new Error('main attendue');
    const detached = run(feature, `git checkout ${mainTip}`).newState;

    const result = run(detached, 'git merge feature');
    expect(result.newState.branches.main).toBe(mainTip);
    expect(result.newState.worktrees.main?.head.kind).toBe('detached');
    expect(result.events.map((event) => event.type)).toContain('head-moved');
    expect(result.events.map((event) => event.type)).toContain('merge-commit');
  });
});
