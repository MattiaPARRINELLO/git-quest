import type { Chapter } from '../../types';
import { lesson01 } from './lesson';
import { mission11 } from './missions/1-1';
import { mission12 } from './missions/1-2';
import { mission13 } from './missions/1-3';

export const chapter01: Chapter = {
  id: 'under-the-hood',
  number: 1,
  title: 'Sous le capot',
  tagline: 'Commits, snapshots, branches et HEAD',
  description:
    'Comprendre ce que Git photographie vraiment, et pourquoi une branche n’est qu’une étiquette.',
  lesson: lesson01,
  missions: [mission11, mission12, mission13],
};
