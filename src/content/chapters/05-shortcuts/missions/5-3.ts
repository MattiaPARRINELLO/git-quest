import {
  allOf,
  check,
  headBranch,
  headFile,
  isWorkingTreeClean,
} from '../../../../engine/validate';
import { entryState } from '../../../../story/checkpoints';
import { commitDelta } from '../../../../story/preconditions';
import type { Mission } from '../../../types';

const CONFIG_V5 = 'export const config = { retries: 5 };';
const APP_V3 = "export const app = 'v3';";
const MAIN_V5 = 'export const main = { bootstrap: true, retries: 5 };';
const HEALTH = "export const health = () => 'ok';";

const initial = entryState('tout-indexer');

export const mission53: Mission = {
  id: 'tout-indexer',
  chapterId: 'shortcuts',
  order: 3,
  number: '5.3',
  title: 'Tout le chantier d’un coup',
  story:
    'Fin de sprint : trois fichiers suivis ont changé et src/health.ts vient d’apparaître. L’équipe veut un seul commit propre, en deux commandes maximum, sans oublier le nouveau fichier.',
  situation:
    'app.ts, src/config.ts et main.ts sont modifiés ; src/health.ts est un nouveau fichier non suivi.',
  objective:
    'Indexe tout le chantier puis commite-le en deux commandes, en incluant le nouveau fichier.',
  steps: [
    {
      label: 'Les quatre fichiers sont dans un nouveau commit',
      done: (state, ctx) =>
        commitDelta(state, ctx?.entry ?? initial) === 1 &&
        headFile(state, 'app.ts') === APP_V3 &&
        headFile(state, 'src/config.ts') === CONFIG_V5 &&
        headFile(state, 'main.ts') === MAIN_V5 &&
        headFile(state, 'src/health.ts') === HEALTH,
    },
    {
      label: 'Le nouveau fichier est suivi',
      done: (state, ctx) =>
        commitDelta(state, ctx?.entry ?? initial) === 1 &&
        headFile(state, 'src/health.ts') === HEALTH,
    },
    {
      label: 'Le working dir est propre',
      done: (state, ctx) =>
        commitDelta(state, ctx?.entry ?? initial) === 1 && isWorkingTreeClean(state),
    },
  ],
  takeaway:
    'git add . indexe les modifications suivies et les nouveaux fichiers ; git commit -am, lui, ignore les untracked.',
  difficulty: 2,
  par: 2,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(commitDelta(state, entry) === 1, 'Il faut exactement un nouveau commit.'),
      check(headFile(state, 'app.ts') === APP_V3, 'app.ts doit être commité dans sa version v3.'),
      check(
        headFile(state, 'src/config.ts') === CONFIG_V5,
        'src/config.ts doit être commité dans sa version finale.',
      ),
      check(headFile(state, 'main.ts') === MAIN_V5, 'main.ts doit être commité dans sa version finale.'),
      check(
        headFile(state, 'src/health.ts') === HEALTH,
        'src/health.ts doit être ajouté et commité.',
      ),
      check(isWorkingTreeClean(state), 'Le working dir doit être propre à la fin.'),
    );
  },
  hints: [
    'git add . indexe tout le working dir, y compris src/health.ts que -a ne verrait pas.',
    'Une seule indexation suffit, puis un commit sans option -a.',
    'git add ., puis git commit -m "chore: sprint 5".',
  ],
  solution: ['git add .', 'git commit -m "chore: sprint 5"'],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-commit' && parsed.stageAllTracked,
      question: 'src/health.ts sera-t-il dans ce commit ?',
      options: [
        { id: 'oui', label: 'Oui' },
        { id: 'non', label: 'Non' },
      ],
      correctOptionId: 'non',
      explanation:
        '-a ne connaît que les fichiers déjà suivis. src/health.ts est untracked : il faut git add.',
    },
  ],
  suggestedCommands: [
    'git status',
    'ls',
    'git add .',
    'git commit -m "chore: sprint 5"',
  ],
};
