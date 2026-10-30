import { create } from 'zustand';
import { storage } from '../storage/storage';
import type { RepoState } from '../engine/types';
import type { TerminalEntry } from './useRepoStore';

const DRAFT_KEY = 'gitquest.mission-draft.v1';

/**
 * Brouillon d'une mission en cours : dépôt, terminal et compteurs suffisent à
 * reprendre exactement où le joueur s'est arrêté, sans rejouer le prelude.
 */
export interface MissionDraft {
  readonly missionId: string;
  readonly state: RepoState;
  readonly entries: readonly TerminalEntry[];
  readonly commandHistory: readonly string[];
  readonly commandsUsed: number;
  readonly hintsUsed: number;
  readonly attempted: readonly string[];
  readonly answeredQuestions: readonly string[];
}

interface PersistedDraft {
  readonly version: 1;
  readonly draft: MissionDraft;
}

export interface MissionDraftStore {
  activeMission: string | null;
  draft: MissionDraft | null;
  hydrated: boolean;
  save(draft: MissionDraft): void;
  clear(): void;
  hydrate(): Promise<void>;
}

export const useMissionDraftStore = create<MissionDraftStore>((set) => ({
  activeMission: null,
  draft: null,
  hydrated: false,

  save(draft) {
    set({ activeMission: draft.missionId, draft });
    void storage.set<PersistedDraft>(DRAFT_KEY, { version: 1, draft }).catch(() => undefined);
  },

  clear() {
    set({ activeMission: null, draft: null });
    void storage.remove(DRAFT_KEY).catch(() => undefined);
  },

  async hydrate() {
    const saved = await storage.get<PersistedDraft | null>(DRAFT_KEY, null);
    if (saved && saved.version === 1 && saved.draft?.state?.version === 1) {
      set({ activeMission: saved.draft.missionId, draft: saved.draft, hydrated: true });
      return;
    }
    set({ hydrated: true });
  },
}));
