import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  branchTip,
  check,
  commitCount,
  hasBranch,
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
  .checkout('feature')
  .commit('feat: thème sombre', {
    'src/theme.ts': "export const theme = 'dark';",
  })
  .checkout('main')
  .run('git merge feature')
  .build();

const mainTip = initial.branches.main ?? '';

export const mission33: Mission = {
  id: 'nettoyage-branche',
  chapterId: 'merging',
  order: 3,
  number: '3.3',
  title: 'Ranger après la fête',
  story:
    "Le thème sombre est déjà fusionné et déployé : feature pointe exactement sur le même commit que main. Le lead demande un nettoyage de fin de sprint, mais Git refuse de supprimer une branche sans vérifier qu'elle est bien fusionnée.",
  objective: 'Confirme que feature est à jour, puis supprime la branche feature.',
  difficulty: 2,
  par: 2,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(branchTip(state, 'main') === mainTip, 'main ne doit pas bouger.'),
      check(!hasBranch(state, 'feature'), 'La branche feature doit être supprimée.'),
      check(commitCount(state) === 2, 'Aucun commit ne doit être créé.'),
    ),
  hints: [
    'Fusionner une branche déjà contenue dans main ne crée rien : Git répond « Already up to date. ».',
    'git branch -d refuse de supprimer une branche non fusionnée, mais feature est fusionnée.',
    'git merge feature, puis git branch -d feature.',
  ],
  solution: ['git merge feature', 'git branch -d feature'],
};
