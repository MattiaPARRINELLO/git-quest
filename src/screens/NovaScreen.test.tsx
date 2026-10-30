import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NovaScreen } from './NovaScreen';
import { checkpointAfter } from '../story/checkpoints';
import { createEmptyStory, useProgressStore } from '../store/useProgressStore';
import { withSideCommits } from '../story/__tests__/helpers';
import { findMission } from '../content';

describe('écran Ton arbre Nova', () => {
  beforeEach(() => {
    useProgressStore.setState({
      completed: {},
      lessonSlides: {},
      draft: null,
      story: createEmptyStory(),
      hydrated: true,
    });
  });

  it('affiche l’arbre, les statistiques et le log copiable', () => {
    const nova = checkpointAfter('menage-worktree');
    useProgressStore.setState({
      completed: { 'menage-worktree': { stars: 3 } },
      story: { ...createEmptyStory(), nova },
    });

    render(<NovaScreen />);

    expect(screen.getByText('Ton arbre Nova')).toBeInTheDocument();
    expect(screen.getByText('Worktrees créés')).toBeInTheDocument();
    expect(screen.getByText('Worktrees actifs')).toBeInTheDocument();
    expect(screen.getByText(/git log --oneline --graph/)).toBeInTheDocument();
    expect(screen.getByText(/feat: export CSV/)).toBeInTheDocument();
  });

  it('après un recalage, l’écran final ne montre que les commits de Nova', () => {
    const mission = findMission('trois-zones');
    if (!mission) throw new Error('mission 1.1 attendue');

    useProgressStore.setState({
      completed: { 'trois-zones': { stars: 3 } },
      story: {
        ...createEmptyStory(),
        nova: withSideCommits(checkpointAfter('trois-zones'), 2),
        journal: [{ kind: 'mission-complete', missionId: 'trois-zones', stars: 3 }],
      },
    });

    const start = useProgressStore.getState().beginMission(mission);
    expect(start.recalaged).toBe(true);
    useProgressStore.getState().completeMission('trois-zones', 3, checkpointAfter('trois-zones'));

    const nova = useProgressStore.getState().story.nova;
    expect(nova).not.toBeNull();
    render(<NovaScreen />);
    expect(screen.queryByText(/décalage/)).toBeNull();
    expect(screen.getByText(/fix: a\.txt/)).toBeInTheDocument();
  });
});
