import {
  allOf,
  check,
  commitList,
  headBranch,
  headFile,
  isWorkingTreeClean,
} from '../../../../engine/validate';
import { entryState } from '../../../../story/checkpoints';
import type { Mission } from '../../../types';

const initial = entryState('piege-am');

export const mission13: Mission = {
  id: 'piege-am',
  chapterId: 'under-the-hood',
  order: 3,
  number: '1.3',
  title: 'Le piège du -am',
  story:
    "Un coéquipier affirme que « git commit -am » s’occupe de tout, sans jamais avoir à indexer quoi que ce soit. Vérifie ce que Git photographie vraiment avec ce réflexe.",
  situation: 'README.md est modifié et notes.txt vient d’apparaître dans le projet.',
  objective: 'Commite README.md en version 2 et notes.txt, puis laisse un working dir propre.',
  steps: [
    {
      label: 'README v2 présent dans un commit',
      done: (state) =>
        commitList(state).some((commit) => commit.snapshot['README.md'] === 'version 2'),
    },
    {
      label: 'notes.txt présent dans un commit',
      done: (state) =>
        commitList(state).some((commit) => commit.snapshot['notes.txt'] === 'notes de réunion'),
    },
    {
      label: 'Working dir propre',
      done: (state) => isWorkingTreeClean(state),
    },
  ],
  takeaway:
    'git commit -am indexe les fichiers suivis, pas les untracked : git add reste nécessaire pour un nouveau fichier.',
  difficulty: 2,
  par: 3,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(headFile(state, 'README.md') === 'version 2', 'README.md doit finir en version 2.'),
      check(headFile(state, 'notes.txt') === 'notes de réunion', 'notes.txt doit finir commité.'),
      check(isWorkingTreeClean(state), 'Le working dir doit être propre à la fin.'),
    ),
  hints: [
    'Lance d’abord le commit -am comme le suggère ton coéquipier, puis inspecte le résultat.',
    'notes.txt n’a jamais été suivi : -a ne peut pas l’indexer. Il faut l’ajouter explicitement, puis commiter.',
    'git commit -am "docs: readme", git add notes.txt, git commit -m "docs: notes".',
  ],
  solution: [
    'git commit -am "docs: readme"',
    'git add notes.txt',
    'git commit -m "docs: notes"',
  ],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-commit' && parsed.stageAllTracked,
      question: 'notes.txt sera-t-il dans ce commit ?',
      options: [
        { id: 'oui', label: 'Oui' },
        { id: 'non', label: 'Non' },
      ],
      correctOptionId: 'non',
      explanation:
        'notes.txt n’a jamais été suivi : -a ne peut pas l’indexer. Il reste hors de la photo.',
    },
  ],
  suggestedCommands: [
    'cat README.md',
    'git status',
    'git commit -am "docs: readme"',
  ],
};
