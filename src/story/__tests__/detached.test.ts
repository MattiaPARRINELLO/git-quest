import { describe, expect, it } from 'vitest';
import { execute } from '../../engine/execute';
import type { RepoState } from '../../engine/types';
import { entryState } from '../checkpoints';
import { detachedNotice, oldestHash } from '../display';

function runAll(state: RepoState, commands: readonly string[]): RepoState {
  return commands.reduce((current, command) => {
    const result = execute(current, command);
    if (result.error) throw new Error(`« ${command} » a échoué : ${result.error.message}`);
    return result.newState;
  }, state);
}

describe('message des commits détachés multiples', () => {
  it('liste les commits et annonce celui qui sera sauvé', () => {
    const entry = entryState('commit-perdu');
    const oldest = oldestHash(entry);
    if (oldest === undefined) throw new Error('racine attendue');

    const one = runAll(entry, [
      `git checkout ${oldest}`,
      'git add exp.txt',
      'git commit -m "exp: idée"',
    ]);
    const two = runAll(one, [
      'edit trace.txt "seconde expérience"',
      'git add trace.txt',
      'git commit -m "exp: seconde idée"',
    ]);

    const notice = detachedNotice(two, entry);
    expect(notice).toContain('Plusieurs commits détachés');
    expect(notice).toContain('exp: idée');
    expect(notice).toContain('exp: seconde idée');
    const last = Object.values(two.commits).find(
      (commit) => commit.message === 'exp: seconde idée',
    );
    expect(notice).toContain(last?.hash.slice(0, 7) ?? 'introuvable');
  });

  it('ne dit rien avec un seul commit détaché', () => {
    const entry = entryState('commit-perdu');
    const oldest = oldestHash(entry);
    if (oldest === undefined) throw new Error('racine attendue');
    const one = runAll(entry, [
      `git checkout ${oldest}`,
      'git add exp.txt',
      'git commit -m "exp: idée"',
    ]);
    expect(detachedNotice(one, entry)).toBeNull();
  });
});
