import type { ExecuteResult, GitEvent, ParsedCommand, Remote, RepoState } from '../types';
import { gitError } from '../errors';
import { shortHash } from '../ops/refs';
import { remoteOf, remotesOf, trackingKey } from '../ops/remotes';
import { failure, line, requireRepository, success } from './shared';

type FetchCommand = Extract<ParsedCommand, { kind: 'git-fetch' }>;

/** Message Git quand le remote demandé n'existe pas. */
export function unknownRemote(name: string): ReturnType<typeof gitError> {
  return gitError(
    'remote-not-found',
    [
      `fatal: '${name}' does not appear to be a git repository`,
      'fatal: Could not read from remote repository.',
      '',
      'Please make sure you have the correct access rights',
      'and the repository exists.',
    ].join('\n'),
  );
}

export interface FetchResult {
  readonly state: RepoState;
  readonly output: readonly ReturnType<typeof line>[];
  readonly events: readonly GitEvent[];
}

/**
 * Met à jour les références de suivi (`origin/main`) depuis le serveur.
 * Les objets étant partagés dans le modèle, seules les références bougent.
 */
export function fetchRemote(state: RepoState, remote: Remote): FetchResult {
  const tracking: Record<string, string> = { ...(state.remoteTracking ?? {}) };
  const output = [line(`From ${remote.url}`)];
  const updated: string[] = [];

  for (const branch of Object.keys(remote.branches).sort()) {
    const tip = remote.branches[branch];
    if (tip === undefined) continue;
    const key = trackingKey(remote.name, branch);
    const previous = tracking[key];

    if (previous === tip) continue;

    tracking[key] = tip;
    updated.push(branch);
    output.push(
      line(
        previous === undefined
          ? ` * [new branch]      ${branch} -> ${key}`
          : `   ${shortHash(previous)}..${shortHash(tip)}  ${branch} -> ${key}`,
      ),
    );
  }

  return {
    state: { ...state, remoteTracking: tracking },
    output,
    events: [{ type: 'remote-fetched', remote: remote.name, branches: updated }],
  };
}

export function gitFetch(state: RepoState, command: FetchCommand): ExecuteResult {
  const repoError = requireRepository(state);
  if (repoError) return failure(state, repoError);

  const remotes = remotesOf(state);
  const name = command.remote ?? (remotes.origin === undefined ? undefined : 'origin');
  if (name === undefined) {
    return failure(
      state,
      gitError(
        'remote-not-found',
        'fatal: No remote repository specified.  Please, specify either a URL or a\nremote name from which new revisions should be fetched.',
      ),
    );
  }

  const remote = remoteOf(state, name);
  if (remote === undefined) return failure(state, unknownRemote(name));

  const result = fetchRemote(state, remote);
  return success(result.state, result.output, result.events);
}
