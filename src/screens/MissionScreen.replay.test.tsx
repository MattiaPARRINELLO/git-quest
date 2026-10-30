import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MissionScreen } from './MissionScreen';
import { createSandboxState } from '../content/sandbox';
import { storage } from '../storage/storage';
import { createEmptyStory, useProgressStore } from '../store/useProgressStore';
import { useRepoStore } from '../store/useRepoStore';
import { useUiStore } from '../store/useUiStore';
import { resetStoryFlag, storyBetaEnabled } from '../lib/story-flags';
import { checkpointAfter, entryState } from '../story/checkpoints';

describe('reprise depuis une copie isolée', () => {
  beforeEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await storage.remove('gitquest.progress.v1');
    await storage.remove('gitquest.progress.v2');
    resetStoryFlag();
    storyBetaEnabled('?story=beta');
    useRepoStore.setState({
      mode: 'sandbox',
      state: createSandboxState(),
      history: [],
      entries: [],
      commandHistory: [],
      lastEvents: { id: 0, events: [] },
      nextEntryId: 1,
      hydrated: true,
    });
    useProgressStore.setState({
      completed: { 'trois-zones': { stars: 3 }, 'snapshot-fige': { stars: 2 } },
      lessonSlides: {},
      draft: null,
      story: {
        ...createEmptyStory(),
        nova: checkpointAfter('snapshot-fige'),
        journal: [
          { kind: 'mission-complete', missionId: 'trois-zones', stars: 3 },
          { kind: 'mission-complete', missionId: 'snapshot-fige', stars: 2 },
        ],
      },
      hydrated: true,
    });
    useUiStore.setState({ mobileTab: 'terminal', showExplanations: false, graphUnseen: 0 });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche le bandeau d’entraînement et permet de reprendre depuis ici', async () => {
    const user = userEvent.setup();
    render(<MissionScreen missionId="trois-zones" />);

    expect(
      (await screen.findAllByText(/Entraînement : ton arbre Nova n’est pas modifié/i)).length,
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', { name: /Reprendre l’histoire depuis ici/i }),
    );

    const story = useProgressStore.getState().story;
    expect(story.isolated).toBeNull();
    expect(story.nova).toEqual(entryState('trois-zones'));
    expect(story.journal.at(-1)?.kind).toBe('recalage');
    expect(useProgressStore.getState().completed['snapshot-fige']).toEqual({ stars: 2 });
  });

  it('ne propose pas la reprise quand le flag est désactivé', async () => {
    storyBetaEnabled('?story=stable');
    render(<MissionScreen missionId="trois-zones" />);

    expect(
      (await screen.findAllByText(/Entraînement : ton arbre Nova n’est pas modifié/i)).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: /Reprendre l’histoire depuis ici/i }),
    ).toBeNull();
  });
});
