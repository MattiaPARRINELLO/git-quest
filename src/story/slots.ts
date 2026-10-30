import { diffTrees } from '../engine/ops/diff';
import type { Commit, FileTree, RepoState } from '../engine/types';
import { commitsSince } from './preconditions';
import type {
  ChangeSet,
  CommitCandidate,
  SlotDefinition,
  SlotGroup,
  SlotId,
  SlotRecord,
  SlotSignature,
  SlotTable,
} from './types';

/**
 * Résolution des slots : on associe un commit du joueur à un slot par **contenu**
 * (fichiers et versions introduits), jamais par position ni par hash.
 */

/** Snapshot du premier parent (arbre vide pour un commit racine). */
export function parentSnapshot(state: RepoState, commit: Commit): FileTree {
  const parent = commit.parents[0];
  if (parent === undefined) return {};
  return state.commits[parent]?.snapshot ?? {};
}

/** Changements introduits par un commit par rapport à son premier parent. */
export function changeSetOf(state: RepoState, commit: Commit): ChangeSet {
  const before = parentSnapshot(state, commit);
  return diffTrees(before, commit.snapshot).map((change) => ({
    path: change.path,
    content: change.status === 'deleted' ? null : commit.snapshot[change.path] ?? null,
  }));
}

function branchMatches(commit: Commit, signature: SlotSignature): boolean {
  if (signature.branch === undefined) return true;
  if (signature.branch === null) return commit.branch === undefined;
  return commit.branch === signature.branch;
}

function fileMatches(changes: ChangeSet, path: string, content: string): boolean {
  return changes.some((change) => change.path === path && change.content === content);
}

/** Un commit satisfait-il la signature d'un slot ? */
export function matchesSignature(
  commit: Commit,
  changes: ChangeSet,
  signature: SlotSignature,
): boolean {
  if (!branchMatches(commit, signature)) return false;
  for (const [path, content] of Object.entries(signature.files ?? {})) {
    if (!fileMatches(changes, path, content)) return false;
  }
  for (const path of signature.present ?? []) {
    if (commit.snapshot[path] === undefined) return false;
  }
  for (const path of signature.absent ?? []) {
    if (commit.snapshot[path] !== undefined) return false;
  }
  return true;
}

/**
 * Associe les commits créés depuis `entry` aux slots, dans l'ordre.
 * Un commit peut couvrir plusieurs slots consécutifs : il produit un seul groupe.
 */
export function associateSlots(
  state: RepoState,
  entry: RepoState,
  slots: readonly SlotDefinition[],
): SlotGroup[] {
  const candidates: CommitCandidate[] = commitsSince(state, entry).map((commit) => ({
    commit,
    changes: changeSetOf(state, commit),
  }));

  const groups: SlotGroup[] = [];
  let slotIndex = 0;
  for (const candidate of candidates) {
    if (slotIndex >= slots.length) break;
    const matched: SlotId[] = [];
    while (slotIndex < slots.length) {
      const slot = slots[slotIndex];
      if (slot === undefined) break;
      if (!matchesSignature(candidate.commit, candidate.changes, slot.signature)) break;
      matched.push(slot.slotId);
      slotIndex += 1;
    }
    if (matched.length > 0) {
      groups.push({
        slots: matched,
        commitHash: candidate.commit.hash,
        message: candidate.commit.message,
      });
    }
  }
  return groups;
}

/** Commits créés depuis `entry` qui ne remplissent aucun slot (détours). */
export function unmatchedCommits(
  state: RepoState,
  entry: RepoState,
  groups: readonly SlotGroup[],
): Commit[] {
  const matched = new Set(groups.map((group) => group.commitHash));
  return commitsSince(state, entry).filter((commit) => !matched.has(commit.hash));
}

/** Table `slot -> commit`, utilisée pour résoudre les hash affichés. */
export function buildSlotTable(
  slots: readonly SlotDefinition[],
  groups: readonly SlotGroup[],
): SlotTable {
  const definitions = new Map(slots.map((slot) => [slot.slotId, slot]));
  const table: Record<SlotId, SlotRecord> = {};
  for (const group of groups) {
    for (const slotId of group.slots) {
      const definition = definitions.get(slotId);
      if (definition === undefined) continue;
      table[slotId] = {
        slotId,
        missionId: definition.missionId,
        message: group.message,
        commitHash: group.commitHash,
      };
    }
  }
  return table;
}

/** Hash du commit qui remplit un slot, ou `undefined` si le slot est vide. */
export function resolveSlot(table: SlotTable, slotId: SlotId): string | undefined {
  return table[slotId]?.commitHash;
}
