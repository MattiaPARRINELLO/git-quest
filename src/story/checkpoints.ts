import type { RepoState } from '../engine/types';
import { buildChain } from './chain';
import type { ChainEntry } from './chain';
import { STORY_ROOT, STORY_SPECS } from './specs';

/**
 * Checkpoints canoniques, calculés une seule fois par chargement en rejouant la
 * chaîne de référence. Aucun checkpoint n'est écrit à la main.
 */
let cache: readonly ChainEntry[] | null = null;

export function storyChain(): readonly ChainEntry[] {
  cache ??= buildChain(STORY_ROOT, STORY_SPECS);
  return cache;
}

/** À n'utiliser que dans les tests qui changent les specs. */
export function resetStoryChain(): void {
  cache = null;
}

function findEntry(missionId: string): ChainEntry {
  const found = storyChain().find((entry) => entry.missionId === missionId);
  if (found === undefined) {
    throw new Error(`Mission absente de la chaîne de référence : ${missionId}`);
  }
  return found;
}

/** État d'entrée canonique d'une mission (prelude inclus). */
export function entryState(missionId: string): RepoState {
  return findEntry(missionId).entry;
}

/** État de sortie canonique d'une mission. */
export function checkpointAfter(missionId: string): RepoState {
  return findEntry(missionId).after;
}

/** Solution de référence avec ses hashes résolus pour CETTE chaîne. */
export function referenceCommands(missionId: string): readonly string[] {
  return findEntry(missionId).commands;
}

/** Table slot → commit à la sortie d'une mission. */
export function slotTableAfter(missionId: string): ChainEntry['table'] {
  return findEntry(missionId).table;
}

/** Chaîne reconstruite avec les messages du joueur (recalage au rejeu). */
export function storyChainWith(
  messages: Readonly<Record<string, string>>,
): readonly ChainEntry[] {
  return buildChain(STORY_ROOT, STORY_SPECS, messages);
}

export function entryStateWith(
  missionId: string,
  messages: Readonly<Record<string, string>>,
): RepoState {
  const found = storyChainWith(messages).find((entry) => entry.missionId === missionId);
  if (found === undefined) throw new Error(`Mission absente de la chaîne : ${missionId}`);
  return found.entry;
}

export function checkpointBeforeWith(
  missionId: string,
  messages: Readonly<Record<string, string>>,
): RepoState | null {
  const chain = storyChainWith(messages);
  const index = chain.findIndex((entry) => entry.missionId === missionId);
  if (index <= 0) return null;
  return chain[index - 1]?.after ?? null;
}
