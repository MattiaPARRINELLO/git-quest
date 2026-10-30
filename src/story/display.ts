import type { RepoState } from '../engine/types';
import { changeSetOf, matchesSignature } from './slots';
import { STORY_SPECS } from './specs';
import type { SlotDefinition } from './types';

/**
 * Résolution des hashes **affichés**. Aucun texte de contenu ne contient de hash
 * littéral : on écrit `{slotId}` et on résout ici, depuis l'état réel du joueur.
 */

function allSlots(): readonly SlotDefinition[] {
  return STORY_SPECS.flatMap((mission) => mission.slots);
}

/** Commit le plus ancien de l'état qui satisfait la signature du slot. */
export function slotHashInState(state: RepoState, slotId: string): string | undefined {
  const definition = allSlots().find((slot) => slot.slotId === slotId);
  if (definition === undefined) return undefined;
  const commits = Object.values(state.commits).sort(
    (left, right) => left.timestamp - right.timestamp,
  );
  for (const commit of commits) {
    if (matchesSignature(commit, changeSetOf(state, commit), definition.signature)) {
      return commit.hash;
    }
  }
  return undefined;
}

const PLACEHOLDER = /\{([a-z0-9.-]+)\}/gi;

/** Remplace `{slotId}` par le hash réel. Slot non résolu → `…` (jamais un faux hash). */
export function resolvePlaceholders(text: string, state: RepoState): string {
  return text.replace(PLACEHOLDER, (_match, slotId: string) => {
    const hash = slotHashInState(state, slotId);
    return hash === undefined ? '…' : hash.slice(0, 7);
  });
}

/** Commits détachés créés depuis `entry` (branche de création absente). */
export function detachedCommitsSince(
  state: RepoState,
  entry: RepoState,
): { readonly hash: string; readonly message: string }[] {
  return Object.values(state.commits)
    .filter((commit) => entry.commits[commit.hash] === undefined && commit.branch === undefined)
    .sort((left, right) => left.timestamp - right.timestamp)
    .map((commit) => ({ hash: commit.hash, message: commit.message }));
}

/**
 * Message explicite quand plusieurs commits détachés existent : on ne choisit
 * jamais en silence lequel sera sauvé.
 */
export function detachedNotice(state: RepoState, entry: RepoState): string | null {
  const commits = detachedCommitsSince(state, entry);
  if (commits.length < 2) return null;
  const list = commits
    .map((commit) => `« ${commit.message} » (${commit.hash.slice(0, 7)})`)
    .join(', ');
  const last = commits[commits.length - 1];
  return `Plusieurs commits détachés ont été créés : ${list}. Le sauvetage portera sur ${
    last?.hash.slice(0, 7) ?? ''
  } (le plus récent) ; les autres restent dans le journal.`;
}

/** Premier hash de commit de l'état, pour les libellés génériques. */
export function oldestHash(state: RepoState): string | undefined {
  return Object.values(state.commits).sort(
    (left, right) => left.timestamp - right.timestamp,
  )[0]?.hash;
}

/** Commits non atteignables depuis une branche ni un HEAD : orphelins/détachés. */
export function unreferencedHashes(state: RepoState): string[] {
  const reachable = new Set<string>();
  const queue: string[] = Object.values(state.branches);
  for (const worktree of Object.values(state.worktrees)) {
    if (worktree.head.kind === 'detached') queue.push(worktree.head.commit);
  }
  while (queue.length > 0) {
    const hash = queue.shift();
    if (hash === undefined || reachable.has(hash)) continue;
    const commit = state.commits[hash];
    if (commit === undefined) continue;
    reachable.add(hash);
    queue.push(...commit.parents);
  }
  return Object.values(state.commits)
    .filter((commit) => !reachable.has(commit.hash))
    .sort((left, right) => left.timestamp - right.timestamp)
    .map((commit) => commit.hash);
}
