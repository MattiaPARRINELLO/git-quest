import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  check,
  commitCount,
  headBranch,
  headFile,
  indexFile,
  workingFile,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const initial = scenario()
  .init()
  .commit('Initial commit', {
    'a.txt': 'version 1',
    'b.txt': 'version 1',
  })
  .write('a.txt', 'version 2')
  .write('b.txt', 'version 2')
  .build();

export const mission11: Mission = {
  id: 'trois-zones',
  chapterId: 'under-the-hood',
  order: 1,
  number: '1.1',
  title: 'Les 3 zones',
  story:
    "Deux fichiers sont modifiés dans le projet Nova : a.txt et b.txt. Le lead ne veut livrer que le correctif de a.txt maintenant, et garder b.txt pour la prochaine release. Toute la question est de savoir ce que le commit va réellement photographier.",
  situation: 'a.txt et b.txt sont modifiés ; rien n’est encore indexé.',
  objective: 'Commite uniquement a.txt et laisse b.txt modifié dans le working dir.',
  steps: [
    {
      label: 'Indexer a.txt avec git add',
      done: (state) => indexFile(state, 'a.txt') === 'version 2',
    },
    {
      label: 'Committer a.txt en version 2',
      done: (state) => headFile(state, 'a.txt') === 'version 2',
    },
    {
      label: 'Laisser b.txt modifié hors du commit',
      done: (state) =>
        headFile(state, 'a.txt') === 'version 2' &&
        workingFile(state, 'b.txt') === 'version 2' &&
        headFile(state, 'b.txt') === 'version 1',
    },
  ],
  takeaway: 'Le commit ne prend que l’index : b.txt reste hors de la photo tant qu’il n’est pas indexé.',
  difficulty: 1,
  par: 2,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(commitCount(state) === 2, 'Un seul nouveau commit est attendu.'),
      check(headFile(state, 'a.txt') === 'version 2', 'Le commit doit contenir a.txt en version 2.'),
      check(headFile(state, 'b.txt') === 'version 1', 'Le commit ne doit pas contenir b.txt modifié.'),
      check(
        workingFile(state, 'a.txt') === 'version 2',
        'a.txt doit être à jour dans le working dir.',
      ),
      check(
        workingFile(state, 'b.txt') === 'version 2',
        'b.txt doit rester modifié dans le working dir.',
      ),
    ),
  hints: [
    'Un commit photographie l’index, pas tout le working dir. Il faut choisir quoi indexer.',
    'Ajoute seulement a.txt à l’index, puis commit : b.txt restera modifié sur le disque.',
    'git add a.txt, puis git commit -m "fix: a.txt".',
  ],
  solution: ['git add a.txt', 'git commit -m "fix: a.txt"'],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-commit',
      question: 'Quels fichiers seront réellement dans ce commit ?',
      options: [
        { id: 'both', label: 'Les deux fichiers modifiés' },
        { id: 'indexed', label: 'Uniquement le fichier indexé' },
        { id: 'none', label: 'Aucun fichier : le commit sera vide' },
      ],
      correctOptionId: 'indexed',
      explanation:
        'Le commit ne lit que l’index. b.txt reste modifié dans le working dir sans entrer dans la photo.',
    },
  ],
  suggestedCommands: ['cat a.txt', 'git status', 'git add a.txt', 'git commit -m "fix: a.txt"'],
};
