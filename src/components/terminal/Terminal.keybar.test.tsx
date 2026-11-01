import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Terminal } from './Terminal';
import { useRepoStore } from '../../store/useRepoStore';
import { useUiStore } from '../../store/useUiStore';
import { createSandboxState } from '../../content/sandbox';
import { scenario } from '../../engine/scenario';

/** Simule un écran mobile : `useMediaQuery('(max-width: 767px)')` répond vrai. */
function useMobileViewport(): void {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('max-width'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const originalMatchMedia = window.matchMedia;

describe('Terminal sur écran tactile', () => {
  beforeEach(() => {
    useMobileViewport();
    useUiStore.setState({ showExplanations: true, mobileTab: 'terminal', graphUnseen: 0 });
    useRepoStore.setState({
      state: createSandboxState(),
      history: [],
      entries: [],
      commandHistory: [],
      lastEvents: { id: 0, events: [] },
      nextEntryId: 1,
      hydrated: true,
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('affiche la barre de touches rapides', () => {
    render(<Terminal />);
    expect(screen.getByRole('toolbar', { name: /touches rapides/i })).toBeInTheDocument();
  });

  it('insère une touche au curseur sans perdre la saisie', async () => {
    const user = userEvent.setup();
    render(<Terminal />);

    const input = screen.getByRole('textbox', { name: /commande git/i });
    await user.type(input, 'git commit ');
    fireEvent.click(screen.getByRole('button', { name: 'tiret' }));
    fireEvent.click(screen.getByRole('button', { name: 'guillemet' }));

    expect(input).toHaveValue('git commit -"');
  });

  it('exécute la commande avec la touche Entrée', async () => {
    const user = userEvent.setup();
    render(<Terminal />);

    const input = screen.getByRole('textbox', { name: /commande git/i });
    await user.type(input, 'git status');
    fireEvent.click(screen.getByRole('button', { name: /exécuter la commande/i }));

    expect(useRepoStore.getState().commandHistory).toEqual(['git status']);
    expect(input).toHaveValue('');
  });

  it('propose des suggestions cliquables après Tab', async () => {
    const user = userEvent.setup();
    useRepoStore.setState({
      state: scenario()
        .init()
        .commit('Initial commit', { 'README.md': '# Projet' })
        .branch('feature')
        .build(),
    });
    render(<Terminal />);

    const input = screen.getByRole('textbox', { name: /commande git/i });
    await user.type(input, 'git switch ');
    fireEvent.click(screen.getByRole('button', { name: /compléter la saisie/i }));

    const suggestion = screen.getByRole('button', { name: 'feature' });
    fireEvent.click(suggestion);
    expect(input).toHaveValue('git switch feature');
  });
});
