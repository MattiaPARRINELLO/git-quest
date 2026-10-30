import { describe, expect, it } from 'vitest';
import { basicRepo, removeWorkingFile, run } from './helpers';

function outputOf(state: ReturnType<typeof basicRepo>, command: string): string {
  return run(state, command).output.map((line) => line.text).join('\n');
}

describe('git status', () => {
  it('affiche un arbre propre', () => {
    const text = outputOf(basicRepo(), 'git status');
    expect(text).toContain('On branch main');
    expect(text).toContain('nothing to commit, working tree clean');
  });

  it('distingue non indexé, indexé et non suivi', () => {
    const repo = basicRepo();
    const edited = run(repo, 'edit src/app.ts "export const app = 2;"').newState;

    const unstaged = outputOf(edited, 'git status');
    expect(unstaged).toContain('Changes not staged for commit:');
    expect(unstaged).toContain('modified:   src/app.ts');
    expect(unstaged).toContain('no changes added to commit');

    const staged = run(edited, 'git add src/app.ts').newState;
    const stagedText = outputOf(staged, 'git status');
    expect(stagedText).toContain('Changes to be committed:');
    expect(stagedText).toContain('modified:   src/app.ts');

    const untracked = run(staged, 'touch notes.txt').newState;
    const untrackedText = outputOf(untracked, 'git status');
    expect(untrackedText).toContain('Untracked files:');
    expect(untrackedText).toContain('notes.txt');
  });

  it('affiche new file et deleted', () => {
    const repo = run(basicRepo(), 'touch nouveau.txt').newState;
    const added = run(repo, 'git add nouveau.txt').newState;
    const stagedText = outputOf(added, 'git status');
    expect(stagedText).toContain('new file:   nouveau.txt');

    const deleted = run(removeWorkingFile(added, 'README.md'), 'git add README.md').newState;
    expect(outputOf(deleted, 'git status')).toContain('deleted:    README.md');
  });

  it('affiche HEAD détaché', () => {
    const repo = basicRepo();
    const hash = Object.keys(repo.commits)[0];
    if (!hash) throw new Error('commit attendu');
    const detached = run(repo, `git checkout ${hash}`).newState;
    expect(outputOf(detached, 'git status')).toContain(`HEAD detached at ${hash.slice(0, 7)}`);
  });
});
