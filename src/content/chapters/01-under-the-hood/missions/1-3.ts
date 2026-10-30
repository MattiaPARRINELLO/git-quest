import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  check,
  commitCount,
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

export const mission13: Mission = {
  id: 'snapshot-fige',
  chapterId: 'under-the-hood',
  order: 3,
  number: '1.3',
  title: 'La photo ne bouge plus',
  story:
    "La doc de Nova affirme que main est en version 2, mais un fichier traîne en version 3 sur ton disque. Le CTO veut une démonstration : un commit est une photo figée, et modifier un fichier ensuite ne réécrit pas le passé.",
  objective: 'Commite la version 2 du README, puis modifie-le à nouveau sans commiter.',
  difficulty: 2,
  par: 3,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(commitCount(state) === 2, 'Il faut deux commits.'),
      check(headFile(state, 'README.md') === 'version 2', 'Le dernier commit doit contenir « version 2 ».'),
      check(
        workingFile(state, 'README.md') === 'version 3 (non commitée)',
        'Le working dir doit afficher « version 3 (non commitée) ».',
      ),
    ),
  hints: [
    'Le commit photographie l’index, pas le contenu actuel du fichier.',
    'Modifie, indexe avec git commit -a, puis modifie encore une fois.',
    'edit README.md "version 2", git commit -am "docs: v2", edit README.md "version 3 (non commitée)".',
  ],
  solution: [
    'edit README.md "version 2"',
    'git commit -am "docs: v2"',
    'edit README.md "version 3 (non commitée)"',
  ],
};
