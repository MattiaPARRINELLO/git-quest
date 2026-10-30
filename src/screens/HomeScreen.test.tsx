import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';
import { missionSequence } from '../content';
import { useProgressStore } from '../store/useProgressStore';

const allCompleted = Object.fromEntries(
  missionSequence.map((mission) => [mission.id, { stars: 3 as const }]),
);

describe('HomeScreen — point d’entrée de reprise', () => {
  beforeEach(() => {
    useProgressStore.setState({ completed: {}, lessonSlides: {}, hydrated: true });
  });

  it('affiche le démarrage du chapitre 1 sans progression', () => {
    render(<HomeScreen />);

    const start = screen.getByRole('link', { name: /Commencer avec le chapitre 1/i });
    expect(start).toHaveAttribute('href', '#/chapter/under-the-hood/lesson');
    expect(screen.getByText('Chapitre 1 · Sous le capot · 0/3 missions')).toBeInTheDocument();
  });

  it('continue sur la mission suivante', () => {
    useProgressStore.setState({
      completed: { 'trois-zones': { stars: 3 }, 'snapshot-fige': { stars: 3 } },
      lessonSlides: {},
      hydrated: true,
    });
    render(<HomeScreen />);

    const next = screen.getByRole('link', { name: /Continuer : mission 1\.3/i });
    expect(next).toHaveAttribute('href', '#/mission/piege-am');
    expect(screen.getByText('Chapitre 1 · Sous le capot · 2/3 missions')).toBeInTheDocument();
  });

  it('reprend un cours inachevé', () => {
    useProgressStore.setState({
      completed: { 'trois-zones': { stars: 3 } },
      lessonSlides: { 'under-the-hood': 2 },
      hydrated: true,
    });
    render(<HomeScreen />);

    expect(screen.getByRole('link', { name: /Reprendre le cours : Sous le capot/i })).toHaveAttribute(
      'href',
      '#/chapter/under-the-hood/lesson',
    );
  });

  it('propose l’écran final quand tout est terminé', () => {
    useProgressStore.setState({ completed: allCompleted, lessonSlides: {}, hydrated: true });
    render(<HomeScreen />);

    expect(screen.getByRole('link', { name: /Revoir ton arbre Nova/i })).toHaveAttribute(
      'href',
      '#/final',
    );
  });

  it('garde le bac à sable accessible quel que soit l’état', () => {
    useProgressStore.setState({ completed: allCompleted, lessonSlides: {}, hydrated: true });
    render(<HomeScreen />);

    expect(screen.getByRole('link', { name: /Ouvrir le bac à sable/i })).toHaveAttribute(
      'href',
      '#/sandbox',
    );
  });

  it('ne flashe jamais « Commencer » avant l’hydratation', () => {
    useProgressStore.setState({
      completed: { 'trois-zones': { stars: 3 } },
      lessonSlides: {},
      hydrated: false,
    });
    const before = render(<HomeScreen />);

    expect(screen.queryByText(/Commencer avec le chapitre 1/i)).toBeNull();
    expect(screen.queryByRole('link', { name: /mission 1\.2/i })).toBeNull();
    before.unmount();

    useProgressStore.setState({ hydrated: true });
    render(<HomeScreen />);

    expect(screen.getByRole('link', { name: /Continuer : mission 1\.2/i })).toHaveAttribute(
      'href',
      '#/mission/snapshot-fige',
    );
  });
});
