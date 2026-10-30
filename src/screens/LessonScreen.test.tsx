import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonScreen } from './LessonScreen';
import { useProgressStore } from '../store/useProgressStore';

describe('LessonScreen', () => {
  beforeEach(() => {
    useProgressStore.setState({ completed: {}, lessonSlides: {}, hydrated: true });
  });

  it('navigue entre les slides et reprend là où on s’est arrêté', async () => {
    const user = userEvent.setup();
    const first = render(<LessonScreen chapterId="under-the-hood" />);

    expect(screen.getByText('Un commit est une photo')).toBeInTheDocument();

    const next = screen.getByRole('button', { name: /^Suivant$/ });
    await user.click(next);
    await user.click(screen.getByRole('button', { name: /^Suivant$/ }));

    await waitFor(() => {
      expect(screen.getByText('Les 3 zones : disque, index, commit')).toBeInTheDocument();
    });
    expect(useProgressStore.getState().lessonSlides['under-the-hood']).toBe(2);

    first.unmount();
    render(<LessonScreen chapterId="under-the-hood" />);
    await waitFor(() => {
      expect(screen.getByText('Les 3 zones : disque, index, commit')).toBeInTheDocument();
    });
  });

  it('se parcourt entièrement au clavier', async () => {
    render(<LessonScreen chapterId="under-the-hood" />);
    expect(screen.getByText('Un commit est une photo')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await waitFor(() => {
      expect(screen.getByText('Du disque au snapshot')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'End' });
    await waitFor(() => {
      expect(screen.getByText('Antisèche du chapitre')).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: 'Home' });
    await waitFor(() => {
      expect(screen.getByText('Un commit est une photo')).toBeInTheDocument();
    });
  });
});
