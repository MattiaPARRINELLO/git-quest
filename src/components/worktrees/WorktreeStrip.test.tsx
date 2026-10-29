import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorktreeStrip } from './WorktreeStrip';
import { useRepoStore } from '../../store/useRepoStore';
import { scenario } from '../../engine/scenario';
import type { RepoState } from '../../engine/types';

function repoWithWorktree(): RepoState {
  return scenario()
    .init()
    .commit('Initial commit', { 'README.md': '# Projet' })
    .branch('feature')
    .worktreeAdd('../gitquest-feature', { branch: 'feature' })
    .build();
}

describe('WorktreeStrip', () => {
  beforeEach(() => {
    useRepoStore.setState({
      state: repoWithWorktree(),
      history: [],
      entries: [],
      commandHistory: [],
      lastEvents: { id: 0, events: [] },
      nextEntryId: 1,
      hydrated: true,
    });
  });

  it('affiche une carte par worktree avec la branche', () => {
    render(<WorktreeStrip />);
    expect(screen.getByText('~/gitquest')).toBeInTheDocument();
    expect(screen.getByText('~/gitquest-feature')).toBeInTheDocument();
    expect(screen.getByText('feature')).toBeInTheDocument();
  });

  it('clique sur une carte exécute cd et active le worktree', async () => {
    const user = userEvent.setup();
    render(<WorktreeStrip />);

    await user.click(
      screen.getByRole('button', { name: /aller au worktree ~\/gitquest-feature/i }),
    );

    const store = useRepoStore.getState();
    expect(store.state.activeWorktree).toBe('gitquest-feature');
    expect(store.entries.some((entry) => entry.text.includes('cd ~/gitquest-feature'))).toBe(true);
  });
});
