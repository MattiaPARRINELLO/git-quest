import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Terminal } from './Terminal';
import { useRepoStore } from '../../store/useRepoStore';
import { useUiStore } from '../../store/useUiStore';
import { createSandboxState } from '../../content/sandbox';
import { scenario } from '../../engine/scenario';
import type { RepoState } from '../../engine/types';

function setRepoState(state: RepoState): void {
  useRepoStore.setState({
    state,
    history: [],
    entries: [],
    commandHistory: [],
    lastEvents: { id: 0, events: [] },
    nextEntryId: 1,
    hydrated: true,
  });
}

function featureRepo(): RepoState {
  return scenario()
    .init()
    .commit('Initial commit', { 'README.md': '# Projet' })
    .branch('feature')
    .build();
}

describe('Terminal', () => {
  beforeEach(() => {
    useUiStore.setState({
      showExplanations: true,
      mobileTab: 'terminal',
      graphUnseen: 0,
    });
    setRepoState(createSandboxState());
  });

  it('affiche la sortie d’une commande saisie', async () => {
    const user = userEvent.setup();
    render(<Terminal />);

    const input = screen.getByRole('textbox', { name: /commande git/i });
    await user.type(input, 'git status{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/On branch main/)).toBeInTheDocument();
    });
    expect(useRepoStore.getState().commandHistory).toEqual(['git status']);
  });

  it('complète une branche avec Tab', async () => {
    setRepoState(featureRepo());
    const user = userEvent.setup();
    render(<Terminal />);

    const input = screen.getByRole('textbox', { name: /commande git/i });
    await user.type(input, 'git switch fe');
    fireEvent.keyDown(input, { key: 'Tab' });

    expect(input).toHaveValue('git switch feature');
  });

  it('rappelle la commande précédente avec ↑', async () => {
    const user = userEvent.setup();
    render(<Terminal />);

    const input = screen.getByRole('textbox', { name: /commande git/i });
    await user.type(input, 'git status{Enter}');
    expect(input).toHaveValue('');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input).toHaveValue('git status');
  });

  it('ajoute une explication en français après une commande mutante', async () => {
    const user = userEvent.setup();
    render(<Terminal />);

    const input = screen.getByRole('textbox', { name: /commande git/i });
    await user.type(input, 'touch notes.txt{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/working directory/)).toBeInTheDocument();
    });
  });

  it('efface la saisie avec Ctrl+C', async () => {
    const user = userEvent.setup();
    render(<Terminal />);
    const input = screen.getByRole('textbox', { name: /commande git/i });
    await user.type(input, 'git stat');
    fireEvent.keyDown(input, { key: 'c', ctrlKey: true });
    expect(input).toHaveValue('');
  });
});
