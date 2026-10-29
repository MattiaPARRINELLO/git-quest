import { describe, expect, it } from 'vitest';
import { layoutGraph, X_SPACING } from './layout';
import { scenario } from '../../engine/scenario';
import { execute } from '../../engine/execute';
import type { RepoState } from '../../engine/types';

function run(state: RepoState, command: string): RepoState {
  const result = execute(state, command);
  if (result.error) throw new Error(result.error.message);
  return result.newState;
}

function positions(state: RepoState): Map<string, { x: number; y: number }> {
  return new Map(
    layoutGraph(state).nodes.map((node) => [node.hash, { x: node.x, y: node.y }]),
  );
}

function expectStable(before: RepoState, after: RepoState): void {
  const beforePositions = positions(before);
  const afterPositions = positions(after);
  for (const [hash, position] of beforePositions) {
    expect(afterPositions.get(hash), `commit ${hash} doit garder sa position`).toEqual(position);
  }
}

const base = scenario()
  .init()
  .commit('Initial commit', { 'README.md': '# Projet' })
  .build();

describe('layoutGraph', () => {
  it('place les commits de gauche à droite, une lane par branche', () => {
    const repo = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'a' })
      .branch('feature')
      .checkout('feature')
      .commit('feat', { 'b.txt': 'b' })
      .checkout('main')
      .commit('main', { 'c.txt': 'c' })
      .build();

    const layout = layoutGraph(repo);
    const mainCommits = layout.nodes.filter((node) => node.branch === 'main');
    const featureCommits = layout.nodes.filter((node) => node.branch === 'feature');

    expect(new Set(mainCommits.map((node) => node.lane)).size).toBe(1);
    expect(new Set(featureCommits.map((node) => node.lane)).size).toBe(1);
    expect(mainCommits[0]?.lane).not.toBe(featureCommits[0]?.lane);
    expect(mainCommits[0]?.x).toBeLessThan(mainCommits[1]?.x ?? 0);
  });

  it('ne déplace aucun commit existant quand on ajoute un commit', () => {
    const after = run(base, 'edit README.md "v2"');
    const committed = run(after, 'git commit -am "v2"');
    expectStable(base, committed);
  });

  it('garde des colonnes consécutives malgré 5 edits entre deux commits', () => {
    let repo = base;
    for (let index = 0; index < 5; index += 1) {
      repo = run(repo, `edit README.md "brouillon ${index}"`);
    }
    const first = run(repo, 'git commit -am "docs: premier"');
    const second = run(first, 'edit README.md "encore"');
    const third = run(second, 'git commit -am "docs: second"');

    const layout = layoutGraph(third);
    const firstTip = third.branches.main;
    if (!firstTip) throw new Error('main attendue');
    const previous = Object.values(third.commits)
      .filter((commit) => commit.hash !== firstTip)
      .sort((left, right) => left.timestamp - right.timestamp);
    const before = previous[previous.length - 1];
    if (!before) throw new Error('commit précédent attendu');

    const beforeNode = layout.nodes.find((node) => node.hash === before.hash);
    const tipNode = layout.nodes.find((node) => node.hash === firstTip);
    expect(tipNode?.x).toBe((beforeNode?.x ?? 0) + X_SPACING);
  });

  it('ne déplace aucun commit existant quand on crée une branche', () => {
    const after = run(base, 'git branch feature');
    expectStable(base, after);
    const layout = layoutGraph(after);
    expect(layout.branchLabels.some((label) => label.name === 'feature')).toBe(true);
  });

  it('ne déplace aucun commit existant quand on fusionne', () => {
    const diverged = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'a' })
      .branch('feature')
      .checkout('feature')
      .commit('feat', { 'b.txt': 'b' })
      .checkout('main')
      .commit('main', { 'a.txt': 'main' })
      .build();

    const merged = run(diverged, 'git merge feature');
    expectStable(diverged, merged);

    const layout = layoutGraph(merged);
    const mergeCommit = layout.nodes.find((node) => node.parents.length === 2);
    expect(mergeCommit).toBeDefined();
    if (mergeCommit === undefined) throw new Error('merge commit attendu');
    const incoming = layout.edges.filter((edge) => edge.toHash === mergeCommit.hash);
    expect(incoming).toHaveLength(2);
    expect(incoming.some((edge) => edge.isMergeParent)).toBe(true);
  });

  it('signale les commits orphelins sans les masquer', () => {
    const repo = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'a' })
      .build();
    const base = repo.branches.main;
    if (!base) throw new Error('main attendue');

    const detached = run(run(repo, `git checkout ${base}`), 'edit a.txt "exp"');
    const orphanHead = run(run(detached, 'git add a.txt'), 'git commit -m "expérience"');
    const head = orphanHead.worktrees.main?.head;
    if (head?.kind !== 'detached') throw new Error('HEAD détaché attendu');

    const back = run(orphanHead, 'git switch main');
    const layout = layoutGraph(back);
    const orphan = layout.nodes.find((node) => node.hash === head.commit);

    expect(orphan).toBeDefined();
    expect(orphan?.orphan).toBe(true);
    expect(layout.nodes.find((node) => node.hash === base)?.orphan).toBe(false);
    expect(layoutGraph(orphanHead).nodes.find((node) => node.hash === head.commit)?.orphan).toBe(
      false,
    );
  });

  it('place un marqueur HEAD par worktree, y compris détaché', () => {
    const repo = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'a' })
      .branch('feature')
      .worktreeAdd('../gitquest-feature', { branch: 'feature' })
      .build();
    const main = repo.branches.main;
    if (!main) throw new Error('main attendue');

    const detached = run(repo, `git checkout ${main}`);
    const layout = layoutGraph(detached);

    expect(layout.headMarkers).toHaveLength(2);
    const mainMarker = layout.headMarkers.find((marker) => marker.worktreeId === 'main');
    const featureMarker = layout.headMarkers.find(
      (marker) => marker.worktreeId === 'gitquest-feature',
    );
    expect(mainMarker?.detached).toBe(true);
    expect(featureMarker?.detached).toBe(false);
    expect(featureMarker?.branch).toBe('feature');
  });

  it('regroupe plusieurs étiquettes de branches sur le même commit', () => {
    const repo = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'a' })
      .branch('feature')
      .build();

    const layout = layoutGraph(repo);
    const labels = layout.branchLabels.filter(
      (label) => label.commit === repo.branches.main,
    );
    expect(labels.map((label) => label.name).sort()).toEqual(['feature', 'main']);
    expect(labels[0]?.y).not.toBe(labels[1]?.y);
  });
});
