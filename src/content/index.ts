import { chapter01 } from './chapters/01-under-the-hood';
import { chapter02 } from './chapters/02-branches';
import { chapter03 } from './chapters/03-merging';
import { chapter04 } from './chapters/04-worktrees';
import type { Chapter, Mission } from './types';

export const chapters: readonly Chapter[] = [chapter01, chapter02, chapter03, chapter04];

export const allMissions: readonly Mission[] = chapters.flatMap((chapter) => chapter.missions);

export const missionSequence: readonly Mission[] = allMissions;

export function findChapter(id: string): Chapter | undefined {
  return chapters.find((chapter) => chapter.id === id);
}

export function findMission(id: string): Mission | undefined {
  return allMissions.find((mission) => mission.id === id);
}

export function missionIndex(id: string): number {
  return missionSequence.findIndex((mission) => mission.id === id);
}

export function nextMission(id: string): Mission | undefined {
  const index = missionIndex(id);
  if (index < 0) return undefined;
  return missionSequence[index + 1];
}

/** Une mission est déverrouillée si c'est la première ou si la précédente est terminée. */
export function isMissionUnlocked(
  id: string,
  completed: Readonly<Record<string, unknown>>,
): boolean {
  const index = missionIndex(id);
  if (index < 0) return false;
  if (index === 0) return true;
  const previous = missionSequence[index - 1];
  return previous !== undefined && completed[previous.id] !== undefined;
}

export function firstMissionOfChapter(chapterId: string): Mission | undefined {
  return allMissions.find((mission) => mission.chapterId === chapterId);
}

export function chapterMissions(chapterId: string): readonly Mission[] {
  return allMissions.filter((mission) => mission.chapterId === chapterId);
}

export type AfterMission =
  | { readonly kind: 'mission'; readonly mission: Mission }
  | { readonly kind: 'lesson'; readonly chapter: Chapter }
  | { readonly kind: 'home' };

/**
 * Destination du bouton « Continuer » après une mission :
 * mission suivante du même chapitre, cours du chapitre suivant à une frontière,
 * ou carte des chapitres après la dernière mission.
 */
export function afterMission(id: string): AfterMission {
  const index = missionIndex(id);
  if (index < 0) return { kind: 'home' };
  const current = missionSequence[index];
  const next = missionSequence[index + 1];
  if (!current || !next) return { kind: 'home' };
  if (next.chapterId === current.chapterId) return { kind: 'mission', mission: next };
  const chapter = findChapter(next.chapterId);
  return chapter ? { kind: 'lesson', chapter } : { kind: 'home' };
}
