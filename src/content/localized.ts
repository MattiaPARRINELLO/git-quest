import { chapters as frenchChapters, commandLineLesson } from './index';
import { missionBriefings as frenchBriefings } from './briefings';
import {
  briefingsEnglish,
  chaptersText,
  messagesEnglish,
  prologueEnglish,
} from './catalogs/en';
import type { MissionBriefing } from './briefings';
import type { AfterMission } from './index';
import type {
  BriefingText,
  ChapterText,
  LessonText,
  MissionText,
  PredictionText,
  SlideText as LessonSlideText,
} from './catalogs/types';
import type {
  Chapter,
  Lesson,
  LessonSlide,
  Mission,
  Prediction,
} from './types';
import type { ValidationResult } from '../engine/validate';
import type { Locale } from '../i18n';

/**
 * Pack de contenu d'une langue.
 *
 * Le français reste la source de vérité de la structure (identifiants, états,
 * validateurs, commandes). L'anglais est un catalogue de textes aligné par
 * position, fusionné à l'exécution : rien n'est dupliqué côté logique.
 * Voir `docs/I18N.md`.
 */
export interface ContentPack {
  readonly chapters: readonly Chapter[];
  readonly prologue: Lesson;
  readonly briefings: Readonly<Record<string, MissionBriefing>>;
}

/** Traduit une raison de validation anglaise, sans jamais perdre l'originale. */
function englishResult(result: ValidationResult): ValidationResult {
  if (result.ok || result.reason === undefined) return result;
  return { ok: false, reason: messagesEnglish[result.reason] ?? result.reason };
}

function englishSlide(french: LessonSlide, text: LessonSlideText | undefined): LessonSlide {
  if (text === undefined) return french;
  switch (french.kind) {
    case 'text': {
      const paragraphs = text.paragraphs ?? french.paragraphs;
      const note = text.note ?? french.note;
      return {
        ...french,
        title: text.title,
        paragraphs,
        ...(note === undefined ? {} : { note }),
      };
    }
    case 'diagram': {
      const caption = text.caption ?? french.caption;
      return {
        ...french,
        title: text.title,
        ...(caption === undefined ? {} : { caption }),
      };
    }
    case 'demo': {
      const caption = text.caption ?? french.caption;
      return {
        ...french,
        title: text.title,
        steps: french.steps.map((step, index) => ({
          ...step,
          explanation: text.steps?.[index] ?? step.explanation,
        })),
        ...(caption === undefined ? {} : { caption }),
      };
    }
    case 'recap':
      return {
        ...french,
        title: text.title,
        commands: french.commands.map((command, index) => ({
          ...command,
          description: text.commands?.[index] ?? command.description,
        })),
      };
  }
}

function englishLesson(french: Lesson, text: LessonText): Lesson {
  return {
    ...french,
    title: text.title,
    slides: french.slides.map((slide, index) => englishSlide(slide, text.slides[index])),
  };
}

function englishPrediction(
  french: Prediction,
  text: PredictionText | undefined,
): Prediction {
  if (text === undefined) return french;
  return {
    ...french,
    question: text.question,
    options: french.options.map((option) => {
      const translated = text.options.find((candidate) => candidate.id === option.id);
      return translated === undefined ? option : { ...option, label: translated.label };
    }),
    explanation: text.explanation,
  };
}

