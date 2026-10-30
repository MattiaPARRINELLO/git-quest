import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CommitGraph } from './CommitGraph';
import { scenario } from '../../engine/scenario';

const state = scenario()
  .init()
  .commit('Initial commit', { 'README.md': 'v1' })
  .build();

describe('CommitGraph et éléments interactifs superposés', () => {
  it('ne capture pas le pointeur sur un bouton de popup', () => {
    render(
      <CommitGraph
        state={state}
        batch={{ id: 0, events: [] }}
        overlay={<button type="button">Répondre</button>}
      />,
    );

    const svg = screen.getByRole('img', { name: /graphe des commits/i });
    const dragLayer = svg.parentElement;
    if (!(dragLayer instanceof HTMLElement)) throw new Error('conteneur du graphe introuvable');

    const capture = vi.fn();
    dragLayer.setPointerCapture = capture;

    const button = screen.getByRole('button', { name: 'Répondre' });
    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    expect(capture).not.toHaveBeenCalled();

    // Le glissement reste possible ailleurs dans le graphe.
    fireEvent.pointerDown(dragLayer, { button: 0, pointerId: 2 });
    expect(capture).toHaveBeenCalledWith(2);
  });
});
