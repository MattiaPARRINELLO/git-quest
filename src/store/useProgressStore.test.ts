import { beforeEach, describe, expect, it } from 'vitest';
import { findMission, isMissionUnlocked } from '../content';
import { storage } from '../storage/storage';
import { useProgressStore } from './useProgressStore';

const KEY = 'gitquest.progress.v1';

/**
 * Fixture copiée du format réellement écrit par persist.ts :
 * { version: 1, completed: { [missionId]: { stars } }, lessonSlides }.
 * La mission renumérotée 2.4 → 2.3 a conservé son id `commit-perdu`.
 */
const STORED_PROGRESS_FIXTURE = {
  version: 1 as const,
  completed: { 'commit-perdu': { stars: 2 } },
  lessonSlides: { branches: 2 },
};

describe('progression persistée (format réel)', () => {
  beforeEach(async () => {
    await storage.remove(KEY);
    useProgressStore.setState({ completed: {}, lessonSlides: {}, hydrated: false });
  });

  it('recharge une mission 2.4 terminée sous son id réel, désormais 2.3', async () => {
    await storage.set(KEY, STORED_PROGRESS_FIXTURE);

    await useProgressStore.getState().hydrate();

    expect(useProgressStore.getState().completed['commit-perdu']).toEqual({ stars: 2 });
    expect(useProgressStore.getState().lessonSlides.branches).toBe(2);
    expect(findMission('commit-perdu')?.number).toBe('2.3');
    expect(
      isMissionUnlocked('avance-rapide', useProgressStore.getState().completed),
    ).toBe(true);
  });

  it('réécrit exactement le même format après une complétion', async () => {
    await useProgressStore.getState().hydrate();
    useProgressStore.getState().completeMission('commit-perdu', 3);

    const saved = await storage.get<typeof STORED_PROGRESS_FIXTURE | null>(KEY, null);
    expect(saved).toEqual({
      version: 1,
      completed: { 'commit-perdu': { stars: 3 } },
      lessonSlides: {},
    });
  });
});
