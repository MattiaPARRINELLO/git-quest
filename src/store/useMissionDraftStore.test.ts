import { beforeEach, describe, expect, it } from 'vitest';
import { createSandboxState } from '../content/sandbox';
import { storage } from '../storage/storage';
import { useMissionDraftStore } from './useMissionDraftStore';
import type { MissionDraft } from './useMissionDraftStore';

const KEY = 'gitquest.mission-draft.v1';

const draft: MissionDraft = {
  missionId: 'trois-zones',
  state: createSandboxState(),
  entries: [{ id: 1, kind: 'output', text: 'Mission 1.1 — Trois zones' }],
  commandHistory: ['git status'],
  commandsUsed: 1,
  hintsUsed: 0,
  attempted: ['git status'],
  answeredQuestions: ['Où part le fichier ?'],
};

describe('brouillon de mission', () => {
  beforeEach(async () => {
    await storage.remove(KEY);
    useMissionDraftStore.setState({ activeMission: null, draft: null, hydrated: false });
  });

  it('persiste le brouillon et expose la mission active', async () => {
    useMissionDraftStore.getState().save(draft);

    expect(useMissionDraftStore.getState().activeMission).toBe('trois-zones');
    expect(await storage.get(KEY, null)).toEqual({ version: 1, draft });
  });

  it('recharge un brouillon après redémarrage', async () => {
    useMissionDraftStore.getState().save(draft);
    useMissionDraftStore.setState({ activeMission: null, draft: null, hydrated: false });

    await useMissionDraftStore.getState().hydrate();

    expect(useMissionDraftStore.getState().activeMission).toBe('trois-zones');
    expect(useMissionDraftStore.getState().draft).toEqual(draft);
    expect(useMissionDraftStore.getState().hydrated).toBe(true);
  });

  it('efface le brouillon quand la mission est terminée', async () => {
    useMissionDraftStore.getState().save(draft);
    useMissionDraftStore.getState().clear();

    expect(useMissionDraftStore.getState().activeMission).toBeNull();
    expect(useMissionDraftStore.getState().draft).toBeNull();
    expect(await storage.get(KEY, null)).toBeNull();
  });

  it('ignore un brouillon illisible', async () => {
    await storage.set(KEY, { version: 1, draft: { missionId: 'trois-zones', state: {} } });

    await useMissionDraftStore.getState().hydrate();

    expect(useMissionDraftStore.getState().activeMission).toBeNull();
    expect(useMissionDraftStore.getState().hydrated).toBe(true);
  });
});
