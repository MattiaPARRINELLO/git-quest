import { describe, expect, it } from 'vitest';
import { allMissions, chapters, commandLineLesson } from './index';
import {
  afterMissionIn,
  contentFor,
  findChapterIn,
  findMissionIn,
  missionSequenceIn,
} from './localized';
import type { ContentPack } from './localized';
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
  const texts = [
    mission.title,
    mission.story,
    mission.situation,
    mission.objective,
    mission.takeaway,
    ...mission.steps.map((step) => step.label),
    ...mission.hints,
  ].join(' ');
  expect(texts, `${mission.id} : texte encore marqué TODO`).not.toMatch(/\bTODO\b/);

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

/** Textes visibles d'un pack, hors commandes et contenus de fichiers. */
function visibleTexts(pack: ContentPack): string[] {
  const texts: string[] = [pack.prologue.title];
  for (const slide of pack.prologue.slides) {
    texts.push(slide.title);
    if (slide.kind === 'text') texts.push(...slide.paragraphs);
    if (slide.kind === 'demo') texts.push(...slide.steps.map((step) => step.explanation));
    if (slide.kind === 'recap') texts.push(...slide.commands.map((entry) => entry.description));
  }
  for (const chapter of pack.chapters) {
    texts.push(chapter.title, chapter.tagline, chapter.description, chapter.lesson.title);
    for (const slide of chapter.lesson.slides) {
      texts.push(slide.title);
      if (slide.kind === 'text') texts.push(...slide.paragraphs);
      if (slide.kind === 'demo') texts.push(...slide.steps.map((step) => step.explanation));
      if (slide.kind === 'recap') texts.push(...slide.commands.map((entry) => entry.description));
    }
    for (const mission of chapter.missions) {
      texts.push(
        mission.title,
        mission.story,
        mission.situation,
        mission.objective,
        mission.takeaway,
        ...mission.steps.map((step) => step.label),
        ...mission.hints,
      );
      for (const prediction of mission.predictions ?? []) {
        texts.push(prediction.question, prediction.explanation);
        texts.push(...prediction.options.map((option) => option.label));
      }
      if (mission.display?.objective !== undefined) texts.push(mission.display.objective);
      if (mission.successNote !== undefined) texts.push(mission.successNote);
    }
  }
  for (const briefing of Object.values(pack.briefings)) {
    texts.push(briefing.title, ...briefing.lines.map((line) => line.text));
    if (briefing.outcome !== undefined) texts.push(briefing.outcome);
    if (briefing.teaser !== undefined) texts.push(briefing.teaser);
  }
  return texts;
}

/** Mots français sans ambiguïté avec l'anglais courant. */
const FRENCH_WORDS =
  /\b(le|la|les|une|des|du|est|sont|dans|pour|avec|sur|pas|qui|que|tu|ton|ta|tes|nous|vous|votre|notre|ce|cette|ces|au|aux|il|elle|se|sa|son|ses|être|mais|où|d’un|d’une|l’index|l’étiquette)\b/i;

describe('contenu multilingue', () => {
  it('les deux packs partagent les mêmes identifiants et la même structure', () => {
    const french = contentFor('fr');
    const english = contentFor('en');

    expect(english.chapters.map((chapter) => chapter.id)).toEqual(
      french.chapters.map((chapter) => chapter.id),
    );
    expect(globalThis.Object.keys(english.briefings).sort()).toEqual(
      globalThis.Object.keys(french.briefings).sort(),
    );

    const frenchMissions = missionSequenceIn(french);
    const englishMissions = missionSequenceIn(english);
    expect(englishMissions.map((mission) => mission.id)).toEqual(
      frenchMissions.map((mission) => mission.id),
    );
    expect(englishMissions).toHaveLength(frenchMissions.length);

    for (const [index, frenchMission] of frenchMissions.entries()) {
      const englishMission = englishMissions[index];
      expect(englishMission).toBeDefined();
      if (englishMission === undefined) continue;
      expect(englishMission.chapterId).toBe(frenchMission.chapterId);
      expect(englishMission.order).toBe(frenchMission.order);
      expect(englishMission.number).toBe(frenchMission.number);
      expect(englishMission.par).toBe(frenchMission.par);
      expect(englishMission.solution).toEqual(frenchMission.solution);
      expect(englishMission.suggestedCommands).toEqual(frenchMission.suggestedCommands);
      expect(englishMission.steps).toHaveLength(frenchMission.steps.length);
      expect(englishMission.hints).toHaveLength(3);
    }

    for (const frenchChapter of french.chapters) {
      const englishChapter = findChapterIn(english, frenchChapter.id);
      expect(englishChapter).toBeDefined();
      expect(englishChapter?.lesson.slides).toHaveLength(frenchChapter.lesson.slides.length);
      expect(englishChapter?.missions.map((mission) => mission.id)).toEqual(
        frenchChapter.missions.map((mission) => mission.id),
      );
    }
  });

  it('le pack anglais passe les mêmes invariants de schéma', () => {
    const english = contentFor('en');
    for (const mission of missionSequenceIn(english)) checkMission(mission);
    for (const chapter of english.chapters) {
      expect(chapter.title.trim()).not.toBe('');
      expect(chapter.tagline.trim()).not.toBe('');
      expect(chapter.description.trim()).not.toBe('');
      expect(chapter.lesson.slides.length).toBeGreaterThan(0);
    }
  });

  it('le chapitre 1 est réellement traduit dans le pack anglais', () => {
    const french = contentFor('fr');
    const english = contentFor('en');
    expect(findChapterIn(french, 'under-the-hood')?.title).toBe('Sous le capot');
    expect(findChapterIn(english, 'under-the-hood')?.title).toBe('Under the hood');
    expect(findChapterIn(english, 'under-the-hood')?.lesson.title).toBe('Under the hood');
    expect(findChapterIn(english, 'under-the-hood')?.lesson.slides[0]?.title).toBe(
      'A commit is a snapshot',
    );
    expect(findMissionIn(english, 'trois-zones')?.title).toBe('The 3 areas');
    expect(findMissionIn(english, 'trois-zones')?.objective).toContain(
      'Commit only a.txt',
    );
  });

  it('aucune chaîne française ne fuit dans les textes anglais', () => {
    const leaks = visibleTexts(contentFor('en')).filter((text) => FRENCH_WORDS.test(text));
    expect(leaks, `fuites françaises : ${leaks.join(' | ')}`).toEqual([]);
  });

  it('les raisons de validation anglaises ne restent pas en français', () => {
    const english = contentFor('en');
    for (const mission of missionSequenceIn(english)) {
      const result = mission.validate(mission.initialState, {
        entry: mission.initialState,
      });
      if (result.reason !== undefined) {
        expect(result.reason, `${mission.id} : validation`).not.toMatch(FRENCH_WORDS);
      }
      const attempt = mission.validateAttempt?.([]);
      if (attempt?.reason !== undefined) {
        expect(attempt.reason, `${mission.id} : validateAttempt`).not.toMatch(FRENCH_WORDS);
      }
    }
  });

  it('le parcours reste cohérent dans les deux langues', () => {
    for (const locale of ['fr', 'en'] as const) {
      const pack = contentFor(locale);
      const sequence = missionSequenceIn(pack);
      expect(afterMissionIn(pack, sequence[0]?.id ?? '').kind).toBe('mission');
      expect(afterMissionIn(pack, sequence[sequence.length - 1]?.id ?? '').kind).toBe('home');
    }
  });
});
