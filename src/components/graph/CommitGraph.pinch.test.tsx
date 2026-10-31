import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CommitGraph } from './CommitGraph';
import { scenario } from '../../engine/scenario';

const state = scenario()
  .init()
  .commit('Initial commit', { 'README.md': 'v1' })
  .build();

function graphLayer(): HTMLElement {
  const svg = screen.getByRole('img', { name: /graphe des commits/i });
  const layer = svg.parentElement;
  if (!(layer instanceof HTMLElement)) throw new Error('conteneur du graphe introuvable');
  return layer;
}

function scaleOf(): number {
  const groups = [...document.querySelectorAll('g[transform]')];
  const transformed = groups.find((group) => group.getAttribute('transform')?.startsWith('translate('));
  const transform = transformed?.getAttribute('transform') ?? '';
  const match = /scale\(([\d.]+)\)/.exec(transform);
  if (!match?.[1]) throw new Error(`échelle introuvable dans « ${transform} »`);
  return Number(match[1]);
}

const DEFAULTS = { bubbles: true, cancelable: true, button: 0, isPrimary: true } as const;

describe('CommitGraph — pincement tactile', () => {
  it('zoome avec deux doigts et garde le point de pincement fixe', () => {
    render(<CommitGraph state={state} batch={{ id: 0, events: [] }} />);
    const layer = graphLayer();
    const before = scaleOf();

    fireEvent.pointerDown(layer, { ...DEFAULTS, pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerDown(layer, { ...DEFAULTS, pointerId: 2, clientX: 200, clientY: 100 });
    fireEvent.pointerMove(layer, { ...DEFAULTS, pointerId: 2, clientX: 300, clientY: 100 });

    expect(scaleOf()).toBeGreaterThan(before);
  });

  it('déplace le graphe avec un seul doigt', () => {
    render(<CommitGraph state={state} batch={{ id: 0, events: [] }} />);
    const layer = graphLayer();
    const before = scaleOf();

    fireEvent.pointerDown(layer, { ...DEFAULTS, pointerId: 3, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(layer, { ...DEFAULTS, pointerId: 3, clientX: 140, clientY: 120 });

    // Le déplacement ne change pas l'échelle, seulement la translation.
    expect(scaleOf()).toBe(before);
  });
});
