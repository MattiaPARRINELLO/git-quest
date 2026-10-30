import type { Chapter } from '../../types';
import { lesson04 } from './lesson';
import { mission41 } from './missions/4-1';
import { mission42 } from './missions/4-2';
import { mission43 } from './missions/4-3';

export const chapter04: Chapter = {
  id: 'worktrees',
  number: 4,
  title: 'Worktrees',
  tagline: 'Deux branches, deux bureaux, un dépôt',
  description:
    'Travailler sur une urgence de prod sans interrompre un WIP, mener deux chantiers en parallèle, puis ranger proprement.',
  lesson: lesson04,
  missions: [mission41, mission42, mission43],
};
