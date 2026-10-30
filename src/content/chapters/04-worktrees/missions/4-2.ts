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
    "La doc de Nova doit être livrée pendant que tu réécris le README sur main. Impossible de tout faire dans le même working dir sans mélanger les deux chantiers. Monte un worktree dédié à la branche docs et avance dessus sans interrompre ton travail en cours.",
  situation:
    'HEAD est sur main avec README modifié ; docs pointe sur le même commit, non checkout ailleurs.',
  objective: 'Ajoute docs/GUIDE.md sur docs depuis un worktree séparé, sans commiter le WIP de main.',
  steps: [
    {
      label: 'Créer le worktree docs',
      done: (state) => worktreePaths(state).includes('~/gitquest-docs'),
    },
    {
      label: 'Committer GUIDE.md sur docs',
      done: (state) => branchFile(state, 'docs', 'docs/GUIDE.md') === '# Guide Nova',
    },
    {
      label: 'Revenir sur main avec le WIP intact',
      done: (state, ctx) => {
        const entry = ctx?.entry ?? initial;
        return (
          worktreePaths(state).includes('~/gitquest-docs') &&
          state.activeWorktree === 'main' &&
          workingFile(state, 'README.md') === '# Nova — WIP de documentation' &&
          branchUnchanged(state, entry, 'main')
        );
      },
    },
  ],
  takeaway:
    'Deux worktrees permettent de mener deux branches en parallèle sans stash ni commit temporaire.',
  difficulty: 2,
  par: 6,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(worktreePaths(state).includes('~/gitquest-docs'), 'Le worktree docs doit exister.'),
      check(
        branchFile(state, 'docs', 'docs/GUIDE.md') === '# Guide Nova',
        'La branche docs doit contenir GUIDE.md.',
      ),
      check(
        workingFile(state, 'README.md') === '# Nova — WIP de documentation',
        'Le WIP de README.md sur main doit rester intact.',
      ),
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(state.worktrees.main?.workingDir['docs/GUIDE.md'] === undefined, 'GUIDE.md ne doit pas apparaître dans le worktree principal.'),
      check(branchUnchanged(state, entry, 'main'), 'main ne doit pas bouger.'),
    );
  },
  hints: [
    'Crée un worktree sur la branche docs déjà existante, puis active-le avec cd.',
    'Dans le worktree docs, crée docs/GUIDE.md, indexe-le et commit.',
    'git worktree add ../gitquest-docs docs, cd ../gitquest-docs, edit docs/GUIDE.md "# Guide Nova", git add docs/GUIDE.md, git commit -m "docs: guide", cd ../gitquest.',
  ],
  solution: [
    'git worktree add ../gitquest-docs docs',
    'cd ../gitquest-docs',
    'edit docs/GUIDE.md "# Guide Nova"',
    'git add docs/GUIDE.md',
    'git commit -m "docs: guide"',
    'cd ../gitquest',
  ],
  successNote: 'Deux branches, deux espaces de travail, aucun stash et aucun commit croisé.',
};
