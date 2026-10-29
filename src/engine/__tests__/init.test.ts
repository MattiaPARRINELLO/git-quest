import { describe, expect, it } from 'vitest';
import { execute } from '../execute';
import { scenario } from '../scenario';
import { emptyRepo, expectError, run } from './helpers';

describe('git init', () => {
  it('crée un dépôt vide avec HEAD attaché à main, sans référence main', () => {
    const result = run(scenario().build(), 'git init');
    const state = result.newState;

    expect(state.initialized).toBe(true);
    expect(state.activeWorktree).toBe('main');
    expect(state.worktrees.main?.head).toEqual({ kind: 'branch', branch: 'main' });
    expect(state.worktrees.main?.path).toBe('~/gitquest');
    expect(state.branches).toEqual({});
    expect(state.commits).toEqual({});
    expect(result.events).toEqual([{ type: 'repo-initialized', path: '~/gitquest' }]);
  });

  it('affiche « No commits yet »', () => {
    const result = run(emptyRepo(), 'git status');
    expect(result.output.map((line) => line.text).join('\n')).toContain('No commits yet');
  });

  it('réinitialise sans casser un dépôt existant', () => {
    const state = emptyRepo();
    const result = run(state, 'git init');
    expect(result.newState).toBe(state);
    expect(result.output[0]?.text).toContain('Reinitialized existing Git repository');
  });

  it('refuse les commandes Git hors dépôt', () => {
    expectError(scenario().build(), 'git status', 'not-a-repository');
    expectError(scenario().build(), 'git add .', 'not-a-repository');
    expectError(scenario().build(), 'git commit -m test', 'not-a-repository');
  });

  it('expose init via execute', () => {
    const state = scenario().build();
    expect(execute(state, 'git init').newState.initialized).toBe(true);
  });
});
