import { create } from 'zustand';
import { storage } from '../storage/storage';

const PROGRESS_KEY = 'gitquest.progress.v1';

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
        completed: { ...saved.completed },
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
