import { chapter01Text } from './chapter-01';
import { chapter02Text } from './chapter-02';
import { chapter03Text } from './chapter-03';
import { chapter04Text } from './chapter-04';
import { chapter05Text } from './chapter-05';
import { chapter06Text } from './chapter-06';
import { briefingsText } from './briefings';
import { messageTranslations } from './messages';
import { prologueText } from './prologue';
import type { ChapterText, LessonText } from '../types';

/**
 * Pack anglais du contenu pédagogique.
 *
 * Chaque chapitre est aligné par identifiant sur sa version française. Le
 * chargeur (`src/content/localized.ts`) recopie la structure et remplace
 * uniquement les textes.
 */
export const chaptersText: Readonly<Record<string, ChapterText>> = {
  'under-the-hood': chapter01Text,
  branches: chapter02Text,
  merging: chapter03Text,
  worktrees: chapter04Text,
  shortcuts: chapter05Text,
  collaboration: chapter06Text,
};

export const prologueEnglish: LessonText = prologueText;
export const briefingsEnglish: typeof briefingsText = briefingsText;
export const messagesEnglish: Readonly<Record<string, string>> = messageTranslations;
