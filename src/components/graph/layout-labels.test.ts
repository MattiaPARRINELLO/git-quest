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
      expect((ys[index] ?? 0) - (ys[index - 1] ?? 0)).toBeGreaterThanOrEqual(20);
    }

    const node = layout.nodes.find((candidate) => candidate.hash === repo.branches.main);
    expect(node).toBeDefined();
    expect(Math.abs((ys[0] ?? 0) - ((node?.y ?? 0) - 9))).toBeLessThanOrEqual(1);

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

  it('marque le commit HEAD sur le nœud lui-même (pas de pillule séparée)', () => {
    const repo = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'a' })
      .commit('Second', { 'b.txt': 'b' })
      .build();

    const layout = layoutGraph(repo);
    const headNode = layout.nodes.find((node) => node.hash === repo.branches.main);
    expect(headNode?.head).toBe(true);
    expect(headNode?.activeHead).toBe(true);
    expect(headNode?.detachedHead).toBe(false);

    const other = layout.nodes.find((node) => node.hash !== repo.branches.main);
    expect(other?.head).toBe(false);
    expect(other?.activeHead).toBe(false);
  });

  it('place les branches en alternance au-dessus et en dessous de main', () => {
    const repo = scenario()
      .init()
      .commit('Initial', { 'a.txt': 'a' })
      .branch('up')
      .checkout('up')
      .commit('up', { 'b.txt': 'b' })
      .checkout('main')
      .branch('down')
      .checkout('down')
      .commit('down', { 'c.txt': 'c' })
      .build();

    const layout = layoutGraph(repo);
    const node = (message: string) =>
      layout.nodes.find((candidate) => candidate.message === message);
    const main = node('Initial');
    const up = node('up');
    const down = node('down');
    if (!main || !up || !down) throw new Error('nœuds attendus');

    expect(up.y).toBeLessThan(main.y);
    expect(down.y).toBeGreaterThan(main.y);
  });
});
