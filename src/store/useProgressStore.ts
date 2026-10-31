import { create } from 'zustand';
import { storage } from '../storage/storage';
import type { Mission } from '../content/types';
import { missionSequence } from '../content';
import type { RepoState } from '../engine/types';
import { applyPrelude } from '../story/chain';
import {
  checkpointAfter,
  checkpointBeforeWith,
  entryState,
  entryStateWith,
} from '../story/checkpoints';
import { lastCompletedMission as lastCompletedInJournal } from '../story/journal';
import { associateSlots, buildSlotTable } from '../story/slots';
import { STORY_SPECS } from '../story/specs';
import type { MissionDraft, PersistedStory } from '../story/types';
import type { ProgressSnapshot } from './progress-file';

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
  completeMission(id: string, stars: 1 | 2 | 3, finalState?: RepoState): void;
  setLessonSlide(chapterId: string, index: number): void;
  saveDraft(draft: MissionDraft): void;
  clearDraft(): void;
  beginMission(mission: Mission): MissionStart;
  /**
   * Adopte la copie isolée comme nouvel arbre principal : efface la suite de
   * Nova (journal/slots suivants) et conserve les étoiles déjà acquises.
   */
  adoptIsolated(state: RepoState): void;
  /** Remplace la progression par une sauvegarde importée (tout ou rien). */
  restoreProgress(snapshot: ProgressSnapshot): void;
  hydrate(): Promise<void>;
}

export interface MissionStart {
  readonly state: RepoState;
  /** Copie d'entraînement : Nova n'est jamais modifiée. */
  readonly isolated: boolean;
  /** Rejeu avec remise au checkpoint canonique. */
  readonly recalaged: boolean;
}

function storySpec(missionId: string) {
  return STORY_SPECS.find((spec) => spec.missionId === missionId);
}

function hasLaterCompletion(
  missionId: string,
  completed: Readonly<Record<string, MissionCompletion>>,
): boolean {
  const index = missionSequence.findIndex((mission) => mission.id === missionId);
  if (index < 0) return false;
  return missionSequence
    .slice(index + 1)
    .some((mission) => completed[mission.id] !== undefined);
}

/** Messages du joueur par slot, pour reconstruire l'histoire au recalage. */
function messageOverrides(story: PersistedStory): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const record of Object.values(story.slots)) {
    messages[record.slotId] = record.message;
  }
  return messages;
}

/** Nova au premier lancement : checkpoint de la première mission non terminée. */
function migrationNova(completed: Readonly<Record<string, MissionCompletion>>): RepoState | null {
  const index = missionSequence.findIndex((mission) => completed[mission.id] === undefined);
  if (index === -1) {
    const last = missionSequence[missionSequence.length - 1];
    return last === undefined ? null : checkpointAfter(last.id);
  }
  if (index === 0) {
    const first = missionSequence[0];
    return first === undefined ? null : entryState(first.id);
  }
  const previous = missionSequence[index - 1];
  return previous === undefined ? null : checkpointAfter(previous.id);
}

/** Dernière mission terminée d'après le journal (jamais d'après un hash). */
function lastCompletedMission(story: PersistedStory): string | null {
  return lastCompletedInJournal(story.journal);
}

