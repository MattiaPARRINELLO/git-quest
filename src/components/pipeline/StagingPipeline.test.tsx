import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StagingPipeline } from './StagingPipeline';
import { scenario } from '../../engine/scenario';
import { useRepoStore } from '../../store/useRepoStore';

const repo = scenario()
  .init()
  .commit('Initial commit', { 'README.md': 'version 1' })
  .write('README.md', 'version 2')
  .build();

describe('StagingPipeline', () => {
  beforeEach(() => {
    useRepoStore.setState({
      state: repo,
      history: [],
      entries: [],
      commandHistory: [],
      lastEvents: { id: 0, events: [] },
      nextEntryId: 1,
      mode: 'sandbox',
      hydrated: true,
    });
  });

  it('affiche le contenu d’un fichier par zone et signale les différences', async () => {
    const user = userEvent.setup();
    render(<StagingPipeline />);

    expect(screen.getByText('≠ index')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Working dir — README\.md/i }));
    expect(await screen.findByText('version 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Dernier commit — README\.md/i }));
    expect(await screen.findByText('version 1')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByText('version 1')).toBeNull();
  });
});
