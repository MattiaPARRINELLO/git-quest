import { describe, expect, it } from 'vitest';
import { isAncestor, mergeBase } from '../ops/refs';
import { mergeTrees } from '../ops/merge';
import { basicRepo, run, runAll } from './helpers';

describe('graphe', () => {
  it('calcule l’ascendance et la merge-base', () => {
    const feature = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit notes.txt "n"',
      'git add notes.txt',
      'git commit -m "feat"',
      'git switch main',
    ]);
    const advanced = runAll(feature, [
      'edit src/app.ts "main"',
      'git commit -am "main"',
    ]);
    const mainTip = advanced.branches.main;
    const featureTip = advanced.branches.feature;
    const base = Object.keys(advanced.commits).find(
      (hash) => advanced.commits[hash]?.parents.length === 0,
    );
    if (!mainTip || !featureTip || !base) throw new Error('graphe attendu');

    expect(isAncestor(advanced, base, mainTip)).toBe(true);
    expect(isAncestor(advanced, featureTip, mainTip)).toBe(false);
    expect(mergeBase(advanced, mainTip, featureTip)).toBe(base);
  });

  it('trouve la merge-base d’un merge commit', () => {
    const feature = runAll(basicRepo(), [
      'git branch feature',
      'git switch feature',
      'edit notes.txt "n"',
      'git add notes.txt',
      'git commit -m "feat"',
      'git switch main',
    ]);
    const advanced = runAll(feature, [
      'edit src/app.ts "main"',
      'git commit -am "main"',
    ]);
    const merged = run(advanced, 'git merge feature').newState;
    const tip = merged.branches.main;
    if (!tip) throw new Error('main attendue');
    const commit = merged.commits[tip];
    if (!commit) throw new Error('commit attendu');

    expect(commit.parents).toHaveLength(2);
    expect(mergeBase(merged, commit.parents[0] ?? '', commit.parents[1] ?? '')).toBe(
      mergeBase(merged, advanced.branches.main ?? '', advanced.branches.feature ?? ''),
    );
  });
});

describe('mergeTrees', () => {
  it('prend le côté unique modifié', () => {
    const result = mergeTrees(
      { a: 'base', b: 'base' },
      { a: 'main', b: 'base' },
      { a: 'base', b: 'feature' },
    );
    expect(result.conflicts).toEqual([]);
    expect(result.tree).toEqual({ a: 'main', b: 'feature' });
  });

  it('accepte des modifications identiques', () => {
    const result = mergeTrees({ a: 'base' }, { a: 'même' }, { a: 'même' });
    expect(result.tree).toEqual({ a: 'même' });
  });

  it('signale un conflit', () => {
    const result = mergeTrees({ a: 'base' }, { a: 'main' }, { a: 'feature' });
    expect(result.conflicts).toEqual(['a']);
  });

  it('gère ajouts et suppressions', () => {
    const result = mergeTrees(
      { garde: 'x', supprime: 'x' },
      { garde: 'x', ajoute: 'main' },
      { garde: 'x' },
    );
    expect(result.tree).toEqual({ garde: 'x', ajoute: 'main' });
  });
});
