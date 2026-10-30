import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

    const next = screen.getByRole('button', { name: /Suivant/i });
    await user.click(next);
    await user.click(screen.getByRole('button', { name: /Suivant/i }));

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
});
