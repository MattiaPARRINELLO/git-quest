import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PredictionFeedback, PredictionOverlay } from './PredictionOverlay';
import type { Prediction } from '../../content/types';

const prediction: Prediction = {
  trigger: () => true,
  question: 'Où pointe HEAD ?',
  options: [
    { id: 'main', label: 'sur main' },
    { id: 'feature', label: 'sur feature' },
  ],
  correctOptionId: 'feature',
  explanation: 'HEAD suit la branche active.',
};

describe('PredictionOverlay au clavier', () => {
  it('se focalise à l’ouverture', () => {
    render(<PredictionOverlay prediction={prediction} onAnswer={vi.fn()} onSkip={vi.fn()} />);

    const dialog = screen.getByRole('alertdialog', { name: /Prédiction/i });
    expect(document.activeElement).toBe(dialog);
  });

  it('choisit avec les flèches puis valide avec Entrée', () => {
    const onAnswer = vi.fn();
    render(<PredictionOverlay prediction={prediction} onAnswer={onAnswer} onSkip={vi.fn()} />);

    fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(onAnswer).toHaveBeenCalledWith('feature');
  });

  it('répond directement avec un chiffre', () => {
    const onAnswer = vi.fn();
    render(<PredictionOverlay prediction={prediction} onAnswer={onAnswer} onSkip={vi.fn()} />);

    fireEvent.keyDown(window, { key: '2' });

    expect(onAnswer).toHaveBeenCalledWith('feature');
  });

  it('passe avec Échap', () => {
    const onSkip = vi.fn();
    render(<PredictionOverlay prediction={prediction} onAnswer={vi.fn()} onSkip={onSkip} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

describe('PredictionFeedback au clavier', () => {
  it('valide avec Entrée et ferme avec Échap', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(
      <PredictionFeedback
        correct
        explanation="Bien vu."
        onContinue={onContinue}
      />,
    );

    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Continuer/i }));

    await user.keyboard('{Enter}');
    expect(onContinue).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(onContinue).toHaveBeenCalledTimes(2);
  });
});
