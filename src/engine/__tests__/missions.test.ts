import { describe, expect, it } from 'vitest';
import { allMissions, findMission } from '../../content';
import { execute } from '../execute';
import { findForbiddenCommand, normalizeCommand } from '../../app/mission';
import { runAll } from './helpers';

describe('missions (contenu réel)', () => {
  it('contient 4 chapitres et 12 missions', () => {
    expect(allMissions).toHaveLength(12);
    expect(new Set(allMissions.map((mission) => mission.chapterId)).size).toBe(4);
  });

  for (const mission of allMissions) {
    it(`${mission.number} ${mission.id} — solution valide, état initial non gagné`, () => {
      const finalState = runAll(mission.initialState, mission.solution);
      const result = mission.validate(finalState);
      expect(result.ok, result.reason).toBe(true);

      const initialResult = mission.validate(mission.initialState);
      expect(initialResult.ok, 'l’état initial ne doit pas déjà valider la mission').toBe(false);

      expect(mission.solution).toHaveLength(mission.par);
      expect(mission.hints).toHaveLength(3);
      expect(mission.story.length).toBeGreaterThan(80);
      expect(mission.objective.length).toBeGreaterThan(10);
    });
  }

  for (const mission of allMissions.filter(
    (candidate) => (candidate.predictions?.length ?? 0) > 0,
  )) {
    it(`${mission.number} — prédictions cohérentes avec la solution`, () => {
      for (const prediction of mission.predictions ?? []) {
        const command = normalizeCommand(prediction.whenCommand);
        expect(mission.solution.map(normalizeCommand)).toContain(command);
        expect(prediction.options.length).toBeGreaterThan(1);
        expect(
          prediction.options.some((option) => option.id === prediction.correctOptionId),
        ).toBe(true);
      }
    });
  }

  it('4.1 — le WIP initial rend le switch sur main impossible', () => {
    const mission = findMission('hotfix-worktree');
    if (!mission) throw new Error('mission 4.1 attendue');
    const result = execute(mission.initialState, 'git switch main');
    expect(result.error?.code).toBe('local-changes-would-be-overwritten');
    expect(result.newState).toBe(mission.initialState);
  });

  for (const mission of allMissions.filter(
    (candidate) => (candidate.forbidden?.length ?? 0) > 0,
  )) {
    it(`${mission.number} — une commande interdite est refusée`, () => {
      const forbidden = mission.forbidden?.[0];
      if (!forbidden) throw new Error('forbidden attendu');
      expect(findForbiddenCommand(mission, forbidden.prefix)).not.toBeNull();
      expect(findForbiddenCommand(mission, mission.solution[0] ?? '')).toBeNull();

      const result = execute(mission.initialState, forbidden.prefix);
      expect(result.error).toBeDefined();
      expect(result.newState).toBe(mission.initialState);
    });
  }
});
