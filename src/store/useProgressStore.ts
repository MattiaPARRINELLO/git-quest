import { create } from 'zustand';
import { storage } from '../storage/storage';

const PROGRESS_KEY = 'gitquest.progress.v1';

/**
 * Clés de progression d'anciens prototypes (numéro affiché) à migrer vers les
 * ids sémantiques actuels. `commit-perdu` reste l'id canonique après le passage
 * de 2.4 à 2.3.
 */
const LEGACY_MISSION_KEYS: Readonly<Record<string, string>> = {
  '2.4': 'commit-perdu',
  'mission-2.4': 'commit-perdu',
  'mission-2-4': 'commit-perdu',
  'commit-perdu-2.4': 'commit-perdu',
};

function migrateCompleted(
  completed: Readonly<Record<string, MissionCompletion>>,
): Record<string, MissionCompletion> {
  const migrated: Record<string, MissionCompletion> = { ...completed };
  for (const [legacy, current] of Object.entries(LEGACY_MISSION_KEYS)) {
    const entry = migrated[legacy];
    if (!entry) continue;
    const existing = migrated[current];
    if (!existing || entry.stars > existing.stars) {
      migrated[current] = entry;
    }
    delete migrated[legacy];
  }
  return migrated;
}

export interface MissionCompletion {
  readonly stars: 1 | 2 | 3;
}

interface PersistedProgress {
  readonly version: 1;
  readonly completed: Readonly<Record<string, MissionCompletion>>;
  readonly lessonSlides: Readonly<Record<string, number>>;
}

export interface ProgressStore {
  completed: Record<string, MissionCompletion>;
  lessonSlides: Record<string, number>;
  hydrated: boolean;
  completeMission(id: string, stars: 1 | 2 | 3): void;
  setLessonSlide(chapterId: string, index: number): void;
  hydrate(): Promise<void>;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  completed: {},
  lessonSlides: {},
  hydrated: false,

  completeMission(id, stars) {
    const existing = get().completed[id];
    if (existing && existing.stars >= stars) return;
    set({ completed: { ...get().completed, [id]: { stars } } });
    persist();
  },

  setLessonSlide(chapterId, index) {
    if (get().lessonSlides[chapterId] === index) return;
    set({ lessonSlides: { ...get().lessonSlides, [chapterId]: index } });
    persist();
  },

  async hydrate() {
    const saved = await storage.get<PersistedProgress | null>(PROGRESS_KEY, null);
    if (saved && saved.version === 1) {
      set({
        completed: migrateCompleted(saved.completed),
        lessonSlides: { ...saved.lessonSlides },
        hydrated: true,
      });
      return;
    }
    set({ hydrated: true });
  },
}));

function persist(): void {
  const { completed, lessonSlides } = useProgressStore.getState();
  void storage
    .set<PersistedProgress>(PROGRESS_KEY, { version: 1, completed, lessonSlides })
    .catch(() => undefined);
}
