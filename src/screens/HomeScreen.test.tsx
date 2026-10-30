import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';
import { createEmptyStory, useProgressStore } from '../store/useProgressStore';

describe('carte — dernier épisode', () => {
  beforeEach(() => {
    useProgressStore.setState({
      completed: {},
      lessonSlides: {},
      draft: null,
      story: createEmptyStory(),
      hydrated: true,
    });
  });

  it('affiche l’épilogue de la dernière mission terminée', () => {
    useProgressStore.setState({ completed: { 'trois-zones': { stars: 3 } } });

    render(<HomeScreen />);

    expect(screen.getByLabelText('Dernier épisode')).toBeInTheDocument();
    expect(screen.getAllByText('Les 3 zones').length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Le correctif de a\.txt est parti seul/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Le CTO veut maintenant prouver/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ton arbre Nova/i })).toHaveAttribute(
      'href',
      '#/nova',
    );
  });

  it('reste discret tant qu’aucune mission n’est terminée', () => {
    render(<HomeScreen />);
    expect(screen.queryByLabelText('Dernier épisode')).toBeNull();
  });
});
