import { beforeEach, describe, expect, it } from 'vitest';
import { storage } from '../storage/storage';
import { useProgressStore } from './useProgressStore';

const KEY = 'gitquest.progress.v1';

describe('migration de progression', () => {
  beforeEach(async () => {
    await storage.remove(KEY);
    useProgressStore.setState({ completed: {}, lessonSlides: {}, hydrated: false });
  });

  it('migre l’ancienne clé 2.4 vers commit-perdu (mission 2.3)', async () => {
    await storage.set(KEY, {
      version: 1,
      completed: { '2.4': { stars: 2 } },
      lessonSlides: {},
    });

    await useProgressStore.getState().hydrate();

    expect(useProgressStore.getState().completed['commit-perdu']).toEqual({ stars: 2 });
    expect(useProgressStore.getState().completed['2.4']).toBeUndefined();
  });

  it('conserve le meilleur score en cas de collision', async () => {
    await storage.set(KEY, {
      version: 1,
      completed: { '2.4': { stars: 2 }, 'commit-perdu': { stars: 3 } },
      lessonSlides: {},
    });

    await useProgressStore.getState().hydrate();

    expect(useProgressStore.getState().completed['commit-perdu']).toEqual({ stars: 3 });
  });
});
