import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MissionScreen } from './MissionScreen';
import { createSandboxState } from '../content/sandbox';
import { storage } from '../storage/storage';
import { useProgressStore } from '../store/useProgressStore';
import { useRepoStore } from '../store/useRepoStore';
import { useUiStore } from '../store/useUiStore';

describe('MissionScreen', () => {
  beforeEach(async () => {
    await storage.remove('gitquest.progress.v1');
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
    useProgressStore.setState({ completed: {}, lessonSlides: {}, hydrated: true });
    useUiStore.setState({
      mobileTab: 'terminal',
      showExplanations: false,
      graphUnseen: 0,
    });
  });

  it('suspend l’exécution pour une prédiction, puis exécute après la réponse', async () => {
    useProgressStore.setState({
      completed: {
        'trois-zones': { stars: 3 },
        'snapshot-fige': { stars: 3 },
        'piege-am': { stars: 3 },
      },
      lessonSlides: {},
      hydrated: true,
    });
    const user = userEvent.setup();
    render(<MissionScreen missionId="branche-pointeur" />);

    const input = await screen.findByRole('textbox', { name: /commande git/i });
    await user.type(input, 'git branch experiment{Enter}');
    await user.type(input, 'git switch experiment{Enter}');

    expect(await screen.findByText(/Après ce changement de branche, où sera HEAD/i)).toBeInTheDocument();
    expect(useRepoStore.getState().state.worktrees.main?.head).toEqual({
      kind: 'branch',
      branch: 'main',
    });

    await user.click(screen.getByRole('button', { name: /Sur la branche experiment/i }));

    await waitFor(() => {
      expect(useRepoStore.getState().state.worktrees.main?.head).toEqual({
        kind: 'branch',
        branch: 'experiment',
      });
    });
    expect(screen.getByText(/Bonne prédiction/i)).toBeInTheDocument();
  });

  it('1.2 — Continuer mène à 1.3 et ne laisse pas de feedback fantôme', async () => {
    useProgressStore.setState({
      completed: { 'trois-zones': { stars: 3 } },
      lessonSlides: {},
      hydrated: true,
    });
    const user = userEvent.setup();
    render(<MissionScreen missionId="snapshot-fige" />);

    const input = await screen.findByRole('textbox', { name: /commande git/i });
    for (const command of [
      'edit app.ts "v2"',
      'git add app.ts',
      'edit app.ts "v3"',
      'git commit -m "docs: v2"',
    ]) {
      await user.type(input, `${command}{Enter}`);
    }

    await user.click(
      await screen.findByRole('button', { name: /v2, la version indexée/i }),
    );

    await screen.findByRole('dialog', { name: /Mission 1.2 réussie/i });
    const continuer = screen.getByRole('link', { name: /Continuer/i });
    expect(continuer).toHaveAttribute('href', '#/mission/piege-am');
    expect(screen.queryByRole('button', { name: /Continuer/i })).toBeNull();
    expect(screen.queryByText(/Bonne prédiction/i)).toBeNull();
  });

  it('pré-remplit le terminal via les commandes suggérées', async () => {
    const user = userEvent.setup();
    render(<MissionScreen missionId="trois-zones" />);

    const input = await screen.findByRole('textbox', { name: /commande git/i });
    await user.click(screen.getByText('Commandes utiles ici'));
    await user.click(screen.getByRole('button', { name: 'cat a.txt' }));

    expect(input).toHaveValue('cat a.txt');
    expect(useRepoStore.getState().commandHistory).toEqual([]);
  });

  it('refuse une commande interdite sans exécuter', async () => {
    useProgressStore.setState({
      completed: { 'menage-branches': { stars: 3 } },
      lessonSlides: {},
      hydrated: true,
    });
    const user = userEvent.setup();
    render(<MissionScreen missionId="hotfix-worktree" />);

    const input = await screen.findByRole('textbox', { name: /commande git/i });
    await user.type(input, 'git stash{Enter}');

    expect(
      await screen.findByText(/Pas de stash ici/i),
    ).toBeInTheDocument();
    expect(useRepoStore.getState().state.worktrees.main?.head).toEqual({
      kind: 'branch',
      branch: 'feature',
    });
    expect(screen.getByText(/0 \/ 6 commandes/i)).toBeInTheDocument();
  });

  it('affiche MissionComplete après la solution et persiste la progression', async () => {
    const user = userEvent.setup();
    render(<MissionScreen missionId="trois-zones" />);

    const input = await screen.findByRole('textbox', { name: /commande git/i });
    for (const command of [
      'git add a.txt',
      'git commit -m "fix: a.txt"',
    ]) {
      await user.type(input, `${command}{Enter}`);
    }

    await user.click(
      await screen.findByRole('button', { name: /^a\.txt$/ }),
    );

    const dialog = await screen.findByRole('dialog', { name: /Mission 1.1 réussie/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Mission accomplie')).toBeInTheDocument();
    expect(screen.getByText(/Solution de référence/i)).toBeInTheDocument();
    expect(useProgressStore.getState().completed['trois-zones']?.stars).toBe(3);

    await waitFor(async () => {
      const saved = await storage.get<{ completed: Record<string, { stars: number }> } | null>(
        'gitquest.progress.v1',
        null,
      );
      expect(saved?.completed['trois-zones']?.stars).toBe(3);
    });

    useProgressStore.setState({ completed: {}, lessonSlides: {}, hydrated: false });
    await useProgressStore.getState().hydrate();
    expect(useProgressStore.getState().completed['trois-zones']?.stars).toBe(3);
  });
});
