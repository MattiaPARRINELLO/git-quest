import { execute } from '../engine/execute';
import type { RepoState } from '../engine/types';
import { associateSlots, buildSlotTable } from './slots';
import type { SlotDefinition, SlotTable } from './types';

/**
 * Chaîne de référence du story-repo.
 *
 * `checkpoint(n)` = `checkpoint(n-1)` + prelude(n) + solution(n), calculé en
 * rejouant les commandes avec le vrai moteur. Rien n'est écrit à la main.
 */

export interface PreludeStep {
  readonly id: string;
  /** Garde d'idempotence : si vrai, l'étape est déjà appliquée. */
  readonly when?: (state: RepoState) => boolean;
  readonly commands: readonly string[];
}

export interface ChainMission {
  readonly missionId: string;
  readonly prelude: readonly PreludeStep[];
  readonly slots: readonly SlotDefinition[];
  /** Solution de référence ; `{slotId}` est résolu dynamiquement. */
  readonly reference: readonly string[];
}

export interface ChainEntry {
  readonly missionId: string;
  /** Entrée effective : checkpoint précédent + prelude de la mission. */
  readonly entry: RepoState;
  /** Sortie canonique : entrée + solution de référence. */
  readonly after: RepoState;
  readonly table: SlotTable;
}

function run(state: RepoState, command: string): RepoState {
  const result = execute(state, command);
  if (result.error) {
    throw new Error(`Chaîne invalide : « ${command} » → ${result.error.message}`);
  }
  return result.newState;
}

function runAll(state: RepoState, commands: readonly string[]): RepoState {
  return commands.reduce(run, state);
}

/** Applique un prelude en sautant les étapes déjà satisfaites. */
export function applyPrelude(
  state: RepoState,
  prelude: readonly PreludeStep[],
): RepoState {
  let current = state;
  for (const step of prelude) {
    if (step.when?.(current) === true) continue;
    current = runAll(current, step.commands);
  }
  return current;
}

/**
 * Résout `{slotId}` dans une commande :
 * 1. dans la table des missions précédentes ;
 * 2. sinon, dans un commit créé depuis `entry` qui satisfait la signature du slot.
 */
export function resolveTemplate(
  template: string,
  state: RepoState,
  entry: RepoState,
  table: SlotTable,
  slots: readonly SlotDefinition[],
): string {
  return template.replace(/\{([a-z0-9.-]+)\}/gi, (_match, slotId: string) => {
    const known = table[slotId];
    if (known !== undefined) return known.commitHash;
    const definition = slots.find((slot) => slot.slotId === slotId);
    if (definition === undefined) throw new Error(`Slot inconnu : ${slotId}`);
    const groups = associateSlots(state, entry, [definition]);
    const hash = groups[0]?.commitHash;
    if (hash === undefined) throw new Error(`Slot non résolu : ${slotId}`);
    return hash;
  });
}

/** Rejoue une solution de référence, placeholders résolus à chaque étape. */
export function runReference(
  entry: RepoState,
  reference: readonly string[],
  table: SlotTable,
  slots: readonly SlotDefinition[],
): RepoState {
  let current = entry;
  for (const template of reference) {
    const command = resolveTemplate(template, current, entry, table, slots);
    current = run(current, command);
  }
  return current;
}

/**
 * Construit toute la chaîne depuis la racine.
 * Les `reference` doivent être fournies par les specs de contenu.
 */
export function buildChain(
  root: RepoState,
  missions: readonly ChainMission[],
): ChainEntry[] {
  const chain: ChainEntry[] = [];
  let checkpoint = root;

  for (const mission of missions) {
    const entry = applyPrelude(checkpoint, mission.prelude);
    const previousTable = chain.length === 0 ? {} : chain[chain.length - 1]?.table ?? {};
    const after = runReference(entry, mission.reference, previousTable, mission.slots);
    const groups = associateSlots(after, entry, mission.slots);
    const table: SlotTable = {
      ...previousTable,
      ...buildSlotTable(mission.slots, groups),
    };
    chain.push({ missionId: mission.missionId, entry, after, table });
    checkpoint = after;
  }

  return chain;
}

/** Entrée effective d'une mission dans la chaîne calculée. */
export function entryOf(chain: readonly ChainEntry[], missionId: string): RepoState {
  const found = chain.find((entry) => entry.missionId === missionId);
  if (found === undefined) throw new Error(`Mission absente de la chaîne : ${missionId}`);
  return found.entry;
}
