import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';
import { LessonScreen } from './LessonScreen';
import { MissionScreen } from './MissionScreen';
import { setLocale } from '../i18n';
import { createSandboxState } from '../content/sandbox';
import { createEmptyStory, useProgressStore } from '../store/useProgressStore';
import { useMissionDraftStore } from '../store/useMissionDraftStore';
import { useRepoStore } from '../store/useRepoStore';
import { useUiStore } from '../store/useUiStore';

/**
 * Vérifie qu'un joueur en anglais ne voit aucun texte pédagogique français, sur
 * l'accueil, un cours et une mission.
 */
describe('rendu anglais du contenu', () => {
  beforeEach(() => {
    setLocale('en');
    useProgressStore.setState({
      completed: {},
      lessonSlides: {},
      draft: null,
      story: createEmptyStory(),
      hydrated: true,
    });
    useMissionDraftStore.setState({ activeMission: null, draft: null, hydrated: true });
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
    useUiStore.setState({
      mobileTab: 'terminal',
      showExplanations: false,
      graphUnseen: 0,
    });
  });

  afterEach(() => setLocale('fr'));

  it('l’accueil affiche le chapitre en anglais', () => {
    render(<HomeScreen />);

    expect(screen.getAllByText('Under the hood').length).toBeGreaterThan(0);
    expect(screen.getByText('Chapter 1 · Under the hood · 0/3 missions')).toBeInTheDocument();
    expect(screen.queryByText(/Sous le capot/)).not.toBeInTheDocument();
  });

  it('le cours du chapitre 1 est entièrement anglais', () => {
    render(<LessonScreen chapterId="under-the-hood" />);

    expect(screen.getByText('A commit is a snapshot')).toBeInTheDocument();
    expect(
      screen.getByText(/Git does not store differences/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Un commit est une photo')).not.toBeInTheDocument();
  });

  it('une mission affiche son briefing et son panneau en anglais', () => {
    render(<MissionScreen missionId="trois-zones" />);

    expect(screen.getAllByText('The 3 areas').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Commit only a.txt/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Nova is the team’s note-taking assistant/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Sous le capot/)).not.toBeInTheDocument();
  });
});
