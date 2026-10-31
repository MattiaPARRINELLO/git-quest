import type { GitError, GitErrorCode } from './types';

export function gitError(code: GitErrorCode, message: string): GitError {
  return { code, message };
}

export function notARepository(): GitError {
  return gitError(
    'not-a-repository',
    'fatal: not a git repository (or any of the parent directories): .git',
  );
}

export function localChangesWouldBeOverwritten(paths: readonly string[]): GitError {
  return gitError(
    'local-changes-would-be-overwritten',
    [
      'error: Your local changes to the following files would be overwritten by checkout:',
      ...[...paths].sort().map((path) => `\t${path}`),
      'Please commit your changes or stash them before you switch branches.',
      'Aborting',
    ].join('\n'),
  );
}

export function untrackedFilesWouldBeOverwritten(paths: readonly string[]): GitError {
  return gitError(
    'untracked-files-would-be-overwritten',
    [
      'error: The following untracked working tree files would be overwritten by checkout:',
      ...[...paths].sort().map((path) => `\t${path}`),
      'Please move or remove them before you switch branches.',
      'Aborting',
    ].join('\n'),
  );
}

export function branchCheckedOutElsewhere(branch: string, path: string): GitError {
  return gitError(
    'branch-checked-out-elsewhere',
    `fatal: '${branch}' is already checked out at '${path}'`,
  );
}

export function noSuchPath(target: string): GitError {
  return gitError('directory-not-found', `cd: no such file or directory: ${target}`);
}

export function unmergedFilesError(paths: readonly string[]): GitError {
  return gitError(
    'unmerged-files',
    [
      'error: Committing is not possible because you have unmerged files.',
      'hint: Fix them up in the work tree, and then use \'git add/rm <file>\'',
      'hint: as appropriate to mark resolution and make a commit.',
      'fatal: Exiting because of an unresolved conflict.',
      ...paths.map((path) => `\t${path}`),
    ].join('\n'),
  );
}

export function mergeInProgress(): GitError {
  return gitError(
    'merge-in-progress',
    [
      'fatal: You have not concluded your merge (MERGE_HEAD exists).',
      'Please, commit your changes before you switch branches.',
    ].join('\n'),
  );
}
