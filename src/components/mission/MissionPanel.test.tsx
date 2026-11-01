import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MissionPanel } from './MissionPanel';
import { findMission } from '../../content';

function mockViewport(narrow: boolean): void {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('max-width: 767px') ? narrow : false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe('MissionPanel', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    mockViewport(true);
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('démarre en version mini sur mobile', async () => {
    const mission = findMission('trois-zones');
    if (!mission) throw new Error('mission absente');

    const user = userEvent.setup();
    render(
      <MissionPanel
        mission={mission}
        state={mission.initialState}
        commandsUsed={0}
        hintsUsed={0}
        onHint={() => undefined}
        onSuggest={() => undefined}
      />,
    );

    expect(screen.queryByText('Objectif')).toBeNull();

    await user.click(screen.getByRole('button', { name: /déplier la mission/i }));

    expect(screen.getByText('Objectif')).toBeInTheDocument();
  });
});
