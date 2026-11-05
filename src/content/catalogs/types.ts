/**
 * Formes des textes de contenu traduits.
 *
 * Le contenu français reste la source de vérité de la structure : identifiants,
 * états initiaux, validateurs et commandes vivent dans les fichiers de
 * chapitre. Un catalogue ne porte que les textes, alignés par position sur
 * cette structure.
 */

export interface SlideText {
  readonly title: string;
  /** Slides `text`. */
  readonly paragraphs?: readonly string[];
  readonly note?: string;
  readonly caption?: string;
  /** Slides `demo` : une explication par étape, dans l'ordre. */
  readonly steps?: readonly string[];
  /** Slides `recap` : une description par commande, dans l'ordre. */
  readonly commands?: readonly string[];
}

export interface LessonText {
  readonly title: string;
  readonly slides: readonly SlideText[];
}

export interface PredictionOptionText {
  readonly id: string;
  readonly label: string;
}

export interface PredictionText {
  readonly question: string;
  readonly options: readonly PredictionOptionText[];
  readonly explanation: string;
}

export interface MissionDisplayText {
  readonly objective?: string;
  readonly hints?: readonly [string, string, string];
}

export interface MissionText {
  readonly title: string;
  readonly story: string;
  readonly situation: string;
  readonly objective: string;
  readonly takeaway: string;
  /** Libellés des étapes, dans l'ordre. */
  readonly stepLabels: readonly string[];
  readonly hints: readonly [string, string, string];
  readonly predictions?: readonly PredictionText[];
  readonly display?: MissionDisplayText;
  /** Messages des commandes interdites, dans l'ordre. */
  readonly forbidden?: readonly string[];
  readonly successNote?: string;
}

export interface ChapterText {
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly lesson: LessonText;
  readonly missions: Readonly<Record<string, MissionText>>;
}

export interface BriefingText {
  readonly title: string;
  /** Une ligne par réplique, dans l'ordre du briefing français. */
  readonly lines: readonly string[];
  readonly outcome?: string;
  readonly teaser?: string;
}
