import type { RepoState } from '../engine/types';
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
  readonly minutes: number;
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

export interface Prediction {
  /** Commande exacte (normalisée) qui déclenche la prédiction. */
  readonly whenCommand: string;
  readonly question: string;
  readonly options: readonly PredictionOption[];
  readonly correctOptionId: string;
  readonly explanation: string;
}

export interface ForbiddenCommand {
  readonly prefix: string;
  readonly message: string;
}

export interface Mission {
  readonly id: string;
  readonly chapterId: string;
  readonly order: number;
  /** Numéro affiché, ex. « 4.1 ». */
  readonly number: string;
  readonly title: string;
  readonly story: string;
  readonly objective: string;
  readonly difficulty: 1 | 2 | 3;
  readonly par: number;
  readonly initialState: RepoState;
  readonly validate: (state: RepoState) => ValidationResult;
  readonly hints: readonly [string, string, string];
  readonly solution: readonly string[];
  readonly predictions?: readonly Prediction[];
  readonly forbidden?: readonly ForbiddenCommand[];
  readonly successNote?: string;
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
