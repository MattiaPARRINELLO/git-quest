import { describe, expect, it } from 'vitest';
import {
  appendJournal,
  completedMissions,
  createdWorktrees,
  detours,
  entriesForMission,
  lastCompletedMission,
  recalages,
} from '../journal';
import type { JournalEntry } from '../types';

const base: readonly JournalEntry[] = [
  { kind: 'migration', from: 1 },
  { kind: 'mission-complete', missionId: 'trois-zones', stars: 3 },
  { kind: 'detour', missionId: 'snapshot-fige', afterSlot: 'm1.1-c1', message: 'wip' },
  { kind: 'mission-complete', missionId: 'snapshot-fige', stars: 2 },
  { kind: 'worktree', missionId: 'hotfix-worktree', path: '~/gitquest-hotfix' },
  { kind: 'recalage', missionId: 'piege-am', reason: 'rejeu' },
];

describe('journal du parcours', () => {
  it('n’écrit que des slots, jamais des hashes', () => {
    const serialized = JSON.stringify(base);
    expect(serialized).not.toMatch(/[0-9a-f]{7}/);
  });

  it('retrouve la dernière mission terminée et les missions finies', () => {
    expect(lastCompletedMission(base)).toBe('snapshot-fige');
    expect(completedMissions(base)).toEqual(['trois-zones', 'snapshot-fige']);
  });

  it('liste recalages, détours et worktrees créés', () => {
    expect(recalages(base)).toEqual(['piege-am']);
    expect(createdWorktrees(base)).toEqual(['~/gitquest-hotfix']);
    expect(detours(base)).toHaveLength(1);
    expect(detours(base)[0]?.afterSlot).toBe('m1.1-c1');
  });

  it('filtre les entrées d’une mission et ajoute sans muter', () => {
    expect(entriesForMission(base, 'snapshot-fige')).toHaveLength(2);
    const next = appendJournal(base, { kind: 'mission-complete', missionId: 'piege-am', stars: 1 });
    expect(next).toHaveLength(base.length + 1);
    expect(base).toHaveLength(6);
    expect(lastCompletedMission(next)).toBe('piege-am');
  });
});
