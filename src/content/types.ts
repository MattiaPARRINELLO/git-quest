import type { ParsedCommand, RepoState } from '../engine/types';
import type { ValidationResult } from '../engine/validate';

export type DiagramId =
  | 'commit-snapshot'
  | 'branch-pointer'
  | 'head-states'
  | 'merge-modes'
  | 'worktrees';

export interface TextSlide {
  readonly kind: 'text';
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly command?: string;
  readonly note?: string;
}

export interface DiagramSlide {
  readonly kind: 'diagram';
  readonly title: string;
  readonly diagram: DiagramId;
  readonly caption?: string;
}

export interface DemoStep {
  readonly command: string;
  readonly explanation: string;
}

export interface DemoSlide {
  readonly kind: 'demo';
  readonly title: string;
  readonly initialState: RepoState;
  readonly steps: readonly DemoStep[];
  readonly caption?: string;
}

export interface RecapSlide {
  readonly kind: 'recap';
  readonly title: string;
  readonly commands: readonly { readonly command: string; readonly description: string }[];
}

export type LessonSlide = TextSlide | DiagramSlide | DemoSlide | RecapSlide;

export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly slides: readonly LessonSlide[];
}

export interface PredictionTarget {
  readonly kind: 'commit' | 'branch';
  readonly value: string;
}

export interface PredictionOption {
  readonly id: string;
  readonly label: string;
  /** Cible cliquable sur le graphe (commit ou étiquette de branche). */
  readonly target?: PredictionTarget;
}

/** Remplacement dynamique des libellés d'une prédiction (hashes réels). */
export interface PredictionResolution {
  readonly question?: string;
  readonly options?: readonly PredictionOption[];
  readonly correctOptionId?: string;
  readonly explanation?: string;
}

export interface Prediction {
  /** Déclencheur structurel, évalué sur la commande parsée et l'état avant exécution. */
  readonly trigger: (parsed: ParsedCommand, state: RepoState) => boolean;
  readonly question: string;
  readonly options: readonly PredictionOption[];
  readonly correctOptionId: string;
  readonly explanation: string;
  /** Libellés recalculés depuis l'état (aucun hash figé à l'écran). */
  readonly resolve?: (state: RepoState) => PredictionResolution;
}

export interface ForbiddenCommand {
  readonly prefix: string;
  readonly message: string;
}

/**
 * Contexte de validation : l'état d'entrée effectif de la mission (prelude
 * inclus). Les validations relatives s'y comparent au lieu d'utiliser des
 * valeurs absolues.
 */
export interface ValidationContext {
  readonly entry: RepoState;
  readonly commands?: readonly string[];
}

export interface MissionStep {
  readonly label: string;
  readonly done: (state: RepoState, ctx?: ValidationContext) => boolean;
}

/** Textes affichés avec des placeholders `{slotId}` résolus à l'écran. */
export interface MissionDisplay {
  readonly objective?: string;
  readonly hints?: readonly [string, string, string];
  readonly solution?: readonly string[];
}

export interface Mission {
  readonly id: string;
  readonly chapterId: string;
  readonly order: number;
  /** Numéro affiché, ex. « 4.1 ». */
  readonly number: string;
  readonly title: string;
  readonly story: string;
  readonly situation: string;
  readonly objective: string;
  readonly steps: readonly MissionStep[];
  readonly takeaway: string;
  readonly difficulty: 1 | 2 | 3;
  readonly par: number;
  readonly initialState: RepoState;
  readonly validate: (state: RepoState, ctx?: ValidationContext) => ValidationResult;
  /** Garde-fou de parcours (ex. avoir tenté -d avant de forcer). */
  readonly validateAttempt?: (commands: readonly string[]) => ValidationResult;
  readonly hints: readonly [string, string, string];
  readonly solution: readonly string[];
  readonly predictions?: readonly Prediction[];
  readonly suggestedCommands?: readonly string[];
  readonly forbidden?: readonly ForbiddenCommand[];
  readonly successNote?: string;
  /** Textes à afficher, avec hashes résolus depuis l'état du joueur. */
  readonly display?: MissionDisplay;
}

export interface Chapter {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly lesson: Lesson;
  readonly missions: readonly Mission[];
}
