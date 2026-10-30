import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MissionScreen } from './MissionScreen';
import { createSandboxState } from '../content/sandbox';
import { storage } from '../storage/storage';
import { createEmptyStory, useProgressStore } from '../store/useProgressStore';
import { useRepoStore } from '../store/useRepoStore';
import { useUiStore } from '../store/useUiStore';

describe('2.3 — commits détachés multiples', () => {
  beforeEach(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await storage.remove('gitquest.progress.v1');
    await storage.remove('gitquest.progress.v2');
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
      completed: {
        'trois-zones': { stars: 3 },
        'snapshot-fige': { stars: 3 },
        'piege-am': { stars: 3 },
        'branche-pointeur': { stars: 3 },
        'qui-avance': { stars: 3 },
      },
      lessonSlides: {},
      draft: null,
      story: createEmptyStory(),
      hydrated: true,
    });
    useUiStore.setState({ mobileTab: 'terminal', showExplanations: false, graphUnseen: 0 });
  });

  it('affiche un message explicite avant de choisir le commit à sauver', async () => {
    const user = userEvent.setup();
    render(<MissionScreen missionId="commit-perdu" />);

    const input = await screen.findByRole('textbox', { name: /commande git/i });
    const state = useRepoStore.getState().state;
    const oldest = Object.values(state.commits).find((commit) => commit.parents.length === 0);
    if (!oldest) throw new Error('commit racine attendu');

    await user.type(input, `git checkout ${oldest.hash}{Enter}`);
    await user.click(await screen.findByRole('button', { name: /^Passer$/i }));
    await user.click(screen.getByRole('tab', { name: /terminal/i }));

    for (const command of [
      'git add exp.txt',
      'git commit -m "exp: idée"',
      'edit trace.txt "seconde expérience"',
      'git add trace.txt',
      'git commit -m "exp: seconde idée"',
    ]) {
      await user.type(screen.getByRole('textbox', { name: /commande git/i }), `${command}{Enter}`);
    }

    await waitFor(() => {
      expect(screen.getByText(/Plusieurs commits détachés/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/exp: seconde idée/i).length).toBeGreaterThan(0);
  });
});
