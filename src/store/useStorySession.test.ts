import { beforeEach, describe, expect, it } from 'vitest';
import { findMission } from '../content';
import { createEmptyStory, useProgressStore } from './useProgressStore';
import { storage } from '../storage/storage';
import { checkpointAfter, entryState } from '../story/checkpoints';
import { withSideCommits } from '../story/__tests__/helpers';

const V1 = 'gitquest.progress.v1';
const V2 = 'gitquest.progress.v2';

function store() {
  return useProgressStore.getState();
}

describe('session story : rejeu, recalage, rechargement', () => {
  beforeEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await storage.remove(V1);
    await storage.remove(V2);
    useProgressStore.setState({
      completed: {},
      lessonSlides: {},
      draft: null,
      story: createEmptyStory(),
      hydrated: true,
    });
  });

  it('rejouer une mission dépassée ouvre une copie isolée sans toucher Nova', () => {
    const nova = checkpointAfter('snapshot-fige');
    useProgressStore.setState({
      completed: { 'trois-zones': { stars: 3 }, 'snapshot-fige': { stars: 2 } },
      story: {
        ...createEmptyStory(),
        nova,
        journal: [
          { kind: 'mission-complete', missionId: 'trois-zones', stars: 3 },
          { kind: 'mission-complete', missionId: 'snapshot-fige', stars: 2 },
        ],
      },
    });
    const mission = findMission('trois-zones');
    if (!mission) throw new Error('mission 1.1 attendue');

    const start = store().beginMission(mission);

    expect(start.isolated).toBe(true);
    expect(store().story.nova).toBe(nova);
    expect(store().story.isolated?.missionId).toBe('trois-zones');
    expect(store().completed['trois-zones']).toEqual({ stars: 3 });
  });

  it('rejouer la dernière mission réécrit Nova depuis le checkpoint canonique', () => {
    const divergent = withSideCommits(checkpointAfter('trois-zones'), 2);
    useProgressStore.setState({
      completed: { 'trois-zones': { stars: 3 } },
      story: {
        ...createEmptyStory(),
        nova: divergent,
        journal: [{ kind: 'mission-complete', missionId: 'trois-zones', stars: 3 }],
      },
    });
    const mission = findMission('trois-zones');
    if (!mission) throw new Error('mission 1.1 attendue');

    const start = store().beginMission(mission);

    expect(start.recalaged).toBe(true);
    expect(store().story.nova).toBeNull();
    expect(start.state).toEqual(entryState('trois-zones'));
    expect(store().story.journal.at(-1)?.kind).toBe('recalage');
  });

  it('un rechargement en pleine mission ne rejoue jamais le prelude', async () => {
    const nova = checkpointAfter('trois-zones');
    useProgressStore.setState({
      completed: { 'trois-zones': { stars: 3 } },
      story: {
        ...createEmptyStory(),
        nova,
        journal: [{ kind: 'mission-complete', missionId: 'trois-zones', stars: 3 }],
      },
    });
    const mission = findMission('snapshot-fige');
    if (!mission) throw new Error('mission 1.2 attendue');

    const first = store().beginMission(mission);
    const commitCount = Object.keys(first.state.commits).length;
    expect(commitCount).toBe(Object.keys(nova.commits).length + 1);

    store().saveDraft({
      missionId: mission.id,
      entry: first.state,
      state: first.state,
      commandsUsed: 0,
      hintsUsed: 0,
      attempts: [],
    });

    // Rechargement complet : mémoire vidée, hydrate depuis le stockage.
    useProgressStore.setState({
      draft: null,
      story: createEmptyStory(),
      hydrated: false,
    });
    await store().hydrate();

    const again = store().beginMission(mission);
    expect(Object.keys(again.state.commits)).toHaveLength(commitCount);
    expect(again.state).toEqual(first.state);
  });
});
