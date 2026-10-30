import { create } from 'zustand';
import { storage } from '../storage/storage';
import type { MissionDraft, PersistedStory } from '../story/types';

const PROGRESS_KEY = 'gitquest.progress.v2';
/** Miroir de compatibilité : d'anciens builds et des tests lisent encore v1. */
const LEGACY_KEY = 'gitquest.progress.v1';

export interface MissionCompletion {
  readonly stars: 1 | 2 | 3;
}

interface PersistedProgressV1 {
  readonly version: 1;
  readonly completed: Readonly<Record<string, MissionCompletion>>;
  readonly lessonSlides: Readonly<Record<string, number>>;
}

interface PersistedProgressV2 {
  readonly version: 2;
  readonly completed: Readonly<Record<string, MissionCompletion>>;
  readonly lessonSlides: Readonly<Record<string, number>>;
  readonly story: PersistedStory;
}

/** Document story vide : la Phase A ne construit pas encore le dépôt Nova. */
export function createEmptyStory(): PersistedStory {
  return {
    version: 1,
    nova: null,
    missionId: null,
    activeMission: null,
    slots: {},
    slotGroups: [],
    journal: [],
    appliedPreludes: [],
    isolated: null,
  };
}

export interface ProgressStore {
  completed: Record<string, MissionCompletion>;
  lessonSlides: Record<string, number>;
  draft: MissionDraft | null;
  story: PersistedStory;
  hydrated: boolean;
  completeMission(id: string, stars: 1 | 2 | 3): void;
  setLessonSlide(chapterId: string, index: number): void;
  saveDraft(draft: MissionDraft): void;
  clearDraft(): void;
  hydrate(): Promise<void>;
}

function bestOf(
  current: Readonly<Record<string, MissionCompletion>>,
  saved: Readonly<Record<string, MissionCompletion>>,
): Record<string, MissionCompletion> {
  const merged: Record<string, MissionCompletion> = { ...saved };
  for (const [id, completion] of Object.entries(current)) {
    const previous = merged[id];
    merged[id] = previous === undefined || completion.stars > previous.stars ? completion : previous;
  }
  return merged;
}

function migrateStory(): PersistedStory {
  return {
    ...createEmptyStory(),
    journal: [{ kind: 'migration', from: 1 }],
  };
}

function isStory(value: unknown): value is PersistedStory {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { version?: unknown }).version === 1
  );
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  completed: {},
  lessonSlides: {},
  draft: null,
  story: createEmptyStory(),
  hydrated: false,

  completeMission(id, stars) {
    const existing = get().completed[id];
    if (existing && existing.stars >= stars) return;
    const completed = { ...get().completed, [id]: { stars } };
    const story: PersistedStory = {
      ...get().story,
      journal: [...get().story.journal, { kind: 'mission-complete', missionId: id, stars }],
    };
    set({ completed, story });
    persist();
  },

  setLessonSlide(chapterId, index) {
    if (get().lessonSlides[chapterId] === index) return;
    set({ lessonSlides: { ...get().lessonSlides, [chapterId]: index } });
    persist();
  },

  saveDraft(draft) {
    const story: PersistedStory = {
      ...get().story,
      missionId: draft.missionId,
      activeMission: draft,
    };
    set({ draft, story });
    persist();
  },

  clearDraft() {
    if (get().draft === null) return;
    const story: PersistedStory = {
      ...get().story,
      missionId: null,
      activeMission: null,
    };
    set({ draft: null, story });
    persist();
  },

  async hydrate() {
    const savedV2 = await storage.get<PersistedProgressV2 | null>(PROGRESS_KEY, null);
    if (
      savedV2 !== null &&
      savedV2.version === 2 &&
      isStory(savedV2.story) &&
      savedV2.completed !== undefined
    ) {
      set({
        completed: bestOf(get().completed, savedV2.completed),
        lessonSlides: { ...savedV2.lessonSlides },
        story: savedV2.story,
        draft: savedV2.story.activeMission,
        hydrated: true,
      });
      return;
    }

    const savedV1 = await storage.get<PersistedProgressV1 | null>(LEGACY_KEY, null);
    if (savedV1 !== null && savedV1.version === 1) {
      set({
        completed: bestOf(get().completed, savedV1.completed),
        lessonSlides: { ...savedV1.lessonSlides },
        story: migrateStory(),
        draft: null,
        hydrated: true,
      });
      // v2 est écrit à la première mutation : tant que rien ne change, v1 reste
      // la source de vérité et la migration est rejouée à l'identique.
      return;
    }

    set({ hydrated: true });
  },
}));

function persist(): void {
  const { completed, lessonSlides, story } = useProgressStore.getState();
  void Promise.all([
    storage.set<PersistedProgressV2>(PROGRESS_KEY, {
      version: 2,
      completed,
      lessonSlides,
      story,
    }),
    // Miroir v1 volontairement minimal : rollback et outils existants.
    storage.set<PersistedProgressV1>(LEGACY_KEY, { version: 1, completed, lessonSlides }),
  ]).catch(() => undefined);
}
