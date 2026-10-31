import { describe, expect, it } from 'vitest';
import { chapters, commandLineLesson, missionSequence } from '../content';
import {
  BADGES,
  levelFor,
  missionXp,
  progressSummary,
  totalXp,
  badgesFor,
} from './xp';

const empty = { completed: {}, lessonSlides: {} } as const;

function allWith(stars: 1 | 2 | 3) {
  return {
    completed: Object.fromEntries(missionSequence.map((mission) => [mission.id, { stars }])),
    lessonSlides: {},
  };
}

function readAllLessons() {
  return {
    completed: {},
    lessonSlides: {
      [commandLineLesson.id]: commandLineLesson.slides.length - 1,
      ...Object.fromEntries(
        chapters.map((chapter) => [chapter.id, chapter.lesson.slides.length - 1]),
      ),
    },
  };
}

describe('XP et niveaux', () => {
  it('donne 100 XP par mission et 25 par étoile bonus', () => {
    expect(missionXp(1)).toBe(100);
    expect(missionXp(2)).toBe(125);
    expect(missionXp(3)).toBe(150);
  });

  it('somme les missions terminées', () => {
    const progress = {
      completed: { a: { stars: 3 }, b: { stars: 1 } },
      lessonSlides: {},
    } as const;
    expect(totalXp(progress)).toBe(250);
  });

  it('passe les paliers aux bons seuils', () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(149).level).toBe(1);
    expect(levelFor(150).level).toBe(2);
    expect(levelFor(400).level).toBe(3);
    expect(levelFor(2250).level).toBe(7);
    expect(levelFor(2250).percent).toBe(100);
    expect(levelFor(300).percent).toBe(60);
  });

  it('un parcours parfait atteint le dernier niveau', () => {
    const summary = progressSummary(allWith(3));
    expect(summary.xp).toBe(missionSequence.length * 150);
    expect(summary.level.level).toBe(7);
  });

  it('un parcours minimal termine au niveau 4', () => {
    const summary = progressSummary(allWith(1));
    expect(summary.level.level).toBe(5);
  });
});

describe('badges', () => {
  it('aucun badge au départ', () => {
    expect(badgesFor(empty).every((badge) => !badge.unlocked)).toBe(true);
  });

  it('débloque Premier pas à la première mission', () => {
    const first = missionSequence[0];
    if (!first) throw new Error('mission attendue');
    const badges = badgesFor({ completed: { [first.id]: { stars: 1 } }, lessonSlides: {} });
    expect(badges.find((badge) => badge.id === 'premier-pas')?.unlocked).toBe(true);
  });

  it('débloque le badge d’un chapitre quand toutes ses missions sont faites', () => {
    const chapter = chapters[0];
    if (!chapter) throw new Error('chapitre attendu');
    const completed = Object.fromEntries(
      chapter.missions.map((mission) => [mission.id, { stars: 2 as const }]),
    );
    const badges = badgesFor({ completed, lessonSlides: {} });
    expect(badges.find((badge) => badge.id === `chapitre-${chapter.id}`)?.unlocked).toBe(true);
  });

  it('Érudit demande tous les cours, prologue compris', () => {
    expect(badgesFor(readAllLessons()).find((badge) => badge.id === 'erudit')?.unlocked).toBe(
      true,
    );
    expect(
      badgesFor({ completed: {}, lessonSlides: { [chapters[0]?.id ?? '']: 1 } }).find(
        (badge) => badge.id === 'erudit',
      )?.unlocked,
    ).toBe(false);
  });

  it('Parcours complet et Maître du dépôt suivent les missions', () => {
    const complete = badgesFor(allWith(2));
    expect(complete.find((badge) => badge.id === 'parcours-complet')?.unlocked).toBe(true);
    expect(complete.find((badge) => badge.id === 'maitre')?.unlocked).toBe(false);

    const perfect = badgesFor(allWith(3));
    expect(perfect.find((badge) => badge.id === 'maitre')?.unlocked).toBe(true);
  });

  it('expose un compteur pour les badges progressifs', () => {
    const first = missionSequence[0];
    if (!first) throw new Error('mission attendue');
    const badge = badgesFor({
      completed: { [first.id]: { stars: 3 } },
      lessonSlides: {},
    }).find((candidate) => candidate.id === 'sans-faute');
    expect(badge?.counter).toEqual({ done: 1, total: 5 });
  });

  it('déclare des identifiants uniques', () => {
    const ids = BADGES.map((badge) => badge.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
