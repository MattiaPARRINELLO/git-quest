import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  branchFile,
  branchTip,
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
    'src/app.ts': "export const app = 'v1';",
    'bug.txt': 'bug critique',
  })
  .branch('feature')
  .checkout('feature')
  .commit('feat: refonte du panneau', {
    'src/app.ts': "export const app = 'refonte';",
  })
  .checkout('main')
  .commit('fix: configuration', {
    'src/app.ts': "export const app = 'v2 main';",
    'src/config.ts': "export const config = { retries: 3 };",
  })
  .checkout('feature')
  .write('src/app.ts', "export const app = 'refonte WIP';")
  .build();

const mainTip = initial.branches.main ?? '';
const featureTip = initial.branches.feature ?? '';

export const mission41: Mission = {
  id: 'hotfix-worktree',
  chapterId: 'worktrees',
  order: 1,
  number: '4.1',
  title: 'Le bug de prod',
  story:
    "Tu es en pleine refonte sur feature, avec des modifications non commitées dans src/app.ts. Un bug critique tombe en prod. Réflexe naturel : git switch main — mais Git refuse net, car main a aussi modifié src/app.ts et ton WIP serait écrasé. Un commit bricolé ou un stash ne sont pas acceptables : il te faut un second espace de travail relié au même dépôt.",
  objective:
    'Corrige bug.txt sur une branche hotfix dans un worktree séparé, sans toucher au WIP de feature.',
  difficulty: 3,
  par: 6,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(
        worktreePaths(state).includes('~/gitquest-hotfix'),
        'Le worktree hotfix doit exister.',
      ),
      check(
        branchFile(state, 'hotfix', 'bug.txt') === 'corrigé',
        'Le correctif doit être commité sur hotfix.',
      ),
      check(branchTip(state, 'main') === mainTip, 'main ne doit pas bouger.'),
      check(branchTip(state, 'feature') === featureTip, 'feature ne doit pas bouger.'),
      check(
        workingFile(state, 'src/app.ts') === "export const app = 'refonte WIP';",
        'Le WIP de feature doit rester intact.',
      ),
      check(headBranch(state) === 'feature', 'Le worktree principal doit rester sur feature.'),
      check(state.activeWorktree === 'main', 'Le terminal doit revenir au worktree principal.'),
    ),
  hints: [
    'Essaie de passer sur main. Que dit Git ?',
    'Crée un worktree sur une nouvelle branche hotfix à partir de main, sans toucher au worktree principal.',
    'git worktree add ../gitquest-hotfix -b hotfix main, cd ../gitquest-hotfix, edit bug.txt "corrigé", git add bug.txt, git commit -m "fix: bug critique", cd ../gitquest.',
  ],
  solution: [
    'git worktree add ../gitquest-hotfix -b hotfix main',
    'cd ../gitquest-hotfix',
    'edit bug.txt "corrigé"',
    'git add bug.txt',
    'git commit -m "fix: bug critique"',
    'cd ../gitquest',
  ],
  forbidden: [
    {
      prefix: 'git stash',
      message:
        'Pas de stash ici : l’objectif est d’apprendre les worktrees. Ton WIP doit rester visible pendant l’intervention.',
    },
  ],
  successNote: 'Prod corrigée, WIP intact, et aucune branche déplacée par accident.',
};
