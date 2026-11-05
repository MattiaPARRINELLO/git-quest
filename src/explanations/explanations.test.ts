import { afterEach, describe, expect, it } from 'vitest';
import type { GitErrorCode, GitEvent } from '../engine/types';
import { setLocale } from '../i18n';
import { explainError, explainEvent } from './index';

const EVENTS: readonly GitEvent[] = [
  { type: 'repo-initialized', path: '/home/nova' },
  { type: 'commit-created', commit: 'a1b2c3d', message: 'feat: app', worktree: 'main' },
  {
    type: 'commit-created',
    commit: 'a1b2c3d',
    message: 'feat: app',
    worktree: 'main',
    branch: 'main',
  },
  { type: 'branch-created', name: 'feature', commit: 'a1b2c3d' },
  { type: 'branch-deleted', name: 'feature', wasAt: 'a1b2c3d', force: false },
  { type: 'branch-moved', name: 'main', from: null, to: 'b2c3d4e' },
  { type: 'branch-moved', name: 'main', from: 'a1b2c3d', to: 'b2c3d4e' },
  { type: 'head-attached', branch: 'main', commit: 'a1b2c3d' },
  { type: 'head-detached', commit: 'a1b2c3d' },
  {
    type: 'head-moved',
    from: { kind: 'branch', branch: 'main' },
    to: { kind: 'detached', commit: 'a1b2c3d' },
  },
  { type: 'file-staged', path: 'a.txt' },
  { type: 'working-file-created', path: 'a.txt' },
  { type: 'working-file-edited', path: 'a.txt' },
  { type: 'working-file-removed', path: 'a.txt' },
  { type: 'merge-fast-forward', branch: null, from: 'a1b2c3d', to: 'b2c3d4e' },
  { type: 'merge-fast-forward', branch: 'main', from: 'a1b2c3d', to: 'b2c3d4e' },
  { type: 'merge-commit', commit: 'c3d4e5f', parents: ['a1b2c3d', 'b2c3d4e'] },
  { type: 'merge-conflict', branch: 'feature', paths: ['a.txt'], worktree: 'main' },
  { type: 'merge-conflict', branch: 'feature', paths: ['a.txt', 'b.txt'], worktree: 'main' },
  { type: 'conflict-resolved', path: 'a.txt' },
  { type: 'merge-aborted', branch: 'feature' },
  { type: 'remote-added', name: 'origin', url: 'git@example.com:nova/nova.git' },
  { type: 'remote-removed', name: 'origin' },
  { type: 'remote-fetched', remote: 'origin', branches: [] },
  { type: 'remote-fetched', remote: 'origin', branches: ['main', 'feature'] },
  {
    type: 'remote-updated',
    remote: 'origin',
    branch: 'main',
    from: null,
    to: 'a1b2c3d',
  },
  {
    type: 'remote-updated',
    remote: 'origin',
    branch: 'main',
    from: 'a1b2c3d',
    to: 'b2c3d4e',
  },
  { type: 'upstream-set', branch: 'main', upstream: 'origin/main' },
  { type: 'up-to-date', branch: 'main' },
  { type: 'worktree-added', id: 'hotfix', path: '../hotfix' },
  { type: 'worktree-added', id: 'hotfix', path: '../hotfix', branch: 'hotfix' },
  { type: 'worktree-removed', id: 'hotfix', path: '../hotfix' },
  { type: 'worktree-activated', id: 'hotfix', path: '../hotfix' },
];

const ERROR_CODES: readonly GitErrorCode[] = [
  'not-a-repository',
  'branch-not-found',
  'branch-already-exists',
  'invalid-branch-name',
  'invalid-reference',
  'pathspec-no-match',
  'commit-message-not-quoted',
  'file-not-found',
  'no-commits',
  'nothing-to-commit',
  'no-changes-added',
  'invalid-commit-message',
  'branch-checked-out-elsewhere',
  'branch-not-fully-merged',
  'local-changes-would-be-overwritten',
  'untracked-files-would-be-overwritten',
  'merge-would-conflict',
  'unmerged-files',
  'no-merge-in-progress',
  'merge-in-progress',
  'remote-not-found',
  'remote-already-exists',
  'remote-ref-not-found',
  'no-upstream',
  'push-rejected',
  'not-on-a-branch',
  'no-push-destination',
  'worktree-path-exists',
  'worktree-not-found',
  'worktree-has-local-modifications',
  'worktree-remove-main',
  'worktree-remove-active',
  'worktree-branch-checked-out',
  'directory-not-found',
  'invalid-option',
  'unknown-command',
];

describe('explications', () => {
  afterEach(() => setLocale('fr'));

  it('explique chaque type d’événement, en français et en anglais', () => {
    for (const locale of ['fr', 'en'] as const) {
      setLocale(locale);
      for (const event of EVENTS) {
        const text = explainEvent(event);
        expect(text.length, `${locale} : ${event.type}`).toBeGreaterThan(0);
        expect(text, `${locale} : ${event.type} contient un placeholder`).not.toMatch(/\{[a-z]+\}/);
      }
    }
  });

  it('explique chaque code d’erreur, en français et en anglais', () => {
    for (const locale of ['fr', 'en'] as const) {
      setLocale(locale);
      for (const code of ERROR_CODES) {
        const text = explainError({ code, message: 'message Git' });
        expect(text.length, `${locale} : ${code}`).toBeGreaterThan(0);
        expect(text, `${locale} : ${code} contient un placeholder`).not.toMatch(/\{[a-z]+\}/);
      }
    }
  });
});
