import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  check,
  commitCount,
  hasBranch,
  headFile,
  isWorkingTreeClean,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

export const mission11: Mission = {
  id: 'premier-commit',
  chapterId: 'under-the-hood',
  order: 1,
  number: '1.1',
  title: 'La première photo',
  story:
    "Tu rejoins l'équipe Nova sur un dépôt tout juste initialisé. Personne n'a encore rien commité, et le lead te demande de poser la première pierre : un README qui servira de point de départ à tout le monde.",
  objective: 'Crée le fichier README.md et enregistre-le dans un premier commit.',
  difficulty: 1,
  par: 4,
  initialState: scenario().init().build(),
  validate: (state) =>
    allOf(
      check(hasBranch(state, 'main'), 'La branche main doit exister après le commit.'),
      check(commitCount(state) === 1, 'Il faut exactement un commit.'),
      check(headFile(state, 'README.md') === '# Projet Nova', 'README.md doit contenir « # Projet Nova ».'),
      check(isWorkingTreeClean(state), 'Le working dir doit être propre après le commit.'),
    ),
  hints: [
    'Un commit ne contient que ce qui est indexé : crée le fichier, puis ajoute-le.',
    'La séquence est : créer, indexer avec git add, photographier avec git commit -m.',
    'touch README.md, edit README.md "# Projet Nova", git add README.md, git commit -m "docs: premier commit".',
  ],
  solution: [
    'touch README.md',
    'edit README.md "# Projet Nova"',
    'git add README.md',
    'git commit -m "docs: premier commit"',
  ],
};
