import { entryState } from '../../../../story/checkpoints';
import {
  allOf,
  branchTip,
  check,
  headBranch,
  headFile,
  isMergeInProgress,
  isWorkingTreeClean,
  mergeConflictPaths,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const initial = entryState('conflit-de-pull');
const MERGED = "export const notify = (message: string) => '[Nova] ' + message.trim();";

export const mission63: Mission = {
  id: 'conflit-de-pull',
  chapterId: 'collaboration',
  order: 3,
  number: '6.3',
  title: 'Le même fichier, deux versions',
  story:
    "Léa a retravaillé src/notify.ts et poussé sur origin/main. De ton côté, tu as commité une autre version du même fichier sans avoir récupéré son travail.",
  situation:
    'main et origin/main ont divergé, et les deux côtés ont modifié la même ligne de src/notify.ts.',
  objective: 'Récupère le travail de Léa, résous le conflit et publie une version unique.',
  steps: [
    {
      label: 'Récupérer et constater le conflit',
      done: (state) =>
        mergeConflictPaths(state).includes('src/notify.ts') ||
        (state.commits[branchTip(state, 'main') ?? '']?.parents.length ?? 0) === 2,
    },
    {
      label: 'Écrire la version fusionnée de src/notify.ts',
      done: (state) => {
        const content = state.worktrees[state.activeWorktree]?.workingDir['src/notify.ts'] ?? '';
        return content === MERGED;
      },
    },
    {
      label: 'Conclure la fusion',
      done: (state) =>
        !isMergeInProgress(state) &&
        (state.commits[branchTip(state, 'main') ?? '']?.parents.length ?? 0) === 2,
    },
  ],
  takeaway:
    'Un pull peut conflit exactement comme un merge : la fusion s’arrête, tu résous le fichier, puis git add et git merge --continue terminent l’intégration.',
  difficulty: 3,
  par: 4,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(!isMergeInProgress(state), 'La fusion du pull doit être terminée.'),
      check(
        (state.commits[branchTip(state, 'main') ?? '']?.parents.length ?? 0) === 2,
        'main doit se terminer par un commit de fusion à deux parents.',
      ),
      check(
        headFile(state, 'src/notify.ts') === MERGED,
        'src/notify.ts doit contenir la version fusionnée, sans marqueurs.',
      ),
      check(isWorkingTreeClean(state), 'Le working dir doit être propre après la fusion.'),
    ),
  hints: [
    'git pull va tenter de fusionner origin/main : les deux versions de src/notify.ts vont s’affronter.',
    'Édite src/notify.ts pour garder le préfixe de Léa et ton nettoyage, sans aucun marqueur.',
    'git pull, puis edit src/notify.ts, git add src/notify.ts et git merge --continue.',
  ],
  solution: [
    'git pull',
    `edit src/notify.ts "${MERGED}"`,
    'git add src/notify.ts',
    'git merge --continue',
  ],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-pull',
      question: 'Que va produire git pull ?',
      options: [
        { id: 'ff', label: 'Une avance rapide, sans commit' },
        { id: 'auto', label: 'Un merge commit automatique' },
        { id: 'conflict', label: 'Un conflit : la fusion s’arrête' },
      ],
      correctOptionId: 'conflict',
      explanation:
        'Les deux branches ont modifié la même ligne de src/notify.ts : Git écrit les deux versions et attend que tu choisisses le contenu final.',
    },
  ],
  suggestedCommands: ['git status', 'git pull', 'cat src/notify.ts', 'git add src/notify.ts'],
};
