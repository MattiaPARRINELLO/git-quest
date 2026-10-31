import type { ExecuteResult, ParsedCommand, RepoState, Remote } from '../types';
import { gitError } from '../errors';
import { remotesOf } from '../ops/remotes';
import { failure, line, requireRepository, success } from './shared';

type RemoteCommand = Extract<ParsedCommand, { kind: 'git-remote' }>;

const NAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export function gitRemote(state: RepoState, command: RemoteCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const remotes = remotesOf(state);
  const names = Object.keys(remotes).sort();

  if (command.action === 'list') {
    if (command.verbose) {
      return success(
        state,
        names.flatMap((name) => {
          const remote = remotes[name];
          if (remote === undefined) return [];
          return [
            line(`${name}\t${remote.url} (fetch)`),
            line(`${name}\t${remote.url} (push)`),
          ];
        }),
        [],
      );
    }
    return success(state, names.map((name) => line(name)), []);
  }

  const name = command.name;
  if (name === undefined) {
    return failure(state, gitError('invalid-option', 'error: remote name required'));
  }

  if (command.action === 'add') {
    if (!NAME_PATTERN.test(name)) {
      return failure(
        state,
        gitError('invalid-option', `error: '${name}' is not a valid remote name`),
      );
    }
    if (remotes[name] !== undefined) {
      return failure(
        state,
        gitError('remote-already-exists', `error: remote ${name} already exists.`),
      );
    }
    const url = command.url;
    if (url === undefined || url.trim() === '') {
      return failure(
        state,
        gitError('invalid-option', `error: remote ${name} requires a URL`),
      );
    }

    const remote: Remote = { name, url, branches: {} };
    return success(
      { ...state, remotes: { ...remotes, [name]: remote } },
      [],
      [{ type: 'remote-added', name, url }],
    );
  }

  // remove
  if (remotes[name] === undefined) {
    return failure(
      state,
      gitError('remote-not-found', `error: No such remote: '${name}'`),
    );
  }

  const nextRemotes = { ...remotes };
  delete nextRemotes[name];

  const remoteTracking: Record<string, string> = { ...(state.remoteTracking ?? {}) };
  for (const key of Object.keys(remoteTracking)) {
    if (key.startsWith(`${name}/`)) delete remoteTracking[key];
  }

  const upstream: Record<string, string> = { ...(state.upstream ?? {}) };
  for (const [branch, ref] of Object.entries(upstream)) {
    if (ref.startsWith(`${name}/`)) delete upstream[branch];
  }

  return success(
    { ...state, remotes: nextRemotes, remoteTracking, upstream },
    [],
    [{ type: 'remote-removed', name }],
  );
}
