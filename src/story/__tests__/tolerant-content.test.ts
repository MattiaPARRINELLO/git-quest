import { describe, expect, it } from 'vitest';
import { findMission } from '../../content';
import { execute } from '../../engine/execute';
import type { RepoState } from '../../engine/types';
import { associateSlots } from '../slots';
import { entryState } from '../checkpoints';
import { STORY_SPECS } from '../specs';

function runAll(state: RepoState, commands: readonly string[]): RepoState {
  return commands.reduce((current, command) => {
    const result = execute(current, command);
    if (result.error) throw new Error(`« ${command} » a échoué : ${result.error.message}`);
    return result.newState;
  }, state);
}

function mission(id: string) {
  const found = findMission(id);
  if (!found) throw new Error(`mission absente : ${id}`);
  return found;
}

describe('contenu libre quand le concept ne porte pas sur le contenu', () => {
  it('2.1 accepte n’importe quel contenu dans notes.txt', () => {
    const target = mission('branche-pointeur');
    const entry = target.initialState;
    const final = runAll(entry, [
      'git branch experiment',
      'git switch experiment',
      'edit notes.txt "caca"',
      'git add notes.txt',
      'git commit -m "tried a new thing"',
    ]);

    const result = target.validate(final, { entry });
    expect(result.ok, result.reason).toBe(true);
    for (const step of target.steps) {
      expect(step.done(final, { entry }), step.label).toBe(true);
    }

    const spec = STORY_SPECS.find((candidate) => candidate.missionId === 'branche-pointeur');
    const groups = associateSlots(final, entry, spec?.slots ?? []);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.message).toBe('tried a new thing');
  });

  it('2.3 accepte n’importe quel contenu dans exp.txt', () => {
    const target = mission('commit-perdu');
    const entry = target.initialState;
    const root = Object.values(entry.commits).find((commit) => commit.parents.length === 0);
    if (!root) throw new Error('racine attendue');

    const detached = runAll(entry, [
      `git checkout ${root.hash}`,
      'edit exp.txt "autre expérience"',
      'git add exp.txt',
      'git commit -m "exp: autre"',
      'git switch main',
    ]);
    const orphan = Object.values(detached.commits).find(
      (commit) => entry.commits[commit.hash] === undefined && commit.snapshot['exp.txt'],
    );
    if (!orphan) throw new Error('orphelin attendu');
    const final = runAll(detached, [`git branch sauvetage ${orphan.hash}`]);

    const result = target.validate(final, { entry });
    expect(result.ok, result.reason).toBe(true);
  });

  it('4.1 accepte une correction différente de « corrigé »', () => {
    const target = mission('hotfix-worktree');
    const entry = target.initialState;
    const commands = target.solution.map((command) =>
      command === 'edit bug.txt "corrigé"' ? 'edit bug.txt "patch prod"' : command,
    );
    const final = runAll(entry, commands);

    const result = target.validate(final, { entry });
    expect(result.ok, result.reason).toBe(true);
    for (const step of target.steps) {
      expect(step.done(final, { entry }), step.label).toBe(true);
    }
  });

  it('4.2 accepte un guide au contenu libre', () => {
    const target = mission('deux-worktrees');
    const entry = target.initialState;
    const commands = target.solution.map((command) =>
      command === 'edit docs/GUIDE.md "# Guide Nova"' ? 'edit docs/GUIDE.md "brouillon"' : command,
    );
    const final = runAll(entry, commands);

    const result = target.validate(final, { entry });
    expect(result.ok, result.reason).toBe(true);
  });

  it('les préconditions d’entrée restent inchangées', () => {
    expect(entryState('branche-pointeur')).toBe(mission('branche-pointeur').initialState);
  });
});
