import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  branchFile,
  branchTip,
  check,
  hasBranch,
  headBranch,
  worktreePaths,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const initial = scenario()
  .init()
  .commit('Initial commit', {
    'README.md': '# Projet Nova',
    'src/app.ts': "export const app = 'nova';",
    'bug.txt': 'bug critique',
  })
  .branch('hotfix')
  .worktreeAdd('../gitquest-hotfix', { branch: 'hotfix' })
  .activate('../gitquest-hotfix')
  .commit('fix: bug critique', { 'bug.txt': 'corrigé' })
  .activate('../gitquest')
  .build();

const mainTip = initial.branches.main ?? '';
const hotfixTip = initial.branches.hotfix ?? '';

export const mission43: Mission = {
  id: 'menage-worktree',
  chapterId: 'worktrees',
  order: 3,
  number: '4.3',
  title: 'Ranger le chantier',
  story:
    "Le hotfix est livré, la branche hotfix reste utile pour l'historique, mais le worktree temporaire traîne sur le disque. Git refuse de supprimer un worktree sale ; celui-ci est propre, tu peux donc ranger sans risque.",
  objective: 'Supprime le worktree ~/gitquest-hotfix sans supprimer la branche hotfix.',
  difficulty: 2,
  par: 1,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(worktreePaths(state).length === 1, 'Il doit rester un seul worktree.'),
      check(
        !worktreePaths(state).includes('~/gitquest-hotfix'),
        'Le worktree temporaire doit être supprimé.',
      ),
      check(hasBranch(state, 'hotfix'), 'La branche hotfix doit survivre.'),
      check(branchTip(state, 'hotfix') === hotfixTip, 'La branche hotfix ne doit pas bouger.'),
      check(branchTip(state, 'main') === mainTip, 'main ne doit pas bouger.'),
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(branchFile(state, 'hotfix', 'bug.txt') === 'corrigé', 'Le correctif doit rester dans l’historique.'),
    ),
  hints: [
    'La commande de nettoyage est git worktree remove <chemin>.',
    'Le worktree est propre : aucun --force n’est nécessaire, et il n’est pas le worktree actif.',
    'git worktree remove ../gitquest-hotfix.',
  ],
  solution: ['git worktree remove ../gitquest-hotfix'],
  successNote: 'Le disque est propre, la branche et le correctif restent dans le dépôt.',
};
