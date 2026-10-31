import type { BranchName, CommitHash, Remote, RepoState } from '../types';
import { ancestorsOf } from './refs';

export function remotesOf(state: RepoState): Readonly<Record<string, Remote>> {
  return state.remotes ?? {};
}

export function remoteOf(state: RepoState, name: string): Remote | undefined {
  return remotesOf(state)[name];
}

/** Référence de suivi d'une branche distante : `origin/main`. */
export function trackingKey(remote: string, branch: BranchName): string {
  return `${remote}/${branch}`;
}

export interface UpstreamInfo {
  readonly remote: string;
  readonly branch: BranchName;
  readonly ref: string;
}

/** Décode `origin/main` en `{ remote: 'origin', branch: 'main' }`. */
export function upstreamOf(state: RepoState, branch: BranchName): UpstreamInfo | undefined {
  const ref = state.upstream?.[branch];
  if (ref === undefined) return undefined;
  const slash = ref.indexOf('/');
  if (slash <= 0) return undefined;
  return { remote: ref.slice(0, slash), branch: ref.slice(slash + 1), ref };
}

export interface AheadBehind {
  readonly ahead: number;
  readonly behind: number;
}

/** Commits que la branche locale a en plus / en moins par rapport à la distante. */
export function aheadBehind(
  state: RepoState,
  local: CommitHash,
  remote: CommitHash,
): AheadBehind {
  const localHistory = ancestorsOf(state, local);
  const remoteHistory = ancestorsOf(state, remote);
  let ahead = 0;
  for (const hash of localHistory) if (!remoteHistory.has(hash)) ahead += 1;
  let behind = 0;
  for (const hash of remoteHistory) if (!localHistory.has(hash)) behind += 1;
  return { ahead, behind };
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}
