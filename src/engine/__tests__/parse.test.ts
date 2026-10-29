import { describe, expect, it } from 'vitest';
import { parseCommand } from '../parse/parse-command';
import { tokenize } from '../parse/tokenize';

function parsed(input: string) {
  const result = parseCommand(input);
  if (!result.ok) throw new Error(result.error.message);
  return result.command;
}

describe('tokenize', () => {
  it('gère les espaces, les quotes et les échappements', () => {
    expect(tokenize('git commit -am "hello world"')).toEqual([
      'git',
      'commit',
      '-am',
      'hello world',
    ]);
    expect(tokenize("touch 'mon fichier.txt'")).toEqual(['touch', 'mon fichier.txt']);
    expect(tokenize('edit a.txt "ligne \\"citée\\""')).toEqual([
      'edit',
      'a.txt',
      'ligne "citée"',
    ]);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('parseCommand', () => {
  it('reconnaît les commandes du MVP', () => {
    expect(parsed('git init')).toEqual({ kind: 'git-init' });
    expect(parsed('git status')).toEqual({ kind: 'git-status' });
    expect(parsed('git add -A')).toEqual({ kind: 'git-add', paths: [], all: true });
    expect(parsed('git add src/a.ts')).toEqual({
      kind: 'git-add',
      paths: ['src/a.ts'],
      all: false,
    });
    expect(parsed('git commit -m "feat: login"')).toEqual({
      kind: 'git-commit',
      message: 'feat: login',
      stageAllTracked: false,
    });
    expect(parsed('git commit -am "fix: bug"')).toEqual({
      kind: 'git-commit',
      message: 'fix: bug',
      stageAllTracked: true,
    });
    expect(parsed('git log --oneline --graph')).toEqual({
      kind: 'git-log',
      oneline: true,
      graph: true,
    });
    expect(parsed('git branch -D vieille')).toEqual({
      kind: 'git-branch',
      action: 'delete',
      name: 'vieille',
      force: true,
    });
    expect(parsed('git switch -c feature')).toEqual({
      kind: 'git-switch',
      branch: 'feature',
      create: true,
    });
    expect(parsed('git checkout abc1234')).toEqual({
      kind: 'git-checkout',
      target: 'abc1234',
    });
    expect(parsed('git merge feature')).toEqual({ kind: 'git-merge', branch: 'feature' });
    expect(parsed('git worktree add ../hotfix -b hotfix')).toEqual({
      kind: 'git-worktree',
      action: 'add',
      path: '../hotfix',
      createBranch: 'hotfix',
      force: false,
    });
    expect(parsed('git worktree add ../hotfix -b hotfix main')).toEqual({
      kind: 'git-worktree',
      action: 'add',
      path: '../hotfix',
      createBranch: 'hotfix',
      branch: 'main',
      force: false,
    });
    expect(parsed('git worktree remove ../hotfix --force')).toEqual({
      kind: 'git-worktree',
      action: 'remove',
      path: '../hotfix',
      force: true,
    });
    expect(parsed('touch notes.txt')).toEqual({ kind: 'shell-touch', path: 'notes.txt' });
    expect(parsed('edit notes.txt "contenu"')).toEqual({
      kind: 'shell-edit',
      path: 'notes.txt',
      content: 'contenu',
    });
    expect(parsed('ls')).toEqual({ kind: 'shell-ls' });
    expect(parsed('cd ../hotfix')).toEqual({ kind: 'shell-cd', target: '../hotfix' });
  });

  it('refuse les commandes inconnues et les options invalides', () => {
    const unknown = parseCommand('git push');
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.error.code).toBe('unknown-command');

    const rebase = parseCommand('rebase');
    expect(rebase.ok).toBe(false);
    if (!rebase.ok) expect(rebase.error.message).toBe('command not found: rebase');

    const option = parseCommand('git log --stat');
    expect(option.ok).toBe(false);
    if (!option.ok) expect(option.error.code).toBe('invalid-option');
  });

  it('refuse un commit sans message', () => {
    const result = parseCommand('git commit -m');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid-commit-message');
  });
});
