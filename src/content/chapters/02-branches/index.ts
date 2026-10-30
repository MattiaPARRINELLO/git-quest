import type { Chapter } from '../../types';
import { lesson02 } from './lesson';
import { mission21 } from './missions/2-1';
import { mission22 } from './missions/2-2';
import { mission23 } from './missions/2-3';

export const chapter02: Chapter = {
  id: 'branches',
  number: 2,
  title: 'Les branches',
  tagline: 'Créer, changer, se détacher proprement',
  description:
    'Faire diverger deux lignes de travail, explorer un commit sans rien casser, et rescuer un commit orphelin.',
  lesson: lesson02,
  missions: [mission21, mission22, mission23],
};
