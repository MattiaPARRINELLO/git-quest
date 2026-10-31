import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { KeyBar } from './KeyBar';

function renderBar(overrides: Partial<Parameters<typeof KeyBar>[0]> = {}) {
  const props = {
    onInsert: vi.fn(),
    onComplete: vi.fn(),
    onHistory: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<KeyBar {...props} />);
  return props;
}

describe('KeyBar', () => {
  it('insère le caractère demandé', () => {
    const { onInsert } = renderBar();
    fireEvent.click(screen.getByRole('button', { name: 'tiret' }));
    expect(onInsert).toHaveBeenCalledWith('-');
  });

  it('déclenche la complétion et l’exécution', () => {
    const { onComplete, onSubmit } = renderBar();
    fireEvent.click(screen.getByRole('button', { name: /compléter/i }));
    fireEvent.click(screen.getByRole('button', { name: /exécuter/i }));
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('parcourt l’historique dans les deux sens', () => {
    const { onHistory } = renderBar();
    fireEvent.click(screen.getByRole('button', { name: /commande précédente/i }));
    fireEvent.click(screen.getByRole('button', { name: /commande suivante/i }));
    expect(onHistory).toHaveBeenNthCalledWith(1, 'up');
    expect(onHistory).toHaveBeenNthCalledWith(2, 'down');
  });

  it('ne prend pas le focus : le clavier tactile doit rester ouvert', () => {
    renderBar();
    const key = screen.getByRole('button', { name: 'tiret' });
    const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true });
    const notCancelled = key.dispatchEvent(event);
    expect(notCancelled).toBe(false);
  });
});
