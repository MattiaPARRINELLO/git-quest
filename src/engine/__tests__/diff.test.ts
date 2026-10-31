import { describe, expect, it } from 'vitest';
import { fileDiff, treeDiff } from '../ops/unified-diff';
import { basicRepo, expectError, run } from './helpers';

function texts(state: ReturnType<typeof basicRepo>, command: string): string[] {
  return run(state, command).output.map((line) => line.text);
}

describe('unified diff', () => {
  it('affiche un fichier modifié avec son en-tête et son hunk', () => {
    const lines = fileDiff('README.md', 'v1', 'v2');
    expect(lines.map((line) => line.text)).toEqual([
      'diff --git a/README.md b/README.md',
      expect.stringMatching(/^index [0-9a-f]{7}\.\.[0-9a-f]{7} 100644$/),
      '--- a/README.md',
      '+++ b/README.md',
      '@@ -1 +1 @@',
      '-v1',
      '+v2',
    ]);
  });

  it('marque un ajout et une suppression de fichier', () => {
    const added = fileDiff('notes.txt', undefined, 'bonjour').map((line) => line.text);
    expect(added).toContain('new file mode 100644');
    expect(added).toContain('--- /dev/null');
    expect(added).toContain('+++ b/notes.txt');
    expect(added).toContain('+bonjour');

    const deleted = fileDiff('notes.txt', 'bonjour', undefined).map((line) => line.text);
    expect(deleted).toContain('deleted file mode 100644');
    expect(deleted).toContain('--- a/notes.txt');
    expect(deleted).toContain('+++ /dev/null');
    expect(deleted).toContain('-bonjour');
  });

  it('groupe les lignes avec trois lignes de contexte', () => {
    const before = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].join('\n');
    const after = ['a', 'b', 'c', 'D', 'e', 'f', 'g', 'h'].join('\n');
    const lines = fileDiff('f.txt', before, after).map((line) => line.text);
    expect(lines).toContain('@@ -1,7 +1,7 @@');
    expect(lines).toContain(' b');
    expect(lines).toContain('-d');
    expect(lines).toContain('+D');
  });

  it('produit deux hunks quand les changements sont éloignés', () => {
    const before = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].join('\n');
    const after = ['X', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'Y'].join('\n');
    const headers = fileDiff('f.txt', before, after)
      .map((line) => line.text)
      .filter((text) => text.startsWith('@@'));
    expect(headers).toHaveLength(2);
  });

  it('ne produit rien quand les arbres sont identiques', () => {
    expect(treeDiff({ a: 'x' }, { a: 'x' })).toEqual([]);
  });
});

describe('git diff', () => {
  it('compare le disque à l’index par défaut', () => {
    const repo = run(basicRepo(), 'edit README.md "v2"').newState;
    const output = texts(repo, 'git diff');
    expect(output).toContain('-# Projet');
    expect(output).toContain('+v2');
  });

  it('ignore les fichiers non suivis', () => {
    const repo = run(basicRepo(), 'touch notes.txt').newState;
    expect(texts(repo, 'git diff')).toEqual([]);
  });

  it('--staged compare l’index à HEAD', () => {
    const repo = run(
      run(basicRepo(), 'edit README.md "v2"').newState,
      'git add README.md',
    ).newState;
    expect(texts(repo, 'git diff')).toEqual([]);
    const staged = texts(repo, 'git diff --staged');
    expect(staged).toContain('+v2');
  });

  it('HEAD compare le disque à HEAD', () => {
    const staged = run(
      run(basicRepo(), 'edit README.md "v2"').newState,
      'git add README.md',
    ).newState;
    const repo = run(staged, 'edit README.md "v3"').newState;
    const output = texts(repo, 'git diff HEAD');
    expect(output).toContain('-# Projet');
    expect(output).toContain('+v3');
  });

  it('filtre par chemin', () => {
    const repo = run(
      run(basicRepo(), 'edit README.md "v2"').newState,
      'edit src/app.ts "v2"',
    ).newState;
    const output = texts(repo, 'git diff src/app.ts');
    expect(output).toContain('diff --git a/src/app.ts b/src/app.ts');
    expect(output.some((text) => text.includes('README.md'))).toBe(false);
  });

  it('ne modifie pas le dépôt', () => {
    const repo = run(basicRepo(), 'edit README.md "v2"').newState;
    const result = run(repo, 'git diff');
    expect(result.newState).toBe(repo);
    expect(result.events).toEqual([]);
  });

  it('refuse hors dépôt', () => {
    const repo = basicRepo();
    const empty = { ...repo, initialized: false };
    expectError(empty, 'git diff', 'not-a-repository');
  });
});
