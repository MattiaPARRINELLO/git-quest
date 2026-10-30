import { describe, expect, it } from 'vitest';
import { execute } from '../execute';
import { basicRepo, expectError, run, runAll } from './helpers';

function featureWithNotes() {
  return runAll(basicRepo(), [
    'git branch feature',
    'git switch feature',
    'edit notes.txt "notes de feature"',
    'git add notes.txt',
    'git commit -m "feat: notes"',
    'git switch main',
  ]);
}

function featureWithReadmeChange() {
  return runAll(basicRepo(), [
    'git branch feature',
    'git switch feature',
    'edit README.md "version feature"',
    'git commit -am "feat: readme"',
    'git switch main',
  ]);
}

describe('git switch', () => {
  it('change HEAD et met à jour le working dir', () => {
    const repo = featureWithNotes();
    const result = execute(repo, 'git switch feature');
    expect(result.error).toBeUndefined();
    const state = result.newState;

    expect(state.worktrees.main?.head).toEqual({ kind: 'branch', branch: 'feature' });
    expect(state.worktrees.main?.workingDir['notes.txt']).toBe('notes de feature');
    expect(result.events).toEqual([
      { type: 'head-attached', branch: 'feature', commit: state.branches.feature },
    ]);
  });

  it('switch -c crée la branche et y attache HEAD', () => {
    const repo = basicRepo();
    const result = run(repo, 'git switch -c nouvelle');
    expect(result.newState.worktrees.main?.head).toEqual({
      kind: 'branch',
      branch: 'nouvelle',
    });
    expect(result.newState.branches.nouvelle).toBe(repo.branches.main);
  });

  it('refuse une branche inconnue et signale « Already on »', () => {
    expectError(basicRepo(), 'git switch inconnue', 'branch-not-found');
    const repo = basicRepo();
    const result = run(repo, 'git switch main');
    expect(result.output[0]?.text).toBe("Already on 'main'");
    expect(result.newState).toBe(repo);
  });

  it('refuse une branche checkout dans un autre worktree', () => {
    const repo = run(
      featureWithNotes(),
      'git worktree add ../gitquest-feature feature',
    ).newState;
    const error = expectError(repo, 'git switch feature', 'branch-checked-out-elsewhere');
    expect(error.message).toContain('already checked out');
  });

  it('emporte une modification locale si le fichier ne change pas entre les commits', () => {
    const repo = run(featureWithNotes(), 'edit README.md "brouillon local"').newState;
    const result = execute(repo, 'git switch feature');
    expect(result.error).toBeUndefined();
    expect(result.newState.worktrees.main?.workingDir['README.md']).toBe('brouillon local');
    expect(result.newState.worktrees.main?.workingDir['notes.txt']).toBe('notes de feature');
  });

  it('refuse si une modification locale serait écrasée', () => {
    const repo = run(featureWithReadmeChange(), 'edit README.md "brouillon local"').newState;
    const error = expectError(repo, 'git switch feature', 'local-changes-would-be-overwritten');
    expect(error.message).toContain('Your local changes');
    expect(error.message).toContain('README.md');
  });

  it('emporte une modification indexée non conflictuelle', () => {
    const repo = run(
      run(featureWithNotes(), 'edit README.md "indexé local"').newState,
      'git add README.md',
    ).newState;
    const result = run(repo, 'git switch feature');
    expect(result.newState.worktrees.main?.index['README.md']).toBe('indexé local');
  });

  it('refuse d’écraser un fichier non suivi', () => {
    const repo = run(featureWithNotes(), 'touch notes.txt').newState;
    const withContent = run(repo, 'edit notes.txt "brouillon"').newState;
    expectError(withContent, 'git switch feature', 'untracked-files-would-be-overwritten');
  });

  it('avertit quand on quitte des commits orphelins', () => {
    const repo = basicRepo();
    const base = repo.branches.main;
    if (!base) throw new Error('main attendue');
    const committed = runAll(repo, [
      `git checkout ${base}`,
      'edit README.md "expérience"',
      'git add README.md',
      'git commit -m "expérience"',
    ]);

    const result = run(committed, 'git switch main');
    const text = result.output.map((line) => line.text).join('\n');
    expect(text).toContain('Warning: you are leaving 1 commit behind');
    expect(text).toContain('git branch <new-branch-name>');
    expect(result.output[result.output.length - 1]?.text).toBe("Switched to branch 'main'");
  });

  it('switch -c <nom> <start> part d’un autre commit', () => {
    const repo = featureWithNotes();
    const mainTip = repo.branches.main;
    if (!mainTip) throw new Error('main attendue');
    const result = run(repo, 'git switch -c depuis-main main');
    expect(result.newState.branches['depuis-main']).toBe(mainTip);
    expect(result.newState.worktrees.main?.head).toEqual({
      kind: 'branch',
      branch: 'depuis-main',
    });
    expect(result.newState.worktrees.main?.workingDir['notes.txt']).toBeUndefined();
  });

  it('switch -c conserve les modifications locales', () => {
    const repo = run(basicRepo(), 'edit README.md "wip"').newState;
    const result = run(repo, 'git switch -c wip');
    expect(result.newState.worktrees.main?.workingDir['README.md']).toBe('wip');
  });
});
