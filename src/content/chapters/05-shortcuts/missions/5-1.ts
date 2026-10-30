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

const CONFIG_V5 = 'export const config = { retries: 5 };';
const README_FINAL = '# Nova — documentation finale';
const APP_V3 = "export const app = 'v3';";

const initial = entryState('commit-cible');

export const mission51: Mission = {
  id: 'commit-cible',
  chapterId: 'shortcuts',
  order: 1,
  number: '5.1',
  title: 'Un fichier, une commande',
  story:
    'Trois fichiers ont changé sur main, mais seul le correctif de configuration part maintenant. Le reste attend la revue de demain : le commit doit ne contenir que src/config.ts, sans passer par git add.',
  situation:
    'src/config.ts, README.md et app.ts sont modifiés dans le working dir ; l’index est vide.',
  objective:
    'Commite uniquement src/config.ts en une seule commande, et laisse les deux autres modifications sur le disque.',
  steps: [
    {
      label: 'src/config.ts est dans un nouveau commit',
      done: (state, ctx) =>
        commitDelta(state, ctx?.entry ?? initial) === 1 &&
        headFile(state, 'src/config.ts') === CONFIG_V5,
    },
    {
      label: 'README.md et app.ts restent hors du commit',
      done: (state, ctx) =>
        commitDelta(state, ctx?.entry ?? initial) === 1 &&
        headFile(state, 'README.md') === '# Nova — brouillon de documentation' &&
        headFile(state, 'app.ts') === "export const app = 'v2 main';",
    },
    {
      label: 'Leurs modifications restent dans le working dir',
      done: (state, ctx) =>
        commitDelta(state, ctx?.entry ?? initial) === 1 &&
        workingFile(state, 'README.md') === README_FINAL &&
        workingFile(state, 'app.ts') === APP_V3,
    },
  ],
  takeaway:
    'git commit -m "msg" <fichier> photographie ce seul chemin : les autres changements restent sur le disque.',
  difficulty: 1,
  par: 1,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(commitDelta(state, entry) === 1, 'Il faut exactement un nouveau commit.'),
      check(
        headFile(state, 'src/config.ts') === CONFIG_V5,
        'Le commit doit contenir la nouvelle configuration.',
      ),
      check(
        headFile(state, 'README.md') === '# Nova — brouillon de documentation',
        'README.md ne doit pas entrer dans ce commit.',
      ),
      check(
        headFile(state, 'app.ts') === "export const app = 'v2 main';",
        'app.ts ne doit pas entrer dans ce commit.',
      ),
      check(
        workingFile(state, 'README.md') === README_FINAL &&
          workingFile(state, 'app.ts') === APP_V3,
        'Les autres modifications doivent rester dans le working dir.',
      ),
    );
  },
  hints: [
    'git add puis git commit fonctionnerait, mais deux commandes sont inutiles ici.',
    'git commit accepte un chemin après le message : Git photographie alors seulement ce fichier.',
    'git commit -m "fix: retries 5" src/config.ts.',
  ],
  solution: ['git commit -m "fix: retries 5" src/config.ts'],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-commit' && (parsed.paths?.length ?? 0) > 0,
      question: 'Quels fichiers entreront dans ce commit ?',
      options: [
        { id: 'config', label: 'Seulement src/config.ts' },
        { id: 'tous', label: 'Les trois fichiers modifiés' },
      ],
      correctOptionId: 'config',
      explanation:
        'Le chemin placé après le message limite la photo à ce fichier ; les autres modifications restent hors du commit.',
    },
  ],
  suggestedCommands: [
    'git status',
    'cat src/config.ts',
    'git commit -m "fix: retries 5" src/config.ts',
  ],
};
