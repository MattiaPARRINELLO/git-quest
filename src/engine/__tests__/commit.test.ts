import { describe, expect, it } from 'vitest';
import { execute } from '../execute';
import { basicRepo, commitMessages, expectError, run } from './helpers';

describe('git commit', () => {
  it('crée un commit racine et la branche main au premier commit', () => {
    const result = run(basicRepo(), 'git status');
    const state = result.newState;
    expect(state.branches.main).toBeDefined();

    const repo = basicRepo();
    const commit = repo.commits[repo.branches.main ?? ''];
    expect(commit?.parents).toEqual([]);
    expect(commit?.snapshot['README.md']).toBe('# Projet');
  });

  it('refuse un message non quoté comme Git (pathspec)', () => {
    const repo = basicRepo();
    const error = expectError(
      repo,
      'git commit -m feat: login',
      'commit-message-not-quoted',
    );
    expect(error.message).toBe(
      "error: pathspec 'login' did not match any file(s) known to git",
    );
  });

  it('refuse un commit sans rien d’indexé', () => {
    expectError(basicRepo(), 'git commit -m vide', 'nothing-to-commit');

    const modified = run(basicRepo(), 'edit README.md "autre"').newState;
    expectError(modified, 'git commit -m oubli', 'no-changes-added');

    const untracked = run(basicRepo(), 'touch notes.txt').newState;
    expectError(untracked, 'git commit -m oubli', 'no-changes-added');
  });

  it('commit -am indexe le suivi mais pas les fichiers non suivis', () => {
    const repo = run(
      run(basicRepo(), 'edit README.md "v2"').newState,
      'touch brouillon.txt',
    ).newState;

    const result = run(repo, 'git commit -am "docs: v2"');
    const worktree = result.newState.worktrees.main;
    expect(worktree?.index['README.md']).toBe('v2');
    expect(worktree?.index['brouillon.txt']).toBeUndefined();
    expect(commitMessages(result.newState)).toContain('docs: v2');
  });

  it('ne déplace que la branche de HEAD', () => {
    const repo = run(run(basicRepo(), 'git branch feature').newState, 'git checkout feature').newState;
    const before = repo.branches.main;
    const result = run(
      run(repo, 'edit README.md "feature"').newState,
      'git commit -am "feat: readme"',
    );

    expect(result.newState.branches.main).toBe(before);
    expect(result.newState.branches.feature).not.toBe(before);
    expect(result.newState.worktrees.main?.head).toEqual({
      kind: 'branch',
      branch: 'feature',
    });
  });

  it('émet commit-created puis branch-moved, sans événement HEAD', () => {
    const repo = run(run(basicRepo(), 'edit README.md "v2"').newState, 'git add README.md').newState;
    const result = run(repo, 'git commit -m "v2"');

    expect(result.events.map((event) => event.type)).toEqual([
      'commit-created',
      'branch-moved',
    ]);
  });

  it('commit en HEAD détaché : head-moved, branches inchangées', () => {
    const repo = basicRepo();
    const original = repo.branches.main;
    if (!original) throw new Error('main attendue');
    const detached = run(repo, `git checkout ${original}`).newState;
    const prepared = run(
      run(detached, 'edit README.md "expérience"').newState,
      'git add README.md',
    ).newState;

    const result = execute(prepared, 'git commit -m "expérience"');
    expect(result.error).toBeUndefined();
    const state = result.newState;

    expect(state.branches.main).toBe(original);
    expect(state.worktrees.main?.head.kind).toBe('detached');
    const newHead = state.worktrees.main?.head;
    if (newHead?.kind !== 'detached') throw new Error('HEAD détaché attendu');
    expect(newHead.commit).not.toBe(original);
    expect(commitMessages(state)).toContain('expérience');
    expect(result.events.map((event) => event.type)).toEqual([
      'commit-created',
      'head-moved',
    ]);
  });

  it('un commit détaché devient orphelin après un switch', () => {
    const repo = basicRepo();
    const main = repo.branches.main;
    if (!main) throw new Error('main attendue');
    const detached = run(repo, `git checkout ${main}`).newState;
    const committed = run(
      run(
        run(detached, 'edit README.md "expérience"').newState,
        'git add README.md',
      ).newState,
      'git commit -m "expérience"',
    ).newState;
    const orphan = committed.worktrees.main?.head;
    if (orphan?.kind !== 'detached') throw new Error('HEAD détaché attendu');

    const switched = run(committed, 'git switch main').newState;
    const referenced = new Set(Object.values(switched.branches));
    expect(referenced.has(orphan.commit)).toBe(false);
    expect(switched.commits[orphan.commit]).toBeDefined();
    expect(switched.worktrees.main?.workingDir['README.md']).toBe('# Projet');
  });

  it('le snapshot vient de l’index, pas du working dir', () => {
    const repo = run(basicRepo(), 'edit README.md "indexé"').newState;
    const staged = run(repo, 'git add README.md').newState;
    const changedAfterAdd = run(staged, 'edit README.md "pas indexé"').newState;
    const committed = run(changedAfterAdd, 'git commit -m "index seulement"').newState;
    const tip = committed.branches.main;
    if (!tip) throw new Error('main attendue');

    expect(committed.commits[tip]?.snapshot['README.md']).toBe('indexé');
    expect(committed.worktrees.main?.workingDir['README.md']).toBe('pas indexé');
  });
});
