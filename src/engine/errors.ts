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

export function conflictError(paths: readonly string[]): GitError {
  return gitError(
    'merge-would-conflict',
    [
      ...paths.map((path) => `Auto-merging ${path}`),
      ...paths.map((path) => `CONFLICT (content): Merge conflict in ${path}`),
      'Automatic merge failed; fix conflicts and then commit the result.',
      '(Les conflits ne sont pas gérés dans cette version de GitQuest.)',
    ].join('\n'),
  );
}
