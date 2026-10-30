import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  check,
  commitCount,
  headBranch,
  headFile,
  indexFile,
  isWorkingTreeClean,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const initial = scenario()
  .init()
  .commit('Initial commit', {
    'README.md': 'version 1',
    'src/app.ts': "export const app = 'nova';",
  })
  .write('README.md', 'version 2')
  .write('notes.txt', 'notes de réunion')
  .build();

export const mission13: Mission = {
  id: 'piege-am',
  chapterId: 'under-the-hood',
  order: 3,
  number: '1.3',
  title: 'Le piège du -am',
  story:
    "README.md est modifié et notes.txt vient d’apparaître. Un coéquipier t’assure que « git commit -am » s’occupe de tout : rapide, efficace, sans réfléchir. Sauf que notes.txt n’a jamais été suivi : commit tout proprement et découvre ce que -am laisse de côté.",
  situation: 'README.md est modifié et notes.txt n’a jamais été suivi par Git.',
  objective: 'Commite README.md et notes.txt ensemble, sans laisser de fichier orphelin.',
  steps: [
    {
      label: 'Indexer notes.txt avec git add',
      done: (state) => indexFile(state, 'notes.txt') === 'notes de réunion',
    },
    {
      label: 'Committer README.md en version 2',
      done: (state) => headFile(state, 'README.md') === 'version 2',
    },
    {
      label: 'Committer aussi notes.txt',
      done: (state) => headFile(state, 'notes.txt') === 'notes de réunion',
    },
    {
      label: 'Obtenir un working dir propre',
      done: (state) =>
        isWorkingTreeClean(state) && headFile(state, 'notes.txt') !== undefined,
    },
  ],
  takeaway:
    'git commit -am indexe le suivi, pas les untracked : git add reste nécessaire pour les nouveaux fichiers.',
  difficulty: 2,
  par: 2,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(commitCount(state) === 2, 'Un seul nouveau commit est attendu.'),
      check(headFile(state, 'README.md') === 'version 2', 'README.md doit être commité en version 2.'),
      check(headFile(state, 'notes.txt') === 'notes de réunion', 'notes.txt doit entrer dans le commit.'),
      check(isWorkingTreeClean(state), 'Le working dir doit être propre à la fin.'),
    ),
  hints: [
    'L’option -a indexe les fichiers déjà suivis, jamais les fichiers non suivis.',
    'notes.txt est untracked : il faut d’abord l’ajouter explicitement à l’index.',
    'git add notes.txt, puis git commit -am "docs: readme et notes".',
  ],
  solution: ['git add notes.txt', 'git commit -am "docs: readme et notes"'],
  successNote: 'Le piège est désamorcé : -a gère le suivi, git add gère les nouveaux fichiers.',
  suggestedCommands: ['cat README.md', 'git status', 'git add notes.txt', 'git commit -am "docs: readme et notes"'],
};
