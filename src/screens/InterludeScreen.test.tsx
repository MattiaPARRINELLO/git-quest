import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InterludeScreen } from './InterludeScreen';
import { routePaths } from '../router/useHashRoute';
import { createEmptyStory, useProgressStore } from '../store/useProgressStore';

describe('transition de chapitre', () => {
  beforeEach(() => {
    useProgressStore.setState({
      completed: {
        'trois-zones': { stars: 3 },
        'snapshot-fige': { stars: 2 },
        'piege-am': { stars: 1 },
      },
      lessonSlides: {},
      draft: null,
      story: {
        ...createEmptyStory(),
        slots: {
          'm1.1-c1': {
            slotId: 'm1.1-c1',
            missionId: 'trois-zones',
            message: 'fix: mon correctif à moi',
            commitHash: 'abc1234',
          },
        },
      },
      hydrated: true,
    });
  });

  it('résume le chapitre précédent avec les messages du joueur', () => {
    render(<InterludeScreen chapterId="branches" />);

    expect(screen.getByText(/Chapitre 1 terminé/i)).toBeInTheDocument();
    expect(screen.getByText('Sous le capot')).toBeInTheDocument();
    expect(screen.getByText('fix: mon correctif à moi')).toBeInTheDocument();
    expect(screen.getByText('Les 3 zones')).toBeInTheDocument();
  });

  it('propose d’entrer dans le chapitre suivant', () => {
    render(<InterludeScreen chapterId="branches" />);
    expect(screen.getByRole('link', { name: /Commencer le chapitre 2/i })).toHaveAttribute(
      'href',
      routePaths.lesson('branches'),
    );
  });

  it('retombe sur la carte sans chapitre précédent', () => {
    render(<InterludeScreen chapterId="under-the-hood" />);
    expect(screen.getByText(/Transition introuvable/i)).toBeInTheDocument();
  });
});
