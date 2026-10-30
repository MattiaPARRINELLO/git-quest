import { scenario } from '../../../../engine/scenario';
import {
  allOf,
  branchTip,
  check,
  headBranch,
  headFile,
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
  .commit('feat: notifications', {
    'src/notify.ts': "export const notify = (message: string) => message;",
  })
  .checkout('main')
  .commit('fix: configuration', {
    'src/config.ts': "export const config = { retries: 3 };",
  })
  .build();

export const mission32: Mission = {
  id: 'merge-commit',
  chapterId: 'merging',
  order: 2,
  number: '3.2',
  title: 'Le point de convergence',
  story:
    "Cette fois, main et feature ont toutes les deux avancé : la feature de notifications côtoie un correctif de configuration. Git doit créer un point de convergence qui relie les deux lignes, pas choisir un camp.",
  situation: 'main et feature ont divergé : notifications et configuration vivent séparément.',
  objective: 'Fusionne feature dans main et vérifie que le commit de fusion a deux parents.',
  steps: [
    {
      label: 'Créer un commit de fusion',
      done: (state) => {
        const tip = branchTip(state, 'main');
        const commit = tip === undefined ? undefined : state.commits[tip];
        return commit?.parents.length === 2;
      },
    },
    {
      label: 'Récupérer notify.ts sur main',
      done: (state) => headFile(state, 'src/notify.ts') !== undefined,
    },
    {
      label: 'Conserver config.ts après la fusion',
      done: (state) => {
        const tip = branchTip(state, 'main');
        const commit = tip === undefined ? undefined : state.commits[tip];
        return (
          commit?.parents.length === 2 &&
          commit.snapshot['src/config.ts'] !== undefined
        );
      },
    },
  ],
  takeaway:
    'Un merge commit a deux parents : il relie les deux lignes d’historique au lieu d’en choisir une.',
  difficulty: 2,
  par: 1,
  initialState: initial,
  validate: (state) => {
    const tip = branchTip(state, 'main');
    const commit = tip === undefined ? undefined : state.commits[tip];
    return allOf(
      check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
      check(commit !== undefined, 'main doit pointer sur un commit.'),
      check(commit?.parents.length === 2, 'Le commit de fusion doit avoir exactement deux parents.'),
      check(commit?.snapshot['src/notify.ts'] !== undefined, 'notify.ts doit être fusionné.'),
      check(commit?.snapshot['src/config.ts'] !== undefined, 'config.ts doit être conservé.'),
      check(
        headFile(state, 'src/notify.ts') !== undefined,
        'Le working dir doit contenir notify.ts après la fusion.',
      ),
    );
  },
  hints: [
    'Les deux branches divergent : Git ne peut pas seulement avancer.',
    'Un merge commit relie deux parents ; la commande reste git merge.',
    'git merge feature.',
  ],
  solution: ['git merge feature'],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-merge',
      question: 'Combien de parents aura le commit de fusion ?',
      options: [
        { id: 'zero', label: 'Aucun parent' },
        { id: 'one', label: 'Un parent' },
        { id: 'two', label: 'Deux parents' },
      ],
      correctOptionId: 'two',
      explanation:
        'Un merge commit relie les deux têtes d’historique : il a un parent côté main et un parent côté feature.',
    },
  ],
};
