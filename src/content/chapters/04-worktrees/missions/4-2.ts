import {
  allOf,
  branchFile,
  check,
  headBranch,
  workingFile,
  worktreePaths,
} from '../../../../engine/validate';
import { entryState } from '../../../../story/checkpoints';
import { branchUnchanged } from '../../../../story/preconditions';
import type { Mission } from '../../../types';

const initial = entryState('deux-worktrees');

export const mission42: Mission = {
  id: 'deux-worktrees',
  chapterId: 'worktrees',
  order: 2,
  number: '4.2',
  title: 'Deux casquettes',
  story:
    "La doc de Nova doit être relue pendant que tu réécris le README sur main. Samir a déjà poussé le guide sur la branche docs ; il te faut un second espace de travail pour le consulter sans quitter ton README en cours.",
  situation:
    'HEAD est sur main avec README modifié ; la branche docs contient déjà le guide.',
  objective:
    'Monte un worktree docs depuis la branche docs, vérifie le guide, puis reviens sur main avec le WIP intact.',
  steps: [
    {
      label: 'Créer le worktree docs',
      done: (state) => worktreePaths(state).includes('~/gitquest-docs'),
    },
    {
      label: 'Vérifier que le worktree contient le guide',
      done: (state) =>
        worktreePaths(state).includes('~/gitquest-docs') &&
        branchFile(state, 'docs', 'docs/GUIDE.md') !== undefined,
    },
    {
      label: 'Revenir sur main avec le WIP intact',
      done: (state) =>
        worktreePaths(state).includes('~/gitquest-docs') &&
        state.activeWorktree === 'main' &&
        workingFile(state, 'README.md') === '# Nova — brouillon de documentation',
    },
  ],
  takeaway:
    'Deux worktrees permettent de mener deux branches en parallèle sans stash ni commit temporaire.',
  difficulty: 2,
  par: 3,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(worktreePaths(state).includes('~/gitquest-docs'), 'Le worktree docs doit exister.'),
      check(
        branchFile(state, 'docs', 'docs/GUIDE.md') !== undefined,
        'La branche docs doit contenir le guide.',
      ),
      check(
        workingFile(state, 'README.md') === '# Nova — brouillon de documentation',
        'Le WIP de README.md sur main doit rester intact.',
      ),
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(state.worktrees.main?.workingDir['docs/GUIDE.md'] === undefined, 'Le guide ne doit pas apparaître dans le worktree principal.'),
      check(branchUnchanged(state, entry, 'main'), 'main ne doit pas bouger.'),
    );
  },
  hints: [
    'Le guide est déjà sur la branche docs : crée un worktree sur cette branche existante, puis active-le avec cd.',
    'Dans le worktree docs, tu peux lire docs/GUIDE.md sans toucher au README de main.',
    'git worktree add ../gitquest-docs docs, cd ../gitquest-docs, cat docs/GUIDE.md, cd ../gitquest.',
  ],
  solution: [
    'git worktree add ../gitquest-docs docs',
    'cd ../gitquest-docs',
    'cd ../gitquest',
  ],
  successNote: 'Deux branches, deux espaces de travail, aucun stash et aucun commit croisé.',
};
