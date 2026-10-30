import {
  allOf,
  check,
  headBranch,
  headFile,
  workingFile,
} from '../../../../engine/validate';
import { entryState } from '../../../../story/checkpoints';
import { commitDelta } from '../../../../story/preconditions';
import type { Mission } from '../../../types';

const initial = entryState('snapshot-fige');

export const mission12: Mission = {
  id: 'snapshot-fige',
  chapterId: 'under-the-hood',
  order: 2,
  number: '1.2',
  title: 'La photo ne bouge plus',
  story:
    'Le module app.ts de Nova est prêt à passer en v3, mais l’index a été préparé avec v2. Le CTO veut vérifier une intuition : un commit est une photo figée de l’index, pas un miroir du fichier sur ton disque.',
  situation: 'L’index contient app.ts en v2 ; le fichier sur le disque est déjà en v3.',
  objective:
    'Commite l’index sans rien réindexer : le commit doit garder v2, et v3 doit rester sur le disque.',
  steps: [
    {
      label: 'Committer l’index sans refaire git add',
      done: (state, ctx) =>
        headFile(state, 'app.ts') === 'v2' &&
        commitDelta(state, ctx?.entry ?? initial) === 1,
    },
    {
      label: 'Laisser v3 sur le disque, hors du commit',
      done: (state) =>
        headFile(state, 'app.ts') === 'v2' && workingFile(state, 'app.ts') === 'v3',
    },
  ],
  takeaway:
    'Le commit prend la photo de l’index, pas du disque. v3 est toujours là, non commitée.',
  difficulty: 2,
  par: 1,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(commitDelta(state, entry) === 1, 'Il faut exactement un nouveau commit.'),
      check(headFile(state, 'app.ts') === 'v2', 'Le commit doit contenir v2.'),
      check(
        workingFile(state, 'app.ts') === 'v3',
        'Le working dir doit encore contenir v3, non commité.',
      ),
    );
  },
  hints: [
    'Le commit photographie l’index, même si le fichier sur le disque est déjà plus récent.',
    'L’index contient déjà v2 : un git add app.ts écraserait cet état avec v3.',
    'git commit -m "docs: v2".',
  ],
  solution: ['git commit -m "docs: v2"'],
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
  suggestedCommands: ['cat app.ts', 'git status', 'git branch', 'git commit -m "docs: v2"'],
};
