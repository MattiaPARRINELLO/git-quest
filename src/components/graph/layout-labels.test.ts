import { describe, expect, it } from 'vitest';
import { scenario } from '../../engine/scenario';
import { layoutGraph } from './layout';

describe('placement des étiquettes du graphe', () => {
  it('empile les branches sans chevauchement et place HEAD dessous', () => {
    const repo = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'a' })
      .branch('feature')
      .branch('hotfix')
      .build();

    const layout = layoutGraph(repo);
    const labels = layout.branchLabels.filter(
      (label) => label.commit === repo.branches.main,
    );
    expect(labels.map((label) => label.name).sort()).toEqual(['feature', 'hotfix', 'main']);

    const ys = labels.map((label) => label.y).sort((left, right) => left - right);
    for (let index = 1; index < ys.length; index += 1) {
      expect((ys[index] ?? 0) - (ys[index - 1] ?? 0)).toBeGreaterThanOrEqual(22);
    }

    const marker = layout.headMarkers.find((candidate) => candidate.worktreeId === 'main');
    expect(marker).toBeDefined();
    expect(marker?.y ?? 0).toBeGreaterThan(ys[ys.length - 1] ?? 0);
  });

  it('décale les étiquettes de commits voisins horizontalement', () => {
    const repo = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'a' })
      .commit('Second', { 'b.txt': 'b' })
      .build();

    const layout = layoutGraph(repo);
    const first = layout.nodes[0];
    const second = layout.nodes[1];
    if (!first || !second) throw new Error('deux nœuds attendus');
    expect(second.x - first.x).toBeGreaterThanOrEqual(140);
  });
});