/** Nova ne sert que s'il correspond bien au prédécesseur de la mission. */
function novaIsUsable(missionId: string, story: PersistedStory): boolean {
  const index = missionSequence.findIndex((mission) => mission.id === missionId);
  if (index < 0) return false;
  const expected = index === 0 ? null : missionSequence[index - 1]?.id ?? null;
  return lastCompletedMission(story) === expected;
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

function migrateStory(
  completed: Readonly<Record<string, MissionCompletion>>,
): PersistedStory {
  return {
    ...createEmptyStory(),
    nova: migrationNova(completed),
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

  completeMission(id, stars, finalState) {
    const existing = get().completed[id];
    const best: 1 | 2 | 3 = existing !== undefined && existing.stars >= stars ? existing.stars : stars;
    const completed = { ...get().completed, [id]: { stars: best } };
    let story = get().story;

    if (finalState !== undefined) {
      const isolated = story.isolated;
      if (isolated !== null && isolated.missionId === id) {
        story = {
          ...story,
          isolated: {
            ...isolated,
            state: finalState,
            bestStars: isolated.bestStars >= stars ? isolated.bestStars : stars,
          },
        };
      } else {
        const createdWorktrees = Object.keys(finalState.worktrees).filter(
          (worktreeId) => story.nova?.worktrees[worktreeId] === undefined,
        );
        story = {
          ...story,
          nova: finalState,
          missionId: null,
          activeMission: null,
          journal: [
            ...story.journal,
            { kind: 'mission-complete', missionId: id, stars: best },
            ...createdWorktrees.map((worktreeId) => ({
              kind: 'worktree' as const,
              missionId: id,
              path: finalState.worktrees[worktreeId]?.path ?? worktreeId,
            })),
          ],
        };
        const spec = storySpec(id);
        if (spec !== undefined) {
          const entry = get().draft?.entry ?? entryState(id);
          const groups = associateSlots(finalState, entry, spec.slots);
          story = {
            ...story,
            slots: { ...story.slots, ...buildSlotTable(spec.slots, groups) },
          };
        }
      }
    } else {
      story = {
        ...story,
        journal: [...story.journal, { kind: 'mission-complete', missionId: id, stars: best }],
      };
    }

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

  beginMission(mission) {
    const current = get();
    const spec = storySpec(mission.id);
    const alreadyCompleted = current.completed[mission.id] !== undefined;

    if (alreadyCompleted) {
      if (hasLaterCompletion(mission.id, current.completed)) {
        // Copie isolée : Nova n'est jamais touchée.
        const copied = entryState(mission.id);
        const existingIsolated = current.story.isolated;
        set({
          story: {
            ...current.story,
            isolated: {
              missionId: mission.id,
              state: copied,
              slots: {},
              bestStars: current.completed[mission.id]?.stars ?? 1,
              draft: existingIsolated?.draft ?? null,
            },
          },
        });
        return { state: copied, isolated: true, recalaged: false };
      }

      // Réécriture : recalage sur le checkpoint canonique, puis prelude inclus.
      const messages = messageOverrides(current.story);
      const previous = checkpointBeforeWith(mission.id, messages);
      const appliedPreludes = current.story.appliedPreludes.filter(
        (stepId) => spec?.prelude.some((step) => step.id === stepId) !== true,
      );
      const story: PersistedStory = {
        ...current.story,
        nova: previous,
        isolated: null,
        appliedPreludes,
        journal: [
          ...current.story.journal,
          { kind: 'recalage', missionId: mission.id, reason: 'rejeu' },
        ],
      };
      set({ story });
      persist();
      return { state: entryStateWith(mission.id, messages), isolated: false, recalaged: true };
    }

    const nova = current.story.nova;
    if (nova === null || spec === undefined || !novaIsUsable(mission.id, current.story)) {
      return { state: mission.initialState, isolated: false, recalaged: false };
    }

    // Jeu normal : on part de l'arbre réel et on applique le prelude une fois.
    // Si le prelude ne peut pas s'appliquer (état incohérent avec la chaîne),
    // on repart de l'entrée canonique plutôt que de casser la mission.
    let state = nova;
    const appliedPreludes = [...current.story.appliedPreludes];
    try {
      for (const step of spec.prelude) {
        if (appliedPreludes.includes(step.id) || step.when?.(state) === true) continue;
        state = applyPrelude(state, [step]);
        appliedPreludes.push(step.id);
      }
    } catch {
      return { state: mission.initialState, isolated: false, recalaged: false };
    }
    set({ story: { ...current.story, nova: state, appliedPreludes } });
    persist();
    return { state, isolated: false, recalaged: false };
  },

  adoptIsolated(state) {
    const current = get();
    const isolated = current.story.isolated;
    if (isolated === null) return;
    const index = missionSequence.findIndex((mission) => mission.id === isolated.missionId);
    const later = new Set(
      index < 0 ? [] : missionSequence.slice(index + 1).map((mission) => mission.id),
    );
    const slots = Object.fromEntries(
      Object.entries(current.story.slots).filter(([, record]) => !later.has(record.missionId)),
    );
    const journal = current.story.journal.filter(
      (entry) =>
        !('missionId' in entry) ||
        !later.has(entry.missionId) ||
        entry.kind === 'mission-complete',
    );
    const story: PersistedStory = {
      ...current.story,
      nova: state,
      slots,
      journal: [
        ...journal,
        {
          kind: 'recalage',
          missionId: isolated.missionId,
          reason: 'reprise depuis ici',
        },
      ],
      isolated: null,
    };
    set({ story });
    persist();
  },

  restoreProgress(snapshot) {
    set({
      completed: { ...snapshot.completed },
      lessonSlides: { ...snapshot.lessonSlides },
      story: snapshot.story,
      draft: snapshot.story.activeMission,
    });
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
        story: migrateStory(savedV1.completed),
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
