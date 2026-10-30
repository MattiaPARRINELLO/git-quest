import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  branchFile,
  branchTip,
  check,
  commitCount,
  headBranch,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const initial = scenario()
  .init()
  .commit('Initial commit', {
    'README.md': '# Projet Nova',
    'src/app.ts': "export const app = 'nova';",
  })
  .branch('feature')
  .build();

export const mission21: Mission = {
  id: 'deux-lignes',
  chapterId: 'branches',
  order: 1,
  number: '2.1',
  title: 'Deux lignes parallèles',
  story:
    "Nova prépare deux modules en parallèle : feature et main doivent avancer chacune de leur côté, sans se marcher dessus. À la fin, les deux lignes de travail doivent avoir divergé, et HEAD doit être revenue sur main.",
  objective: 'Fais avancer feature puis main sur des fichiers différents, et reviens sur main.',
  difficulty: 2,
  par: 8,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'main', 'HEAD doit revenir sur main.'),
      check(branchFile(state, 'feature', 'feature.ts') !== undefined, 'feature doit contenir feature.ts.'),
      check(branchFile(state, 'main', 'main.ts') !== undefined, 'main doit contenir main.ts.'),
      check(branchFile(state, 'main', 'feature.ts') === undefined, 'main ne doit pas contenir feature.ts.'),
      check(
        branchTip(state, 'main') !== branchTip(state, 'feature'),
        'Les deux branches doivent avoir divergé.',
      ),
      check(commitCount(state) === 3, 'Deux nouveaux commits sont attendus.'),
    ),
  hints: [
    'Commence par basculer sur feature, puis commit son module.',
    'Reviens sur main avant de créer main.ts : un commit ne doit pas atterrir sur la mauvaise branche.',
    'git switch feature, edit feature.ts "export const feature = true;", git add feature.ts, git commit -m "feat: module feature", git switch main, edit main.ts "export const main = true;", git add main.ts, git commit -m "feat: module main".',
  ],
  solution: [
    'git switch feature',
    'edit feature.ts "export const feature = true;"',
    'git add feature.ts',
    'git commit -m "feat: module feature"',
    'git switch main',
    'edit main.ts "export const main = true;"',
    'git add main.ts',
    'git commit -m "feat: module main"',
  ],
};
