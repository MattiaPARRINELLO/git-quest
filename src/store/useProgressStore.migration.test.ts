import { beforeEach, describe, expect, it } from 'vitest';
import { storage } from '../storage/storage';
import { createEmptyStory, useProgressStore } from './useProgressStore';

const V1 = 'gitquest.progress.v1';
const V2 = 'gitquest.progress.v2';

const V1_FIXTURE = {
  version: 1 as const,
  completed: { 'commit-perdu': { stars: 2 } },
  lessonSlides: { branches: 2 },
};

interface Stored {
  readonly version: 2;
  readonly completed: Record<string, { stars: number }>;
  readonly lessonSlides: Record<string, number>;
  readonly story: { readonly nova: unknown; readonly journal: readonly { kind: string }[] };
}

describe('migration de progression v1 → v2', () => {
  beforeEach(async () => {
    await storage.remove(V1);
    await storage.remove(V2);
    useProgressStore.setState({
      completed: {},
      lessonSlides: {},
      draft: null,
      story: createEmptyStory(),
      hydrated: false,
    });
  });

  it('conserve les missions terminées et les slides de cours', async () => {
    await storage.set(V1, V1_FIXTURE);

    await useProgressStore.getState().hydrate();

    const state = useProgressStore.getState();
    expect(state.completed['commit-perdu']).toEqual({ stars: 2 });
    expect(state.lessonSlides.branches).toBe(2);
    expect(state.draft).toBeNull();
    expect(state.story.nova).toBeNull();
    expect(state.story.journal).toEqual([{ kind: 'migration', from: 1 }]);
    expect(await storage.get(V2, null)).toBeNull();
  });

  it('passe en v2 à la première mutation et garde les meilleures étoiles', async () => {
    await storage.set(V1, V1_FIXTURE);
    await useProgressStore.getState().hydrate();

    useProgressStore.getState().completeMission('commit-perdu', 1);
    expect(useProgressStore.getState().completed['commit-perdu']).toEqual({ stars: 2 });

    useProgressStore.getState().completeMission('commit-perdu', 3);
    expect(useProgressStore.getState().completed['commit-perdu']).toEqual({ stars: 3 });

    const saved = await storage.get<Stored | null>(V2, null);
    expect(saved?.version).toBe(2);
    expect(saved?.completed['commit-perdu']).toEqual({ stars: 3 });
    expect(saved?.lessonSlides.branches).toBe(2);
    expect(saved?.story.nova).toBeNull();
    expect(saved?.story.journal.map((entry) => entry.kind)).toContain('mission-complete');

    // Le miroir v1 reste minimal et lisible par les anciens builds.
    expect(await storage.get(V1, null)).toEqual({
      version: 1,
      completed: { 'commit-perdu': { stars: 3 } },
      lessonSlides: { branches: 2 },
    });
  });

  it('préfère v2 quand les deux documents existent', async () => {
    await storage.set(V1, { ...V1_FIXTURE, completed: { 'commit-perdu': { stars: 1 } } });
    await storage.set(V2, {
      version: 2,
      completed: { 'commit-perdu': { stars: 3 }, 'trois-zones': { stars: 2 } },
      lessonSlides: { branches: 1 },
      story: createEmptyStory(),
    });

    await useProgressStore.getState().hydrate();

    const state = useProgressStore.getState();
    expect(state.completed['commit-perdu']).toEqual({ stars: 3 });
    expect(state.completed['trois-zones']).toEqual({ stars: 2 });
    expect(state.lessonSlides.branches).toBe(1);
  });

  it('ne fait jamais baisser une étoile déjà acquise en mémoire', async () => {
    useProgressStore.setState({ completed: { 'trois-zones': { stars: 3 } } });
    await storage.set(V1, { version: 1, completed: { 'trois-zones': { stars: 1 } }, lessonSlides: {} });

    await useProgressStore.getState().hydrate();

    expect(useProgressStore.getState().completed['trois-zones']).toEqual({ stars: 3 });
  });
});
