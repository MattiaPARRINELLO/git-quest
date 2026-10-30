import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrologueScreen } from './PrologueScreen';
import { commandLineLesson } from '../content';
import { useProgressStore } from '../store/useProgressStore';

describe('PrologueScreen', () => {
  beforeEach(() => {
    useProgressStore.setState({ completed: {}, lessonSlides: {}, hydrated: true });
  });

  it('présente la lecture d’une commande puis renvoie au chapitre 1', async () => {
    const user = userEvent.setup();
    render(<PrologueScreen />);

    expect(screen.getByText('Une commande, trois niveaux')).toBeInTheDocument();
    expect(screen.getByText('Prologue')).toBeInTheDocument();

    for (let index = 1; index < commandLineLesson.slides.length; index += 1) {
      await user.click(screen.getByRole('button', { name: /^Suivant$/ }));
    }

    expect(
      screen.getByRole('link', { name: /Commencer le chapitre 1/i }),
    ).toHaveAttribute('href', '#/chapter/under-the-hood/lesson');
    expect(useProgressStore.getState().lessonSlides[commandLineLesson.id]).toBe(
      commandLineLesson.slides.length - 1,
    );
  });
});
