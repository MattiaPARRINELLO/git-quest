import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MissionScreen } from './MissionScreen';
import { createSandboxState } from '../content/sandbox';
import { storage } from '../storage/storage';
import { createEmptyStory, useProgressStore } from '../store/useProgressStore';
import { useRepoStore } from '../store/useRepoStore';
import { useUiStore } from '../store/useUiStore';

const V1 = 'gitquest.progress.v1';
const V2 = 'gitquest.progress.v2';

interface StoredDraft {
  readonly story: {
    readonly activeMission: {
      readonly missionId: string;
      readonly commandsUsed: number;
      readonly state: {
        readonly worktrees: Readonly<
          Record<string, { readonly index: Readonly<Record<string, string>> }>
        >;
      };
    } | null;
  };
}

function resetSandbox(): void {
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
}

describe('brouillon de mission', () => {
  beforeEach(async () => {
    await storage.remove(V1);
    await storage.remove(V2);
    resetSandbox();
    useProgressStore.setState({
      completed: { 'trois-zones': { stars: 3 } },
      lessonSlides: {},
      draft: null,
      story: createEmptyStory(),
      hydrated: true,
    });
    useUiStore.setState({ mobileTab: 'terminal', showExplanations: false, graphUnseen: 0 });
  });

  it('persiste l’état du dépôt et le compteur après chaque commande mutante', async () => {
    const user = userEvent.setup();
    render(<MissionScreen missionId="snapshot-fige" />);

    const input = await screen.findByRole('textbox', { name: /commande git/i });
    await user.type(input, 'edit app.ts "v2"{Enter}');
    await user.type(input, 'git add app.ts{Enter}');

    await screen.findByText(/2 \/ 4 commandes/);

    await waitFor(async () => {
      const saved = await storage.get<StoredDraft | null>(V2, null);
      const draft = saved?.story.activeMission;
      expect(draft?.missionId).toBe('snapshot-fige');
      expect(draft?.commandsUsed).toBe(2);
      expect(draft?.state.worktrees.main?.index['app.ts']).toBe('v2');
    });
  });

  it('restaure état et compteur au rechargement, sans réexécuter la moindre commande', async () => {
    const user = userEvent.setup();
    const first = render(<MissionScreen missionId="snapshot-fige" />);

    const input = await screen.findByRole('textbox', { name: /commande git/i });
    await user.type(input, 'edit app.ts "v2"{Enter}');
    await user.type(input, 'git add app.ts{Enter}');
    await screen.findByText(/2 \/ 4 commandes/);

    first.unmount();

    // Rechargement : dépôt neuf, store non hydraté, brouillon absent de la mémoire.
    resetSandbox();
    useProgressStore.setState({ draft: null, story: createEmptyStory(), hydrated: false });
    await useProgressStore.getState().hydrate();

    render(<MissionScreen missionId="snapshot-fige" />);

    await screen.findByText(/2 \/ 4 commandes/);
    const state = useRepoStore.getState().state;
    expect(state.worktrees.main?.index['app.ts']).toBe('v2');
    expect(state.worktrees.main?.workingDir['app.ts']).toBe('v2');
    // Aucune réexécution : le terminal ne contient que l'introduction.
    expect(useRepoStore.getState().entries).toHaveLength(2);
    expect(useRepoStore.getState().commandHistory).toEqual([]);
  });

  it('n’écrit aucun brouillon pour une commande non mutante', async () => {
    const user = userEvent.setup();
    render(<MissionScreen missionId="trois-zones" />);

    const input = await screen.findByRole('textbox', { name: /commande git/i });
    await user.type(input, 'git status{Enter}');
    await waitFor(() => {
      expect(useRepoStore.getState().entries.length).toBeGreaterThan(2);
    });

    expect(useProgressStore.getState().draft).toBeNull();
    expect(await storage.get<StoredDraft | null>(V2, null)).toBeNull();
  });

  it('efface le brouillon quand la mission est réussie', async () => {
    const user = userEvent.setup();
    render(<MissionScreen missionId="trois-zones" />);

    const input = await screen.findByRole('textbox', { name: /commande git/i });
    await user.type(input, 'git add a.txt{Enter}');
    await user.type(input, 'git commit -m "fix: a.txt"{Enter}');
    await user.click(await screen.findByRole('button', { name: /^a\.txt$/ }));

    await screen.findByRole('dialog', { name: /Mission 1.1 réussie/i });
    expect(useProgressStore.getState().draft).toBeNull();
  });
});
