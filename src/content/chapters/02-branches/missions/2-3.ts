import { Scenario, scenario } from '../../../../engine/scenario';
import {
  allOf,
  branchFile,
  branchTip,
  check,
  commitCount,
  hasBranch,
  headBranch,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const base = scenario()
  .init()
  .commit('Initial commit', {
    'README.md': '# Projet Nova',
    'src/app.ts': "export const app = 'nova';",
  })
  .branch('wip')
  .checkout('wip')
  .commit('wip: essai de cache', {
    'src/cache.ts': "export const cache = new Map();",
  })
  .checkout('main')
  .build();

const wipTip = base.branches.wip;
if (!wipTip) throw new Error('Contenu invalide : branche wip absente');

const initial = Scenario.from(base)
  .checkout(wipTip)
  .commit('exp: idée non référencée', {
    'exp.txt': 'expérience',
  })
  .checkout('main')
  .build();

const orphan = Object.values(initial.commits).find(
  (commit) => commit.message === 'exp: idée non référencée',
);
if (!orphan) throw new Error('Contenu invalide : commit orphelin absent');

export const mission23: Mission = {
  id: 'sauvetage',
  chapterId: 'branches',
  order: 3,
  number: '2.3',
  title: 'La branche de secours',
  story:
    "Une exploration rapide a laissé un commit expérimental en HEAD détaché. Revenu sur main, Git t'avertit : ce commit n'est plus relié à aucune branche. Avant qu'il ne disparaisse, crée une branche de secours dessus et nettoie l'ancienne branche wip devenue inutile.",
  objective: `Crée la branche sauvetage sur le commit ${orphan.hash.slice(0, 7)}, puis supprime wip.`,
  difficulty: 3,
  par: 2,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(
        branchTip(state, 'sauvetage') === orphan.hash,
        'sauvetage doit pointer sur le commit orphelin.',
      ),
      check(
        branchFile(state, 'sauvetage', 'exp.txt') === 'expérience',
        'sauvetage doit conserver le fichier expérimental.',
      ),
      check(!hasBranch(state, 'wip'), 'La branche wip doit être supprimée.'),
      check(commitCount(state) === 3, 'Aucun commit ne doit être créé.'),
    ),
  hints: [
    'git branch <nom> <hash> crée une branche sur un commit précis, sans déplacer HEAD.',
    'Supprimer wip demande -D si la branche n’est pas fusionnée dans HEAD.',
    `git branch sauvetage ${orphan.hash.slice(0, 7)}, puis git branch -D wip.`,
  ],
  solution: [`git branch sauvetage ${orphan.hash.slice(0, 7)}`, 'git branch -D wip'],
  successNote: 'Le commit expérimental est de nouveau référencé : plus aucun avertissement d’orphelin.',
};
