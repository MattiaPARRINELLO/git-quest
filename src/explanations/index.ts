import type { GitError, GitEvent } from '../engine/types';
import { t } from '../i18n';

/**
 * Traduit un événement du moteur en une phrase simple, pour l'UI et `explain`.
 * Les clés vivent dans `src/i18n/locales/` : aucune phrase française n'est
 * codée en dur ici.
 */
export function explainEvent(event: GitEvent): string {
  switch (event.type) {
    case 'repo-initialized':
      return t('explain.repoInitialized', { path: event.path });
    case 'commit-created':
      return event.branch === undefined
        ? t('explain.commitCreatedDetached', { commit: event.commit })
        : t('explain.commitCreatedBranch', { commit: event.commit, branch: event.branch });
    case 'branch-created':
      return t('explain.branchCreated', { name: event.name, commit: event.commit });
    case 'branch-deleted':
      return t('explain.branchDeleted', { name: event.name, wasAt: event.wasAt });
    case 'branch-moved':
      return t('explain.branchMoved', {
        name: event.name,
        from: event.from ?? t('explain.emptyRef'),
        to: event.to,
      });
    case 'head-attached':
      return t('explain.headAttached', { branch: event.branch, commit: event.commit });
    case 'head-detached':
      return t('explain.headDetached', { commit: event.commit });
    case 'head-moved':
      return t('explain.headMoved');
    case 'file-staged':
      return t('explain.fileStaged', { path: event.path });
    case 'working-file-created':
      return t('explain.workingFileCreated', { path: event.path });
    case 'working-file-edited':
      return t('explain.workingFileEdited', { path: event.path });
    case 'working-file-removed':
      return t('explain.workingFileRemoved', { path: event.path });
    case 'merge-fast-forward':
      return t('explain.mergeFastForward', {
        target: event.branch === null ? 'HEAD' : `« ${event.branch} »`,
        to: event.to,
      });
    case 'merge-commit':
      return t('explain.mergeCommit', { commit: event.commit });
    case 'merge-conflict':
      return t('explain.mergeConflict', {
        branch: event.branch,
        paths: event.paths.join(', '),
        verb:
          event.paths.length > 1
            ? t('explain.mergeConflictMany')
            : t('explain.mergeConflictOne'),
      });
    case 'conflict-resolved':
      return t('explain.conflictResolved', { path: event.path });
    case 'merge-aborted':
      return t('explain.mergeAborted', { branch: event.branch });
    case 'remote-added':
      return t('explain.remoteAdded', { name: event.name, url: event.url });
    case 'remote-removed':
      return t('explain.remoteRemoved', { name: event.name });
    case 'remote-fetched':
      return event.branches.length === 0
        ? t('explain.remoteFetchedEmpty', { remote: event.remote })
        : t('explain.remoteFetched', {
            remote: event.remote,
            branches: event.branches.join(', '),
          });
    case 'remote-updated':
      return t('explain.remoteUpdated', {
        remote: event.remote,
        branch: event.branch,
        from: event.from ?? t('explain.emptyRef'),
        to: event.to,
      });
    case 'upstream-set':
      return t('explain.upstreamSet', {
        branch: event.branch,
        upstream: event.upstream,
      });
    case 'up-to-date':
      return t('explain.upToDate', { branch: event.branch });
    case 'worktree-added':
      return event.branch === undefined
        ? t('explain.worktreeAdded', { path: event.path })
        : t('explain.worktreeAddedBranch', { path: event.path, branch: event.branch });
    case 'worktree-removed':
      return t('explain.worktreeRemoved', { path: event.path });
    case 'worktree-activated':
      return t('explain.worktreeActivated', { path: event.path });
  }
}

/** Explication pédagogique d'une erreur Git simulée. */
export function explainError(error: GitError): string {
  switch (error.code) {
    case 'not-a-repository':
      return t('error.notARepository');
    case 'local-changes-would-be-overwritten':
      return t('error.localChanges');
    case 'untracked-files-would-be-overwritten':
      return t('error.untrackedOverwritten');
    case 'branch-checked-out-elsewhere':
      return t('error.branchCheckedOutElsewhere');
    case 'branch-not-fully-merged':
      return t('error.branchNotFullyMerged');
    case 'merge-would-conflict':
      return t('error.mergeWouldConflict');
    case 'unmerged-files':
      return t('error.unmergedFiles');
    case 'no-merge-in-progress':
      return t('error.noMergeInProgress');
    case 'merge-in-progress':
      return t('error.mergeInProgress');
    case 'remote-not-found':
      return t('error.remoteNotFound');
    case 'remote-already-exists':
      return t('error.remoteAlreadyExists');
    case 'remote-ref-not-found':
      return t('error.remoteRefNotFound');
    case 'no-upstream':
      return t('error.noUpstream');
    case 'push-rejected':
      return t('error.pushRejected');
    case 'not-on-a-branch':
      return t('error.notOnABranch');
    case 'no-push-destination':
      return t('error.noPushDestination');
    case 'worktree-has-local-modifications':
      return t('error.worktreeLocalModifications');
    case 'worktree-remove-main':
      return t('error.worktreeRemoveMain');
    case 'worktree-remove-active':
      return t('error.worktreeRemoveActive');
    case 'branch-not-found':
    case 'invalid-reference':
      return t('error.branchNotFound');
    case 'branch-already-exists':
      return t('error.branchAlreadyExists');
    case 'nothing-to-commit':
      return t('error.nothingToCommit');
    case 'no-changes-added':
      return t('error.noChangesAdded');
    case 'pathspec-no-match':
      return t('error.pathspecNoMatch');
    case 'commit-message-not-quoted':
      return t('error.commitMessageNotQuoted');
    case 'file-not-found':
      return t('error.fileNotFound');
    case 'directory-not-found':
      return t('error.directoryNotFound');
    case 'no-commits':
      return t('error.noCommits');
    default:
      return t('error.generic');
  }
}
