import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SandboxLayout } from './SandboxLayout';
import { useRepoStore } from '../../store/useRepoStore';
import { useUiStore } from '../../store/useUiStore';
import { createSandboxState } from '../../content/sandbox';

describe('SandboxLayout mobile', () => {
  beforeEach(() => {
    useRepoStore.setState({
      state: createSandboxState(),
      history: [],
      entries: [],
      commandHistory: [],
      lastEvents: { id: 0, events: [] },
      nextEntryId: 1,
      hydrated: true,
    });
    useUiStore.setState({ mobileTab: 'terminal', graphUnseen: 0 });
  });

  it('bascule le panneau secondaire entre mission et fichiers', async () => {
    const user = userEvent.setup();
    render(<SandboxLayout missionPanel={<div>Mini mission</div>} />);

    expect(screen.getByText('Mini mission')).toBeInTheDocument();
    expect(screen.queryByText('Pipeline')).toBeNull();

    await user.click(screen.getByRole('button', { name: /fichiers/i }));

    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.queryByText('Mini mission')).toBeNull();
  });

  it('déplace les fichiers dans le panneau secondaire, pas dans les onglets', () => {
    render(<SandboxLayout missionPanel={<div>Mini mission</div>} />);

    expect(screen.queryByRole('tab', { name: /fichiers/i })).toBeNull();
    expect(screen.getByRole('tab', { name: /graphe/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /terminal/i })).toBeInTheDocument();
  });
});
