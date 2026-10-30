import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MissionScreen } from './MissionScreen';
import { createSandboxState } from '../content/sandbox';
import { storage } from '../storage/storage';
import { createEmptyStory, useProgressStore } from '../store/useProgressStore';
import { useRepoStore } from '../store/useRepoStore';
import { useUiStore } from '../store/useUiStore';

describe('briefing narratif de mission', () => {
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
      completed: {},
      lessonSlides: {},
      draft: null,
      story: createEmptyStory(),
      hydrated: true,
    });
    useUiStore.setState({ mobileTab: 'terminal', showExplanations: false, graphUnseen: 0 });
  });

  it('raconte l’histoire puis laisse entrer dans le dépôt', async () => {
    const user = userEvent.setup();
    render(<MissionScreen missionId="trois-zones" />);

    const dialog = await screen.findByRole('dialog', { name: /Briefing 1\.1/i });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Nova est l’assistant de notes/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Entrer dans le dépôt/i }));
    expect(screen.queryByRole('dialog', { name: /Briefing 1\.1/i })).toBeNull();
  });

  it('montre les fichiers déjà prêts dans le working dir', async () => {
    render(<MissionScreen missionId="trois-zones" />);

    await screen.findByRole('dialog', { name: /Briefing 1\.1/i });
    expect(screen.getByText('Déjà dans ton working dir')).toBeInTheDocument();
    expect(screen.getByText('a.txt')).toBeInTheDocument();
    expect(screen.getByText('b.txt')).toBeInTheDocument();
    expect(screen.getAllByText('modifié').length).toBeGreaterThan(0);
  });

  it('1.2 montre l’index déjà préparé et le disque en avance', async () => {
    useProgressStore.setState({ completed: { 'trois-zones': { stars: 3 } } });
    render(<MissionScreen missionId="snapshot-fige" />);

    await screen.findByRole('dialog', { name: /Briefing 1\.2/i });
    expect(screen.getByText('Déjà dans ton working dir')).toBeInTheDocument();
    expect(screen.getByText('app.ts')).toBeInTheDocument();
    expect(screen.getAllByText(/v3/).length).toBeGreaterThan(0);
  });

  it('peut être passée immédiatement', async () => {
    useProgressStore.setState({
      completed: {
        'trois-zones': { stars: 3 },
        'snapshot-fige': { stars: 3 },
        'piege-am': { stars: 3 },
      },
    });
    const user = userEvent.setup();
    render(<MissionScreen missionId="branche-pointeur" />);

    await screen.findByRole('dialog', { name: /Briefing 2\.1/i });
    await user.click(screen.getByRole('button', { name: /Passer l’intro/i }));
    expect(screen.queryByRole('dialog', { name: /Briefing 2\.1/i })).toBeNull();
  });

  it('se referme dès la première commande', async () => {
    const user = userEvent.setup();
    render(<MissionScreen missionId="trois-zones" />);

    await screen.findByRole('dialog', { name: /Briefing 1\.1/i });
    await user.type(
      await screen.findByRole('textbox', { name: /commande git/i }),
      'git status{Enter}',
    );

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Briefing 1\.1/i })).toBeNull();
    });
  });

  it('2.1 dit que notes.txt est déjà prêt à être commité', async () => {
    useProgressStore.setState({
      completed: {
        'trois-zones': { stars: 3 },
        'snapshot-fige': { stars: 3 },
        'piege-am': { stars: 3 },
      },
    });
    render(<MissionScreen missionId="branche-pointeur" />);
    expect(
      await screen.findByText(/notes\.txt a déjà été mis à jour/i),
    ).toBeInTheDocument();
  });
});
