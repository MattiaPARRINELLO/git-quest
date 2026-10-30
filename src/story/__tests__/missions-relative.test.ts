import { describe, expect, it } from 'vitest';
import { allMissions } from '../../content';
import type { Mission } from '../../content/types';
import { execute } from '../../engine/execute';
import type { RepoState } from '../../engine/types';
import { withSideCommits } from './helpers';

function runAll(state: RepoState, commands: readonly string[]): RepoState {
  return commands.reduce((current, command) => {
    const result = execute(current, command);
    if (result.error) throw new Error(`« ${command} » a échoué : ${result.error.message}`);
    return result.newState;
  }, state);
}

/**
 * La solution de 2.3 référence le hash de l'orphelin. Depuis une entrée
 * décalée, ce hash diffère : on le résout par contenu, comme le fera le
 * story-repo.
 */
function solutionFor(mission: Mission, entry: RepoState): readonly string[] {
  if (mission.id !== 'commit-perdu') return mission.solution;
  const beforeBranching = mission.solution.slice(0, -1);
  const intermediate = runAll(entry, beforeBranching);
  const orphan = Object.values(intermediate.commits).find(
    (commit) => entry.commits[commit.hash] === undefined && commit.snapshot['exp.txt'] !== undefined,
  );
  if (orphan === undefined) throw new Error('Commit orphelin introuvable');
  return [...beforeBranching, `git branch sauvetage ${orphan.hash}`];
}

describe('missions validées depuis une entrée décalée', () => {
  for (const mission of allMissions) {
    it(`${mission.number} ${mission.id} — résultat identique avec des commits en plus`, () => {
      const shifted = withSideCommits(mission.initialState, 3);
      const shiftedFinal = runAll(shifted, solutionFor(mission, shifted));

      const result = mission.validate(shiftedFinal, { entry: shifted });
      expect(result.ok, result.reason).toBe(true);

      for (const step of mission.steps) {
        expect(
          step.done(shiftedFinal, { entry: shifted }),
          `étape non cochée depuis une entrée décalée : ${step.label}`,
        ).toBe(true);
      }

      const canonicalFinal = runAll(mission.initialState, mission.solution);
      for (const [branch, tip] of Object.entries(canonicalFinal.branches)) {
        const shiftedTip = shiftedFinal.branches[branch];
        expect(shiftedTip, `branche absente : ${branch}`).toBeDefined();
        expect(shiftedFinal.commits[shiftedTip ?? '']?.snapshot).toEqual(
          canonicalFinal.commits[tip]?.snapshot,
        );
      }
      expect(shiftedFinal.worktrees[shiftedFinal.activeWorktree]?.path).toBe(
        canonicalFinal.worktrees[canonicalFinal.activeWorktree]?.path,
      );
    });
  }

  it('les commits de décalage ne sont jamais attribués à la mission', () => {
    const mission = allMissions[0];
    if (!mission) throw new Error('mission attendue');
    const shifted = withSideCommits(mission.initialState, 2);
    const final = runAll(shifted, mission.solution);
    const entryCommits = new Set(Object.keys(shifted.commits));
    const created = Object.keys(final.commits).filter((hash) => !entryCommits.has(hash));
    expect(created).toHaveLength(1);
  });
});
