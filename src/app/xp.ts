import { chapters, commandLineLesson, missionSequence } from '../content';

export interface ProgressSnapshot {
  readonly completed: Readonly<Record<string, { readonly stars: 1 | 2 | 3 }>>;
  readonly lessonSlides: Readonly<Record<string, number>>;
}

/** 100 XP par mission, plus un bonus de 25 XP par étoile au-delà de la première. */
export const XP_PER_MISSION = 100;
export const XP_PER_STAR = 25;

export function missionXp(stars: 1 | 2 | 3): number {
  return XP_PER_MISSION + (stars - 1) * XP_PER_STAR;
}

/** XP total, dérivé de la progression : jamais de compteur à désynchroniser. */
export function totalXp(progress: ProgressSnapshot): number {
  let total = 0;
  for (const completion of Object.values(progress.completed)) {
    total += missionXp(completion.stars);
  }
  return total;
}

export interface LevelDefinition {
  readonly level: number;
  readonly title: string;
  /** XP cumulé nécessaire pour atteindre ce niveau. */
  readonly at: number;
}

/**
 * Sept paliers. Un parcours parfait (19 missions à 3 étoiles = 2 850 XP)
 * atteint le dernier niveau, une exploration minimale termine au quatrième.
 */
export const LEVELS: readonly LevelDefinition[] = [
  { level: 1, title: 'Novice', at: 0 },
  { level: 2, title: 'Apprenti', at: 150 },
  { level: 3, title: 'Committeur', at: 400 },
  { level: 4, title: 'Brancheur', at: 750 },
  { level: 5, title: 'Fusionneur', at: 1_200 },
  { level: 6, title: 'Architecte', at: 1_750 },
  { level: 7, title: 'Maître du dépôt', at: 2_250 },
];

export interface LevelInfo extends LevelDefinition {
  /** XP total courant. */
  readonly xp: number;
  /** XP accumulé dans le niveau courant. */
  readonly intoLevel: number;
  /** XP nécessaire pour passer au niveau suivant (0 au dernier niveau). */
  readonly nextAt: number;
  readonly span: number;
  /** Progression dans le niveau courant, 0-100. */
  readonly percent: number;
}

export function levelFor(xp: number): LevelInfo {
  let index = 0;
  for (let candidate = 0; candidate < LEVELS.length; candidate += 1) {
    const level = LEVELS[candidate];
    if (level !== undefined && xp >= level.at) index = candidate;
  }

  const current = LEVELS[index] ?? { level: 1, title: 'Novice', at: 0 };
  const next = LEVELS[index + 1];
  const intoLevel = xp - current.at;
  const span = next === undefined ? 0 : next.at - current.at;
  const percent = span === 0 ? 100 : Math.min(100, Math.round((intoLevel / span) * 100));

  return {
    ...current,
    xp,
    intoLevel,
    nextAt: next?.at ?? 0,
    span,
    percent,
  };
}

export interface BadgeDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly earned: (progress: ProgressSnapshot) => boolean;
  /** Compteur affiché quand le badge se gagne par accumulation. */
  readonly progress?: (progress: ProgressSnapshot) => { done: number; total: number };
}

function completedCount(progress: ProgressSnapshot): number {
  return Object.keys(progress.completed).length;
}

function perfectCount(progress: ProgressSnapshot): number {
  return Object.values(progress.completed).filter((completion) => completion.stars === 3).length;
}

function chapterComplete(progress: ProgressSnapshot, chapterId: string): boolean {
  const chapter = chapters.find((candidate) => candidate.id === chapterId);
  if (chapter === undefined) return false;
  return chapter.missions.every((mission) => progress.completed[mission.id] !== undefined);
}

function lessonRead(progress: ProgressSnapshot, chapterId: string): boolean {
  const chapter = chapters.find((candidate) => candidate.id === chapterId);
  if (chapter === undefined) return false;
  const lastSlide = chapter.lesson.slides.length - 1;
  return (progress.lessonSlides[chapterId] ?? 0) >= lastSlide;
}

function allLessonsRead(progress: ProgressSnapshot): boolean {
  const prologue =
    (progress.lessonSlides[commandLineLesson.id] ?? 0) >= commandLineLesson.slides.length - 1;
  return prologue && chapters.every((chapter) => lessonRead(progress, chapter.id));
}

const CHAPTER_BADGES: readonly BadgeDefinition[] = chapters.map((chapter) => ({
  id: `chapitre-${chapter.id}`,
  title: chapter.title,
  description: `Terminer les ${chapter.missions.length} missions du chapitre ${chapter.number}.`,
  earned: (progress) => chapterComplete(progress, chapter.id),
}));

export const BADGES: readonly BadgeDefinition[] = [
  {
    id: 'premier-pas',
    title: 'Premier pas',
    description: 'Terminer une mission.',
    earned: (progress) => completedCount(progress) >= 1,
    progress: (progress) => ({ done: Math.min(1, completedCount(progress)), total: 1 }),
  },
  {
    id: 'sans-faute',
    title: 'Sans faute',
    description: 'Réussir cinq missions avec trois étoiles.',
    earned: (progress) => perfectCount(progress) >= 5,
    progress: (progress) => ({ done: Math.min(5, perfectCount(progress)), total: 5 }),
  },
  ...CHAPTER_BADGES,
  {
    id: 'erudit',
    title: 'Érudit',
    description: 'Lire tous les cours, prologue compris.',
    earned: allLessonsRead,
    progress: (progress) => {
      const total = chapters.length + 1;
      const done =
        chapters.filter((chapter) => lessonRead(progress, chapter.id)).length +
        ((progress.lessonSlides[commandLineLesson.id] ?? 0) >=
        commandLineLesson.slides.length - 1
          ? 1
          : 0);
      return { done, total };
    },
  },
  {
    id: 'parcours-complet',
    title: 'Parcours complet',
    description: `Terminer les ${missionSequence.length} missions.`,
    earned: (progress) => completedCount(progress) >= missionSequence.length,
    progress: (progress) => ({
      done: completedCount(progress),
      total: missionSequence.length,
    }),
  },
  {
    id: 'maitre',
    title: 'Maître du dépôt',
    description: 'Terminer toutes les missions avec trois étoiles.',
    earned: (progress) => perfectCount(progress) >= missionSequence.length,
    progress: (progress) => ({
      done: perfectCount(progress),
      total: missionSequence.length,
    }),
  },
];

export interface BadgeState extends BadgeDefinition {
  readonly unlocked: boolean;
  readonly counter: { readonly done: number; readonly total: number } | null;
}

export function badgesFor(progress: ProgressSnapshot): BadgeState[] {
  return BADGES.map((badge) => ({
    ...badge,
    unlocked: badge.earned(progress),
    counter: badge.progress?.(progress) ?? null,
  }));
}

export interface ProgressSummary {
  readonly xp: number;
  readonly level: LevelInfo;
  readonly badges: readonly BadgeState[];
  readonly unlockedBadges: number;
}

export function progressSummary(progress: ProgressSnapshot): ProgressSummary {
  const xp = totalXp(progress);
  const badges = badgesFor(progress);
  return {
    xp,
    level: levelFor(xp),
    badges,
    unlockedBadges: badges.filter((badge) => badge.unlocked).length,
  };
}
