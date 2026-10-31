import type { Chapter } from '../../types';
import { lesson03 } from './lesson';
import { mission31 } from './missions/3-1';
import { mission32 } from './missions/3-2';
import { mission33 } from './missions/3-3';
import { mission34 } from './missions/3-4';

export const chapter03: Chapter = {
  id: 'merging',
  number: 3,
  title: 'Fusionner',
  tagline: 'Avance rapide, merge commit, nettoyage',
  description:
    'Choisir le bon type de fusion, comprendre les deux parents d’un merge commit et supprimer une branche sans perdre d’historique.',
  lesson: lesson03,
  missions: [mission31, mission32, mission33, mission34],
};
