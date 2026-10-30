import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MissionComplete } from './MissionComplete';
import { afterMission, allMissions, findChapter, findMission } from '../../content';
import { routePaths } from '../../router/useHashRoute';

describe('MissionComplete — bouton Continuer', () => {
  for (const mission of allMissions) {
    it(`${mission.number} mène à la bonne destination`, () => {
      const after = afterMission(mission.id);
      render(
        <MissionComplete
          mission={mission}
          stars={3}
          commandsUsed={mission.par}
          after={after}
          onInspect={() => undefined}
        />,
      );

      const link = screen.getByRole('link', { name: /Continuer/i });
      if (after.kind === 'mission') {
        expect(link).toHaveAttribute('href', routePaths.mission(after.mission.id));
      } else if (after.kind === 'lesson') {
        expect(link).toHaveAttribute('href', routePaths.lesson(after.chapter.id));
      } else {
        expect(link).toHaveAttribute('href', routePaths.home);
      }
    });
  }

  it('raconte l’épilogue et annonce la suite', () => {
    const mission = findMission('trois-zones');
    if (!mission) throw new Error('mission attendue');
    render(
      <MissionComplete
        mission={mission}
        stars={2}
        commandsUsed={mission.par}
        after={afterMission(mission.id)}
        onInspect={() => undefined}
        outcome="Le correctif est parti seul."
        teaser="Le CTO veut prouver que la photo ne bougera plus."
      />,
    );

    expect(screen.getByText('Le correctif est parti seul.')).toBeInTheDocument();
    expect(screen.getByText(/Le CTO veut prouver/)).toBeInTheDocument();
    expect(screen.getByText(/À suivre/)).toBeInTheDocument();
  });

  it('propose le cours du chapitre suivant à une frontière', () => {    const lastOfChapterOne = allMissions[2];
    if (!lastOfChapterOne) throw new Error('mission attendue');
    expect(lastOfChapterOne.chapterId).toBe('under-the-hood');
    const after = afterMission(lastOfChapterOne.id);
    expect(after.kind).toBe('lesson');
    if (after.kind === 'lesson') {
      expect(after.chapter.id).toBe('branches');
      expect(findChapter(after.chapter.id)?.lesson.title).toBe('Les branches');
    }
  });
});
