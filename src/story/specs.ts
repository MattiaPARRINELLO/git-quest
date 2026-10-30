import { storyRoot } from '../content/story/root';
import { chapter01Story } from '../content/story/01';
import { chapter02Story } from '../content/story/02';
import { chapter03Story } from '../content/story/03';
import { chapter04Story } from '../content/story/04';
import { chapter05Story } from '../content/story/05';
import type { ChainMission } from './chain';

/** Racine et specs de la chaîne de référence. Complétées chapitre par chapitre. */
export const STORY_ROOT = storyRoot;

export const STORY_SPECS: readonly ChainMission[] = [
  ...chapter01Story,
  ...chapter02Story,
  ...chapter03Story,
  ...chapter04Story,
  ...chapter05Story,
];
