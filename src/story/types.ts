import type {
  Author,
  BranchName,
  Commit,
  CommitHash,
  RepoState,
} from '../engine/types';
import type { ValidationResult } from '../engine/validate';

/**
 * Types du story-repo « Nova ».
 *
 * `src/story/` est pur : aucun import React, DOM ou stockage, et le moteur ne
 * dépend jamais de ce module. Les types d'état viennent du moteur.
 */

export type SlotId = string;
export type TeammateId = string;

/** Signature d'un commit attendu par un slot, exprimée en contenu. */
export interface SlotSignature {
  /** `null` = HEAD détaché ; `undefined` = n'importe quelle branche. */
  readonly branch?: BranchName | null;
  /** Fichiers dont le contenu doit correspondre exactement. */
  readonly files?: Readonly<Record<string, string>>;
  /** Fichiers qui doivent être absents du snapshot. */
  readonly absent?: readonly string[];
}

export interface SlotDefinition {
  readonly slotId: SlotId;
  readonly missionId: string;
  readonly signature: SlotSignature;
}

export interface SlotRecord {
  readonly slotId: SlotId;
  readonly missionId: string;
  readonly message: string;
  readonly commitHash: CommitHash;
}

export type SlotTable = Readonly<Record<SlotId, SlotRecord>>;

/** Slots remplis par un même commit joueur : jamais dédoublés. */
export interface SlotGroup {
  readonly slots: readonly SlotId[];
  readonly commitHash: CommitHash;
  readonly message: string;
}

export type PreconditionResult = ValidationResult;
export type Precondition = (state: RepoState) => PreconditionResult;

export interface StoryCheckpoint {
  readonly missionId: string;
  readonly state: RepoState;
}

/** Un changement de fichier par rapport au premier parent d'un commit. */
export interface FileDelta {
  readonly path: string;
  /** `null` = suppression. */
  readonly content: string | null;
}

export type ChangeSet = readonly FileDelta[];

export interface CommitCandidate {
  readonly commit: Commit;
  readonly changes: ChangeSet;
}

export interface Teammate {
  readonly id: TeammateId;
  readonly name: string;
  readonly role: string;
  readonly author: Author;
}

/** Brouillon d'une mission en cours (persisté pour survivre au rechargement). */
export interface MissionDraft {
  readonly missionId: string;
  /** État d'entrée effectif : cible de `reset-mission` et borne de l'undo. */
  readonly entry: RepoState;
  /** Dernier état connu du dépôt. */
  readonly state: RepoState;
  readonly commandsUsed: number;
  readonly hintsUsed: number;
  readonly attempts: readonly string[];
}

export type JournalEntry =
  | { readonly kind: 'mission-complete'; readonly missionId: string; readonly stars: 1 | 2 | 3 }
  | { readonly kind: 'recalage'; readonly missionId: string; readonly reason: string }
  | {
      readonly kind: 'detour';
      readonly missionId: string;
      readonly afterSlot: SlotId | null;
      readonly message: string;
    }
  | { readonly kind: 'hors-chaine'; readonly missionId: string; readonly details: string }
  | { readonly kind: 'prelude'; readonly stepId: string }
  | { readonly kind: 'migration'; readonly from: 1 };

export interface IsolatedRun {
  readonly missionId: string;
  readonly state: RepoState;
  readonly slots: SlotTable;
  readonly bestStars: 1 | 2 | 3;
  readonly draft: MissionDraft | null;
}

/**
 * Document story persisté.
 *
 * `nova` reste `null` en Phase A : le dépôt continu n'existe pas encore. Il sera
 * rempli par le checkpoint de la première mission non terminée en Phase B.
 */
export interface PersistedStory {
  readonly version: 1;
  readonly nova: RepoState | null;
  readonly missionId: string | null;
  readonly activeMission: MissionDraft | null;
  readonly slots: SlotTable;
  readonly slotGroups: readonly SlotGroup[];
  readonly journal: readonly JournalEntry[];
  readonly appliedPreludes: readonly string[];
  readonly isolated: IsolatedRun | null;
}
