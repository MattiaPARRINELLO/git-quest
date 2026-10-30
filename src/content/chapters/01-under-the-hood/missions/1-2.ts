import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  branchFile,
  branchTip,
  check,
  commitCount,
  headBranch,
  headFile,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const initial = scenario()
  .init()
  .commit('Initial commit', {
    'README.md': '# Projet Nova',
    'src/app.ts': "export const app = 'nova';",
  })
  .build();

const mainTip = initial.branches.main ?? '';

export const mission12: Mission = {
  id: 'branche-pointeur',
  chapterId: 'under-the-hood',
  order: 2,
  number: '1.2',
  title: 'Le pointeur fantôme',
  story:
    "L'équipe veut tester une idée de notes internes sans polluer main. Tu crées une branche experiment, tu y travailles, puis tu vérifies que main n'a pas bougé d'un millimètre. Une branche n'est qu'une étiquette : c'est le moment de le prouver.",
  objective: 'Crée la branche experiment, commite notes.txt dessus, et laisse main intacte.',
  difficulty: 2,
  par: 5,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'experiment', 'HEAD doit être sur experiment.'),
      check(branchFile(state, 'experiment', 'notes.txt') === 'notes de la branche', 'experiment doit contenir notes.txt.'),
      check(branchTip(state, 'main') === mainTip, 'main ne doit pas bouger.'),
      check(headFile(state, 'notes.txt') === 'notes de la branche', 'Le HEAD de experiment doit voir notes.txt.'),
      check(commitCount(state) === 2, 'Un seul nouveau commit est attendu.'),
    ),
  hints: [
    'Créer une branche ne change pas HEAD : il faut ensuite y basculer.',
    'Après le switch, crée notes.txt, indexe-le, puis commit.',
    'git branch experiment, git switch experiment, edit notes.txt "notes de la branche", git add notes.txt, git commit -m "feat: notes expérimentales".',
  ],
  solution: [
    'git branch experiment',
    'git switch experiment',
    'edit notes.txt "notes de la branche"',
    'git add notes.txt',
    'git commit -m "feat: notes expérimentales"',
  ],
  predictions: [
    {
      whenCommand: 'git switch experiment',
      question: 'Après ce switch, où sera HEAD ?',
      options: [
        { id: 'main', label: 'Sur la branche main', target: { kind: 'branch', value: 'main' } },
        {
          id: 'experiment',
          label: 'Sur la branche experiment',
          target: { kind: 'branch', value: 'experiment' },
        },
        {
          id: 'detached',
          label: `Détaché sur le commit ${mainTip.slice(0, 7)}`,
          target: { kind: 'commit', value: mainTip },
        },
      ],
      correctOptionId: 'experiment',
      explanation:
        'git switch experiment attache HEAD à l’étiquette experiment, qui pointe sur le même commit que main pour l’instant.',
    },
  ],
};
