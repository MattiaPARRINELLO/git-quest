import { chapters, commandLineLesson } from './index';
import { missionBriefings } from './briefings';
import type { MissionBriefing } from './briefings';
import type { Chapter, Lesson } from './types';
import type { Locale } from '../i18n';

/**
 * Pack de contenu d'une langue.
 *
 * Le contenu pédagogique (cours, missions, briefings) est traduit langue par
 * langue. Aujourd'hui seul le pack français existe : `en` réutilise le français
 * tant que la traduction n'est pas livrée. Voir `docs/I18N.md`.
 */
export interface ContentPack {
  readonly chapters: readonly Chapter[];
  readonly prologue: Lesson;
  readonly briefings: Readonly<Record<string, MissionBriefing>>;
}

const FRENCH: ContentPack = {
  chapters,
  prologue: commandLineLesson,
  briefings: missionBriefings,
};

const PACKS: Readonly<Record<Locale, ContentPack>> = {
  fr: FRENCH,
  // TODO(i18n): remplacer par le pack anglais quand les chapitres sont traduits.
  en: FRENCH,
};

export function contentFor(locale: Locale): ContentPack {
  return PACKS[locale];
}

/** Indique si le contenu est réellement traduit, indépendamment de l'interface. */
export const CONTENT_TRANSLATED: Readonly<Record<Locale, boolean>> = {
  fr: true,
  en: false,
};
