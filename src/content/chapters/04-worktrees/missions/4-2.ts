import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  branchFile,
  check,
  headBranch,
  workingFile,
  worktreePaths,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const initial = scenario()
  .init()
  .commit('Initial commit', {
    'README.md': '# Projet Nova',
    'src/app.ts': "export const app = 'nova';",
  })
  .branch('docs')
  .write('README.md', '# Nova — WIP de documentation')
  .build();

const mainTip = initial.branches.main ?? '';

export const mission42: Mission = {
  id: 'deux-worktrees',
  chapterId: 'worktrees',
  order: 2,
  number: '4.2',
  title: 'Deux casquettes',
  story:
    "La doc de Nova doit être livrée pendant que tu réécris le README sur main. Impossible de tout faire dans le même working dir sans mélanger les deux chantiers. Monte un worktree dédié à la branche docs et avance dessus sans interrompre ton travail en cours.",
  objective: 'Ajoute GUIDE.md sur docs depuis un worktree séparé, sans commiter le WIP de main.',
  difficulty: 2,
  par: 6,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(worktreePaths(state).includes('~/gitquest-docs'), 'Le worktree docs doit exister.'),
      check(
        branchFile(state, 'docs', 'GUIDE.md') === '# Guide Nova',
        'La branche docs doit contenir GUIDE.md.',
      ),
      check(
        workingFile(state, 'README.md') === '# Nova — WIP de documentation',
        'Le WIP de README.md sur main doit rester intact.',
      ),
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(state.worktrees.main?.workingDir['GUIDE.md'] === undefined, 'GUIDE.md ne doit pas apparaître dans le worktree principal.'),
      check(state.branches.main === mainTip, 'main ne doit pas bouger.'),
    ),
  hints: [
    'Crée un worktree sur la branche docs déjà existante, puis active-le avec cd.',
    'Dans le worktree docs, crée GUIDE.md, indexe-le et commit.',
    'git worktree add ../gitquest-docs docs, cd ../gitquest-docs, edit GUIDE.md "# Guide Nova", git add GUIDE.md, git commit -m "docs: guide", cd ../gitquest.',
  ],
  solution: [
    'git worktree add ../gitquest-docs docs',
    'cd ../gitquest-docs',
    'edit GUIDE.md "# Guide Nova"',
    'git add GUIDE.md',
    'git commit -m "docs: guide"',
    'cd ../gitquest',
  ],
  successNote: 'Deux branches, deux espaces de travail, aucun stash et aucun commit croisé.',
};
