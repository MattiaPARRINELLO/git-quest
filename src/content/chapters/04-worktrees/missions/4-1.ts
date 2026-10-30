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

const initial = entryState('hotfix-worktree');

/** Le correctif est celui poussé par Yanis sur la branche hotfix. */
function hasFix(state: typeof initial): boolean {
  return (
    worktreePaths(state).includes('~/gitquest-hotfix') &&
    branchFile(state, 'hotfix', 'bug.txt') !== undefined &&
    branchFile(state, 'hotfix', 'bug.txt') !== branchFile(initial, 'main', 'bug.txt')
  );
}

export const mission41: Mission = {
  id: 'hotfix-worktree',
  chapterId: 'worktrees',
  order: 1,
  number: '4.1',
  title: 'Le bug de prod',
  story:
    "Tu es en pleine refonte sur feature, avec des modifications non commitées dans app.ts. Un bug critique tombe en prod, et main a aussi touché app.ts : impossible de basculer sans écraser ton WIP. Yanis a déjà poussé le correctif sur la branche hotfix ; à toi de monter un second espace de travail pour le vérifier sans lâcher ta refonte.",
  situation:
    'HEAD est sur feature avec app.ts modifié non commité ; le correctif attend sur la branche hotfix.',
  objective:
    'Monte un worktree hotfix depuis la branche hotfix, vérifie le correctif, puis reviens au worktree principal avec le WIP intact.',
  steps: [
    {
      label: 'Créer un worktree hotfix à partir de la branche hotfix',
      done: (state) => worktreePaths(state).includes('~/gitquest-hotfix'),
    },
    {
      label: 'Vérifier que le worktree contient le correctif',
      done: (state) => hasFix(state),
    },
    {
      label: 'Revenir au worktree principal avec le WIP intact',
      done: (state) =>
        worktreePaths(state).includes('~/gitquest-hotfix') &&
        state.activeWorktree === 'main' &&
        workingFile(state, 'app.ts') === "export const app = 'refonte WIP';",
    },
  ],
  takeaway:
    'Un worktree est un second bureau sur le même dépôt : HEAD, l’index et le disque y sont indépendants.',
  difficulty: 3,
  par: 3,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(
        worktreePaths(state).includes('~/gitquest-hotfix'),
        'Le worktree hotfix doit exister.',
      ),
      check(
        branchFile(state, 'hotfix', 'bug.txt') !== undefined &&
          branchFile(state, 'hotfix', 'bug.txt') !== branchFile(entry, 'main', 'bug.txt'),
        'Le correctif doit être présent sur hotfix.',
      ),
      check(branchUnchanged(state, entry, 'main'), 'main ne doit pas bouger.'),
      check(branchUnchanged(state, entry, 'feature'), 'feature ne doit pas bouger.'),
      check(
        workingFile(state, 'app.ts') === "export const app = 'refonte WIP';",
        'Le WIP de feature doit rester intact.',
      ),
      check(headBranch(state) === 'feature', 'Le worktree principal doit rester sur feature.'),
      check(state.activeWorktree === 'main', 'Le terminal doit revenir au worktree principal.'),
    );
  },
  hints: [
    'Essaie de passer sur main. Que dit Git ?',
    'Le correctif est déjà sur la branche hotfix : crée un worktree sur cette branche, pas sur main.',
    'git worktree add ../gitquest-hotfix hotfix, cd ../gitquest-hotfix, cat bug.txt, cd ../gitquest.',
  ],
  solution: [
    'git worktree add ../gitquest-hotfix hotfix',
    'cd ../gitquest-hotfix',
    'cd ../gitquest',
  ],
  forbidden: [
    {
      prefix: 'git stash',
      message:
        'Pas de stash ici : l’objectif est d’apprendre les worktrees. Ton WIP doit rester visible pendant l’intervention.',
    },
  ],
  successNote: 'Correctif vérifié, WIP intact, et aucune branche déplacée par accident.',
};
