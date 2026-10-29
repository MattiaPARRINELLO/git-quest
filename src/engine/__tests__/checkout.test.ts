import { describe, expect, it } from 'vitest';
import { execute } from '../execute';
import { basicRepo, expectError, run } from './helpers';

describe('git checkout', () => {
  it('détache HEAD sur un commit', () => {
    const repo = basicRepo();
    const hash = repo.branches.main;
    if (!hash) throw new Error('main attendue');
    const result = execute(repo, `git checkout ${hash.slice(0, 7)}`);

    expect(result.error).toBeUndefined();
    expect(result.newState.worktrees.main?.head).toEqual({
      kind: 'detached',
      commit: hash,
    });
    expect(result.events).toEqual([{ type: 'head-detached', commit: hash }]);
    expect(result.output.map((line) => line.text).join('\n')).toContain('detached HEAD');
  });

  it('checkout <branche> se comporte comme switch', () => {
    const repo = run(run(basicRepo(), 'git branch feature').newState, 'git checkout feature').newState;
    expect(repo.worktrees.main?.head).toEqual({ kind: 'branch', branch: 'feature' });
  });

  it('refuse une cible inconnue', () => {
    expectError(basicRepo(), 'git checkout deadbeef', 'pathspec-no-match');
  });

  it('applique les mêmes règles de sécurité que switch', () => {
    const repo = run(
      run(
        run(basicRepo(), 'git branch feature').newState,
        'git switch feature',
      ).newState,
      'edit README.md "feature"',
    ).newState;
    const committed = run(repo, 'git commit -am "feat"').newState;
    const main = run(committed, 'git switch main').newState;
    const dirty = run(main, 'edit README.md "local"').newState;
    expectError(dirty, 'git checkout feature', 'local-changes-would-be-overwritten');
  });
});
