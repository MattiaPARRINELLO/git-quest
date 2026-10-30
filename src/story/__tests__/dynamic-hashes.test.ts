import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findMission } from '../../content';
import { missionText, resolvePrediction } from '../../app/mission';
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

const HASH = /[0-9a-f]{7}/g;

describe('hashes affichés, résolus depuis l’état du joueur', () => {
  it('2.3 — l’indice et la solution affichent le hash réel de l’orphelin', () => {
    const mission = findMission('commit-perdu');
    if (!mission) throw new Error('mission 2.3 attendue');

    const shifted = withSideCommits(mission.initialState, 2);
    const before = runAll(shifted, mission.solution.slice(0, -1));
    const orphan = Object.values(before.commits).find(
      (commit) =>
        shifted.commits[commit.hash] === undefined && commit.snapshot['exp.txt'] === 'expérience',
    );
    if (!orphan) throw new Error('orphelin attendu');
    const final = runAll(before, [`git branch sauvetage ${orphan.hash}`]);

    const texts = missionText(mission, final);
    expect(texts.hints[2]).toContain(orphan.hash.slice(0, 7));
    expect(texts.solution.join(' ')).toContain(orphan.hash.slice(0, 7));

    for (const token of texts.solution.join(' ').match(HASH) ?? []) {
      const exists = Object.values(final.commits).some((commit) => commit.hash.startsWith(token));
      expect(exists, `hash affiché absent du dépôt : ${token}`).toBe(true);
    }
  });

  it('2.1 — le libellé « détaché » utilise le tip réel de main', () => {
    const mission = findMission('branche-pointeur');
    if (!mission) throw new Error('mission 2.1 attendue');
    const prediction = mission.predictions?.[0];
    if (!prediction) throw new Error('prédiction attendue');

    const shifted = withSideCommits(mission.initialState, 3);
    const before = runAll(shifted, ['git branch experiment']);
    const resolved = resolvePrediction(prediction, before);
    const detached = resolved.options.find((option) => option.id === 'detached');
    expect(detached?.label).toContain((before.branches.main ?? '').slice(0, 7));
    expect(detached?.target?.value).toBe(before.branches.main);
  });

  it('aucun hash littéral dans le contenu', () => {
    const files: string[] = [];
    const walk = (directory: string): void => {
      for (const entry of readdirSync(directory)) {
        const path = join(directory, entry);
        if (statSync(path).isDirectory()) walk(path);
        else if (path.endsWith('.ts') && !path.includes('__tests__')) files.push(path);
      }
    };
    walk('src/content');

    const offenders: string[] = [];
    for (const file of files) {
      for (const match of readFileSync(file, 'utf8').match(HASH) ?? []) {
        offenders.push(`${file} : ${match}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
