import type { Chapter } from '../../types';
import { lesson06 } from './lesson';
import { mission61 } from './missions/6-1';
import { mission62 } from './missions/6-2';
import { mission63 } from './missions/6-3';

export const chapter06: Chapter = {
  id: 'collaboration',
  number: 6,
  title: 'Collaborer',
  tagline: 'Remote, push, pull, conflits de pull',
  description:
    'Relier un dépôt local à GitHub, publier une branche, récupérer le travail d’un coéquipier et résoudre le conflit qu’un pull peut provoquer.',
  lesson: lesson06,
  missions: [mission61, mission62, mission63],
};
