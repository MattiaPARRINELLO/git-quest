import { describe, expect, it } from 'vitest';
import { Scenario, scenario } from '../../engine/scenario';
import {
  associateSlots,
  buildSlotTable,
  changeSetOf,
  matchesSignature,
  resolveSlot,
  unmatchedCommits,
} from '../slots';
import type { SlotDefinition } from '../types';

const entry = scenario()
  .init()
  .commit('Initial commit', { 'README.md': 'v1' })
  .build();

function slot(slotId: string, files: Record<string, string>, branch?: string | null): SlotDefinition {
  return {
    slotId,
    missionId: 'm-test',
    signature: {
      files,
      ...(branch === undefined ? {} : { branch }),
    },
  };
}

describe('résolution des slots', () => {
  it('associe un commit à un slot par son contenu', () => {
    const state = Scenario.from(entry).commit('feat: a', { 'a.txt': 'A' }).build();
    const groups = associateSlots(state, entry, [slot('s1', { 'a.txt': 'A' })]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.slots).toEqual(['s1']);
    expect(groups[0]?.message).toBe('feat: a');
  });

  it('un commit couvrant deux slots produit un seul groupe', () => {
    const state = Scenario.from(entry)
      .commit('docs: tout', { 'README.md': 'v2', 'b.txt': 'B' })
      .build();
    const slots = [slot('s1', { 'README.md': 'v2' }), slot('s2', { 'b.txt': 'B' })];

    const groups = associateSlots(state, entry, slots);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.slots).toEqual(['s1', 's2']);

    const table = buildSlotTable(slots, groups);
    expect(resolveSlot(table, 's1')).toBe(groups[0]?.commitHash);
    expect(resolveSlot(table, 's2')).toBe(groups[0]?.commitHash);
    expect(table.s1?.missionId).toBe('m-test');
  });

  it('ignore un détour et ne l’attribue à aucun slot', () => {
    const state = Scenario.from(entry)
      .commit('wip: brouillon', { 'x.txt': 'x' })
      .commit('feat: a', { 'a.txt': 'A' })
      .build();
    const slots = [slot('s1', { 'a.txt': 'A' })];
    const groups = associateSlots(state, entry, slots);

    expect(groups).toHaveLength(1);
    const detours = unmatchedCommits(state, entry, groups);
    expect(detours.map((commit) => commit.message)).toEqual(['wip: brouillon']);
  });

  it('respecte la branche attendue par la signature', () => {
    const state = Scenario.from(entry).commit('feat: a', { 'a.txt': 'A' }).build();
    expect(associateSlots(state, entry, [slot('s1', { 'a.txt': 'A' }, 'feature')])).toEqual(
      [],
    );
    expect(associateSlots(state, entry, [slot('s1', { 'a.txt': 'A' }, 'main')])).toHaveLength(1);
  });

  it('vérifie les fichiers attendus absents', () => {
    const state = Scenario.from(entry).commit('feat: a', { 'a.txt': 'A' }).build();
    const commit = Object.values(state.commits).find((candidate) => candidate.message === 'feat: a');
    if (!commit) throw new Error('commit attendu');
    const changes = changeSetOf(state, commit);

    expect(matchesSignature(commit, changes, { absent: ['a.txt'] })).toBe(false);
    expect(matchesSignature(commit, changes, { absent: ['z.txt'] })).toBe(true);
  });
});
