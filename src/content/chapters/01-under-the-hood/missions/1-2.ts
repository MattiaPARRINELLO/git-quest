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
    'app.ts': 'v1',
  })
  .build();

export const mission12: Mission = {
  id: 'snapshot-fige',
  chapterId: 'under-the-hood',
  order: 2,
  number: '1.2',
  title: 'La photo ne bouge plus',
  story:
    'La doc de Nova doit passer en v2, mais tu continues à la retoucher après l’avoir indexée. Le CTO veut vérifier une intuition : un commit est une photo figée de l’index, pas un miroir du fichier sur ton disque.',
  situation: 'app.ts contient « v1 », déjà commité, et le working dir est propre.',
  objective:
    'Écris v2, indexe-la, réécris v3 sans l’indexer, puis commite : le commit doit garder v2.',
  steps: [
    {
      label: 'Écrire « v2 » dans app.ts',
      done: (state) =>
        workingFile(state, 'app.ts') === 'v2' ||
        indexFile(state, 'app.ts') === 'v2' ||
        headFile(state, 'app.ts') === 'v2',
    },
    {
      label: 'Indexer app.ts',
      done: (state) =>
        indexFile(state, 'app.ts') === 'v2' || headFile(state, 'app.ts') === 'v2',
    },
    {
      label: 'Réécrire « v3 » sans l’indexer',
      done: (state) =>
        workingFile(state, 'app.ts') === 'v3' && indexFile(state, 'app.ts') === 'v2',
    },
    {
      label: 'Committer la version indexée (v2)',
      done: (state) => headFile(state, 'app.ts') === 'v2',
    },
  ],
  takeaway:
    'Le commit prend la photo de l’index, pas du disque. v3 est toujours là, non commitée.',
  difficulty: 2,
  par: 4,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(commitCount(state) === 2, 'Il faut exactement deux commits.'),
      check(headFile(state, 'app.ts') === 'v2', 'Le commit doit contenir v2.'),
      check(
        workingFile(state, 'app.ts') === 'v3',
        'Le working dir doit encore contenir v3, non commité.',
      ),
    ),
  hints: [
    'Le commit photographie l’index, même si le fichier change ensuite sur le disque.',
    'Indexe v2, puis réécris v3 sans refaire git add.',
    'edit app.ts "v2", git add app.ts, edit app.ts "v3", git commit -m "docs: v2".',
  ],
  solution: [
    'edit app.ts "v2"',
    'git add app.ts',
    'edit app.ts "v3"',
    'git commit -m "docs: v2"',
  ],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-commit',
      question: 'Quelle version sera dans le commit ?',
      options: [
        { id: 'v2', label: 'v2, la version indexée' },
        { id: 'v3', label: 'v3, la dernière version du disque' },
      ],
      correctOptionId: 'v2',
      explanation:
        'Seule v2 est dans l’index. v3 reste dans le working dir, non commitée.',
    },
  ],
  suggestedCommands: [
    'edit app.ts "v2"',
    'cat app.ts',
    'git add app.ts',
    'git status',
    'git commit -m "docs: v2"',
  ],
};