function englishMission(french: Mission, text: MissionText): Mission {
  const validateAttempt = french.validateAttempt;
  const predictions =
    french.predictions === undefined
      ? undefined
      : french.predictions.map((prediction, index) =>
          englishPrediction(prediction, text.predictions?.[index]),
        );
  const display =
    french.display === undefined || text.display === undefined
      ? french.display
      : {
          ...french.display,
          ...(text.display.objective === undefined
            ? {}
            : { objective: text.display.objective }),
          ...(text.display.hints === undefined ? {} : { hints: text.display.hints }),
        };
  const forbidden =
    french.forbidden === undefined
      ? undefined
      : french.forbidden.map((entry, index) => ({
          ...entry,
          message: text.forbidden?.[index] ?? entry.message,
        }));

  return {
    ...french,
    title: text.title,
    story: text.story,
    situation: text.situation,
    objective: text.objective,
    takeaway: text.takeaway,
    steps: french.steps.map((step, index) => ({
      ...step,
      label: text.stepLabels[index] ?? step.label,
    })),
    hints: text.hints,
    validate: (state, ctx) => englishResult(french.validate(state, ctx)),
    ...(validateAttempt === undefined
      ? {}
      : {
          validateAttempt: (commands: readonly string[]) =>
            englishResult(validateAttempt(commands)),
        }),
    ...(predictions === undefined ? {} : { predictions }),
    ...(display === undefined ? {} : { display }),
    ...(forbidden === undefined ? {} : { forbidden }),
    ...(text.successNote === undefined ? {} : { successNote: text.successNote }),
  };
}

function englishChapter(french: Chapter, text: ChapterText): Chapter {
  return {
    ...french,
    title: text.title,
    tagline: text.tagline,
    description: text.description,
    lesson: englishLesson(french.lesson, text.lesson),
    missions: french.missions.map((mission) => {
      const missionText = text.missions[mission.id];
      if (missionText === undefined) return mission;
      return englishMission(mission, missionText);
    }),
  };
}

function englishBriefing(
  french: MissionBriefing,
  text: BriefingText,
): MissionBriefing {
  const outcome = text.outcome ?? french.outcome;
  const teaser = text.teaser ?? french.teaser;
  return {
    title: text.title,
    lines: french.lines.map((line, index) => ({
      ...line,
      text: text.lines[index] ?? line.text,
    })),
    ...(outcome === undefined ? {} : { outcome }),
    ...(teaser === undefined ? {} : { teaser }),
  };
}

const FRENCH: ContentPack = {
  chapters: frenchChapters,
  prologue: commandLineLesson,
  briefings: frenchBriefings,
};

const ENGLISH: ContentPack = {
  chapters: frenchChapters.map((chapter) => {
    const text = chaptersText[chapter.id];
    return text === undefined ? chapter : englishChapter(chapter, text);
  }),
  prologue: englishLesson(commandLineLesson, prologueEnglish),
  briefings: Object.fromEntries(
    Object.entries(frenchBriefings).flatMap(([id, briefing]) => {
      const text = briefingsEnglish[id];
      return text === undefined ? [[id, briefing]] : [[id, englishBriefing(briefing, text)]];
    }),
  ),
};

const PACKS: Readonly<Record<Locale, ContentPack>> = {
  fr: FRENCH,
  en: ENGLISH,
};

export function contentFor(locale: Locale): ContentPack {
  return PACKS[locale];
}

export function findChapterIn(pack: ContentPack, id: string): Chapter | undefined {
  return pack.chapters.find((chapter) => chapter.id === id);
}

export function missionSequenceIn(pack: ContentPack): readonly Mission[] {
  return pack.chapters.flatMap((chapter) => chapter.missions);
}

export function findMissionIn(pack: ContentPack, id: string): Mission | undefined {
  return missionSequenceIn(pack).find((mission) => mission.id === id);
}

export function afterMissionIn(pack: ContentPack, id: string): AfterMission {
  const sequence = missionSequenceIn(pack);
  const index = sequence.findIndex((mission) => mission.id === id);
  if (index < 0) return { kind: 'home' };
  const current = sequence[index];
  const next = sequence[index + 1];
  if (current === undefined || next === undefined) return { kind: 'home' };
  if (next.chapterId === current.chapterId) return { kind: 'mission', mission: next };
  const chapter = findChapterIn(pack, next.chapterId);
  return chapter === undefined ? { kind: 'home' } : { kind: 'lesson', chapter };
}

/** Indique si le contenu est réellement traduit, indépendamment de l'interface. */
export const CONTENT_TRANSLATED: Readonly<Record<Locale, boolean>> = {
  fr: true,
  en: true,
};

// Ré-export des types de catalogue pour les tests d'invariants.
export type { ChapterText, LessonText, MissionText, SlideText } from './catalogs/types';
