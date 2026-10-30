import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  check,
  commitCount,
  headBranch,
  headFile,
  workingFile,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const initial = scenario()
  .init()
  .commit('Initial commit', {
    'README.md': '# Projet Nova',
    'src/app.ts': "export const app = 'nova';",
  })
  .build();

export const mission12: Mission = {
  id: 'snapshot-fige',
  chapterId: 'under-the-hood',
  order: 2,
  number: '1.2',
  title: 'La photo ne bouge plus',
  story:
    "La doc de Nova doit passer en version 2, mais tu continues à la retoucher après l’avoir indexée. Le CTO veut vérifier une intuition : un commit est une photo figée de l’index, pas un miroir du fichier en train de changer sur ton disque.",
  objective: 'Indexe la version 2, modifie encore le fichier, puis commit : le commit doit garder la version 2.',
  difficulty: 2,
  par: 4,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(commitCount(state) === 2, 'Il faut exactement deux commits.'),
      check(headFile(state, 'README.md') === 'version 2', 'Le commit doit contenir la version indexée (version 2).'),
      check(
        workingFile(state, 'README.md') === 'version 3 (non commitée)',
        'Le working dir doit conserver la retouche non commitée.',
      ),
    ),
  hints: [
    'Le commit photographie l’index, même si le fichier change ensuite sur le disque.',
    'Indexe la version 2, puis modifie à nouveau le fichier sans refaire git add.',
    'edit README.md "version 2", git add README.md, edit README.md "version 3 (non commitée)", git commit -m "docs: v2".',
  ],
  solution: [
    'edit README.md "version 2"',
    'git add README.md',
    'edit README.md "version 3 (non commitée)"',
    'git commit -m "docs: v2"',
  ],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-commit',
      question: 'Que contiendra le commit après cette seconde modification non indexée ?',
      options: [
        { id: 'indexed', label: 'La version 2, celle de l’index' },
        { id: 'working', label: 'La version 3 du working dir' },
        { id: 'both', label: 'Les deux versions fusionnées' },
      ],
      correctOptionId: 'indexed',
      explanation:
        'La version 3 n’est pas indexée : le commit reste sur la photo de la version 2. Le working dir garde la retouche.',
    },
  ],
};
