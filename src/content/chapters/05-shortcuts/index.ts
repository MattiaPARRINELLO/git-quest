import type { Chapter } from '../../types';
import { lesson05 } from './lesson';
import { mission51 } from './missions/5-1';
import { mission52 } from './missions/5-2';
import { mission53 } from './missions/5-3';

export const chapter05: Chapter = {
  id: 'shortcuts',
  number: 5,
  title: 'Raccourcis',
  tagline: 'Une intention, une commande',
  description:
    'Commiter un seul fichier sans git add, créer et rejoindre une branche en une fois, indexer tout un chantier d’un seul geste.',
  lesson: lesson05,
  missions: [mission51, mission52, mission53],
};
