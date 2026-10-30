import { afterMission, chapters, findChapter, findMission, missionSequence } from '../content';
import type { Chapter } from '../content/types';
import { routePaths } from '../router/useHashRoute';

/** Sous-ensemble de la progression nécessaire pour choisir la reprise. */
export interface ResumeProgress {
  readonly completed: Readonly<Record<string, { readonly stars: number } | undefined>>;
  readonly lessonSlides: Readonly<Record<string, number | undefined>>;
}

export interface ResumeTarget {
  readonly label: string;
  readonly route: string;
}

interface ResumePlan extends ResumeTarget {
  readonly context: string;
}

/**
 * Point d'entrée unique de l'accueil : destination calculée à partir de la
 * progression. La priorité suit le parcours réel du joueur :
 * brouillon de mission, cours en cours, prochaine action linéaire, puis
 * démarrage ou écran final.
 */
export function resumeTarget(
  progress: ResumeProgress,
  activeMission: string | null = null,
): ResumeTarget {
  const plan = resolveResume(progress, activeMission);
  return { label: plan.label, route: plan.route };
}

/** Ligne de contexte discrète affichée sous le bouton de reprise. */
export function resumeContext(
  progress: ResumeProgress,
  activeMission: string | null = null,
): string {
  return resolveResume(progress, activeMission).context;
}

function resolveResume(progress: ResumeProgress, activeMission: string | null): ResumePlan {
  const { completed, lessonSlides } = progress;

  // 1. Brouillon de mission : on reprend là où le joueur s'est arrêté.
  if (activeMission !== null) {
    const mission = findMission(activeMission);
    if (mission !== undefined && completed[mission.id] === undefined) {
      return {
        label: `Reprendre la mission ${mission.number}`,
        route: routePaths.mission(mission.id),
        context: chapterContext(findChapter(mission.chapterId), completed),
      };
    }
  }

  const nextIndex = missionSequence.findIndex((mission) => completed[mission.id] === undefined);

  // 5. Tout est terminé.
  if (nextIndex < 0) {
    return {
      label: 'Revoir ton arbre Nova',
      route: routePaths.final,
      context: `Terminé · ${missionSequence.length}/${missionSequence.length} missions`,
    };
  }

  const next = missionSequence[nextIndex];
  if (next === undefined) {
    return { label: 'Revoir ton arbre Nova', route: routePaths.final, context: '' };
  }

  // 4. Aucune progression : on ouvre le cours du premier chapitre.
  if (nextIndex === 0 && Object.keys(lessonSlides).length === 0) {
    const first = chapters[0];
    return {
      label: 'Commencer avec le chapitre 1',
      route: first === undefined ? routePaths.home : routePaths.lesson(first.id),
      context: chapterContext(first, completed),
    };
  }

  const chapter = findChapter(next.chapterId);

  // 2. Cours commencé mais inachevé dans le chapitre courant.
  if (chapter !== undefined) {
    const saved = lessonSlides[chapter.id];
    const lastSlide = chapter.lesson.slides.length - 1;
    if (saved !== undefined && saved < lastSlide) {
      return {
        label: `Reprendre le cours : ${chapter.title}`,
        route: routePaths.lesson(chapter.id),
        context: chapterContext(chapter, completed),
      };
    }
  }

  // 3. Prochaine action linéaire, frontières de chapitre résolues par afterMission.
  const previous = nextIndex > 0 ? missionSequence[nextIndex - 1] : undefined;
  if (previous !== undefined) {
    const after = afterMission(previous.id);
    if (after.kind === 'lesson') {
      return {
        label: `Commencer le cours : ${after.chapter.title}`,
        route: routePaths.lesson(after.chapter.id),
        context: chapterContext(after.chapter, completed),
      };
    }
  }

  return {
    label: `Continuer : mission ${next.number}`,
    route: routePaths.mission(next.id),
    context: chapterContext(chapter, completed),
  };
}

function chapterContext(chapter: Chapter | undefined, completed: ResumeProgress['completed']): string {
  if (chapter === undefined) return '';
  const done = chapter.missions.filter((mission) => completed[mission.id] !== undefined).length;
  return `Chapitre ${chapter.number} · ${chapter.title} · ${done}/${chapter.missions.length} missions`;
}
