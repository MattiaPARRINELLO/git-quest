import { describe, expect, it } from 'vitest';
import { allMissions, chapters, commandLineLesson } from './index';
import type { Mission } from './types';

/**
 * Invariants du contenu pédagogique.
 *
 * Ces règles sont volontairement mécaniques : elles attrapent les erreurs de
 * saisie les plus fréquentes sans juger la qualité pédagogique. Voir
 * `docs/CONTENT.md` pour le sens de chaque champ.
 */

function sentences(text: string): number {
  return text
    .split(/[.!?](?=\s|$)/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}

function checkMission(mission: Mission): void {
  expect(mission.title.trim(), `${mission.id} : titre vide`).not.toBe('');
  expect(mission.situation.trim(), `${mission.id} : situation vide`).not.toBe('');
  expect(mission.objective.trim(), `${mission.id} : objectif vide`).not.toBe('');
  expect(mission.takeaway.trim(), `${mission.id} : takeaway vide`).not.toBe('');

  expect(sentences(mission.story), `${mission.id} : histoire de plus de 3 phrases`).toBeLessThanOrEqual(3);
  expect(mission.steps.length, `${mission.id} : 2 à 4 étapes`).toBeGreaterThanOrEqual(2);
  expect(mission.steps.length, `${mission.id} : 2 à 4 étapes`).toBeLessThanOrEqual(4);
  for (const step of mission.steps) {
    expect(step.label.trim(), `${mission.id} : étape sans libellé`).not.toBe('');
    expect(step.done(mission.initialState, { entry: mission.initialState })).toBeTypeOf('boolean');
  }

  expect(mission.hints, `${mission.id} : trois indices`).toHaveLength(3);
  expect(mission.solution.length, `${mission.id} : par doit égaler la solution`).toBeGreaterThan(0);
  expect(mission.par, `${mission.id} : par doit égaler la solution`).toBe(mission.solution.length);

  if (mission.suggestedCommands !== undefined) {
    expect(
      mission.suggestedCommands.length,
      `${mission.id} : 3 à 5 commandes suggérées`,
    ).toBeGreaterThanOrEqual(3);
    expect(
      mission.suggestedCommands.length,
      `${mission.id} : 3 à 5 commandes suggérées`,
    ).toBeLessThanOrEqual(5);
  }

  for (const prediction of mission.predictions ?? []) {
    expect(prediction.options.length, `${mission.id} : prédiction sans option`).toBeGreaterThan(1);
    expect(
      prediction.options.some((option) => option.id === prediction.correctOptionId),
      `${mission.id} : correctOptionId doit pointer une option`,
    ).toBe(true);
    expect(
      prediction.trigger(
        {
          ok: true,
          command: { name: 'status', args: [], flags: [] },
        } as never,
        mission.initialState,
      ),
    ).toBeTypeOf('boolean');
  }

  for (const forbidden of mission.forbidden ?? []) {
    expect(forbidden.prefix.trim(), `${mission.id} : préfixe interdit vide`).not.toBe('');
    expect(forbidden.message.trim(), `${mission.id} : message interdit vide`).not.toBe('');
  }
}

describe('invariants du contenu', () => {
  it('les identifiants de chapitre et de mission sont uniques', () => {
    const chapterIds = chapters.map((chapter) => chapter.id);
    expect(new Set(chapterIds).size).toBe(chapterIds.length);
    const missionIds = allMissions.map((mission) => mission.id);
    expect(new Set(missionIds).size).toBe(missionIds.length);
  });

  it('chaque chapitre a un cours et au moins une mission', () => {
    expect(commandLineLesson.slides.length).toBeGreaterThan(0);
    for (const chapter of chapters) {
      expect(chapter.lesson.slides.length, `${chapter.id} : cours vide`).toBeGreaterThan(0);
      expect(chapter.missions.length, `${chapter.id} : aucune mission`).toBeGreaterThan(0);
      expect(chapter.title.trim()).not.toBe('');
      expect(chapter.tagline.trim()).not.toBe('');
      expect(chapter.description.trim()).not.toBe('');
    }
  });

  it('les missions suivent l’ordre et le numéro de leur chapitre', () => {
    for (const chapter of chapters) {
      expect(chapter.missions.map((mission) => mission.order)).toEqual(
        chapter.missions.map((_, index) => index + 1),
      );
      for (const mission of chapter.missions) {
        expect(mission.chapterId, `${mission.id} : mauvais chapitre`).toBe(chapter.id);
        expect(mission.number, `${mission.id} : numéro incohérent`).toBe(
          `${chapter.number}.${mission.order}`,
        );
      }
    }
  });

  it('valide le schéma de chaque mission', () => {
    for (const mission of allMissions) checkMission(mission);
  });
});
