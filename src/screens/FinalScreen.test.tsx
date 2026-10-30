import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FinalScreen } from './FinalScreen';
import { missionSequence } from '../content';
import { useProgressStore } from '../store/useProgressStore';

describe('FinalScreen', () => {
  beforeEach(() => {
    useProgressStore.setState({
      completed: Object.fromEntries(
        missionSequence.map((mission) => [mission.id, { stars: 3 as const }]),
      ),
      lessonSlides: {},
      hydrated: true,
    });
  });

  it('affiche l’arbre Nova et les statistiques du parcours', () => {
    render(<FinalScreen />);

    expect(screen.getByRole('heading', { name: /Ton arbre Nova/i })).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Revoir la carte des chapitres/i })).toHaveAttribute(
      'href',
      '#/',
    );
    expect(screen.getByRole('link', { name: /Continuer dans le bac à sable/i })).toHaveAttribute(
      'href',
      '#/sandbox',
    );
  });
});
