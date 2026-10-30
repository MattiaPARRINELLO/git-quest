import {
  allOf,
  branchFile,
  check,
  hasBranch,
  headBranch,
  worktreePaths,
} from '../../../../engine/validate';
import { entryState } from '../../../../story/checkpoints';
import { branchUnchanged } from '../../../../story/preconditions';
import type { Mission } from '../../../types';

const initial = entryState('menage-worktree');

export const mission43: Mission = {
  id: 'menage-worktree',
  chapterId: 'worktrees',
  order: 3,
  number: '4.3',
  title: 'Ranger le chantier',
  story:
    "Le hotfix est livré, la branche hotfix reste utile pour l'historique, mais le worktree temporaire traîne sur le disque. Git refuse de supprimer un worktree sale ; celui-ci est propre, tu peux donc ranger sans risque.",
  situation:
    'Le worktree ~/gitquest-hotfix existe encore ; la branche hotfix contient le correctif livré.',
  objective: 'Supprime le worktree ~/gitquest-hotfix sans supprimer la branche hotfix.',
  steps: [
    {
      label: 'Supprimer le worktree hotfix',
      done: (state) => !worktreePaths(state).includes('~/gitquest-hotfix'),
    },
    {
      label: 'Conserver la branche hotfix',
      done: (state) =>
        !worktreePaths(state).includes('~/gitquest-hotfix') && hasBranch(state, 'hotfix'),
    },
    {
      label: 'Conserver le correctif dans l’historique',
      done: (state) =>
        !worktreePaths(state).includes('~/gitquest-hotfix') &&
        branchFile(state, 'hotfix', 'bug.txt') !== undefined && branchFile(state, 'hotfix', 'bug.txt') !== branchFile(initial, 'main', 'bug.txt'),
    },
  ],
  takeaway:
    'Supprimer un worktree ne supprime pas la branche : l’historique et les commits restent dans le dépôt.',
  difficulty: 2,
  par: 1,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(
        !worktreePaths(state).includes('~/gitquest-hotfix'),
        'Le worktree temporaire doit être supprimé.',
      ),
      check(hasBranch(state, 'hotfix'), 'La branche hotfix doit survivre.'),
      check(branchUnchanged(state, entry, 'hotfix'), 'La branche hotfix ne doit pas bouger.'),
      check(branchUnchanged(state, entry, 'main'), 'main ne doit pas bouger.'),
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(
        branchFile(state, 'hotfix', 'bug.txt') !== undefined &&
          branchFile(state, 'hotfix', 'bug.txt') !== branchFile(entry, 'main', 'bug.txt'),
        'Le correctif doit rester dans l’historique.',
      ),
    );
  },
  hints: [
    'La commande de nettoyage est git worktree remove <chemin>.',
    'Le worktree est propre : aucun --force n’est nécessaire, et il n’est pas le worktree actif.',
    'git worktree remove ../gitquest-hotfix.',
  ],
  solution: ['git worktree remove ../gitquest-hotfix'],
  successNote: 'Le disque est propre, la branche et le correctif restent dans le dépôt.',
};
