import {
  allOf,
  check,
  headBranch,
  headFile,
  indexFile,
  workingFile,
} from '../../../../engine/validate';
import { entryState } from '../../../../story/checkpoints';
import { commitDelta } from '../../../../story/preconditions';
import type { Mission } from '../../../types';

const initial = entryState('trois-zones');

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
      done: (state) => indexFile(state, 'a.txt') === 'Nova — notes de conception : synchronisation locale + cache hors-ligne.',
    },
    {
      label: 'Committer la note de conception mise à jour',
      done: (state) => headFile(state, 'a.txt') === 'Nova — notes de conception : synchronisation locale + cache hors-ligne.',
    },
    {
      label: 'Laisser b.txt modifié hors du commit',
      done: (state) =>
        headFile(state, 'a.txt') === 'Nova — notes de conception : synchronisation locale + cache hors-ligne.' &&
        workingFile(state, 'b.txt') === 'Nova — idées : mode sombre, export PDF, partage de notes.' &&
        headFile(state, 'b.txt') === 'Nova — idées : mode sombre, export PDF.',
    },
  ],
  takeaway: 'Le commit ne prend que l’index : b.txt reste hors de la photo tant qu’il n’est pas indexé.',
  difficulty: 1,
  par: 2,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(commitDelta(state, entry) === 1, 'Un seul nouveau commit est attendu.'),
      check(headFile(state, 'a.txt') === 'Nova — notes de conception : synchronisation locale + cache hors-ligne.', 'Le commit doit contenir la version mise à jour de a.txt.'),
      check(headFile(state, 'b.txt') === 'Nova — idées : mode sombre, export PDF.', 'Le commit ne doit pas contenir b.txt modifié.'),
      check(
        workingFile(state, 'a.txt') === 'Nova — notes de conception : synchronisation locale + cache hors-ligne.',
        'a.txt doit être à jour dans le working dir.',
      ),
      check(
        workingFile(state, 'b.txt') === 'Nova — idées : mode sombre, export PDF, partage de notes.',
        'b.txt doit rester modifié dans le working dir.',
      ),
    );
  },
  hints: [
    'Un commit photographie l’index, pas tout le working dir. Il faut choisir quoi indexer.',
    'Ajoute seulement a.txt à l’index, puis commit : b.txt restera modifié sur le disque.',
    'git add a.txt, puis git commit -m "fix: a.txt".',
  ],
  solution: ['git add a.txt', 'git commit -m "fix: a.txt"'],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-commit',
      question: 'Quels fichiers seront dans ce commit ?',
      options: [
        { id: 'a', label: 'a.txt' },
        { id: 'both', label: 'a.txt et b.txt' },
        { id: 'none', label: 'Aucun' },
      ],
      correctOptionId: 'a',
      explanation:
        'Le commit ne lit que l’index. b.txt reste modifié dans le working dir sans entrer dans la photo.',
    },
  ],
  suggestedCommands: ['cat a.txt', 'git status', 'git add a.txt', 'git commit -m "fix: a.txt"'],
};
