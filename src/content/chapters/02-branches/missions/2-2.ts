import { scenario } from '../../../../engine/scenario';
import {
  allOf,
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
  .commit('feat: API de facturation', {
    'src/billing.ts': "export const billing = 'v1';",
  })
  .branch('feature')
  .commit('fix: configuration', {
    'src/config.ts': "export const config = { retries: 2 };",
  })
  .build();

const target = Object.values(initial.commits)
  .sort((left, right) => left.timestamp - right.timestamp)[1];
if (!target) throw new Error('Contenu invalide : commit cible absent');
const targetShort = target.hash.slice(0, 7);
const mainTip = initial.branches.main ?? '';
const featureTip = initial.branches.feature ?? '';

export const mission22: Mission = {
  id: 'detachement',
  chapterId: 'branches',
  order: 2,
  number: '2.2',
  title: 'Sonder le passé',
  story:
    "Une régression est apparue après le commit qui a introduit l'API de facturation. Tu dois te placer exactement sur ce commit pour enquêter, puis garder ce point d'inspection dans une branche diagnostic — sans jamais déplacer main ni feature.",
  objective: `Bascule sur le commit ${targetShort}, puis crée la branche diagnostic sur ce commit.`,
  difficulty: 2,
  par: 2,
  initialState: initial,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'diagnostic', 'HEAD doit finir sur la branche diagnostic.'),
      check(
        branchTip(state, 'diagnostic') === target.hash,
        'diagnostic doit pointer sur le commit inspecté.',
      ),
      check(branchTip(state, 'main') === mainTip, 'main ne doit pas bouger.'),
      check(branchTip(state, 'feature') === featureTip, 'feature ne doit pas bouger.'),
      check(commitCount(state) === 3, 'Aucun commit ne doit être créé.'),
    ),
  hints: [
    'git checkout accepte un hash de commit : HEAD se détache alors de toute branche.',
    'Depuis un HEAD détaché, git switch -c crée une branche sur place et t’y rattache.',
    `git checkout ${targetShort}, puis git switch -c diagnostic.`,
  ],
  solution: [`git checkout ${targetShort}`, 'git switch -c diagnostic'],
  predictions: [
    {
      whenCommand: `git checkout ${targetShort}`,
      question: `Où sera HEAD après « git checkout ${targetShort} » ?`,
      options: [
        { id: 'main', label: 'Sur la branche main', target: { kind: 'branch', value: 'main' } },
        {
          id: 'detached',
          label: `Détaché sur le commit ${targetShort}`,
          target: { kind: 'commit', value: target.hash },
        },
        {
          id: 'feature',
          label: 'Sur la branche feature',
          target: { kind: 'branch', value: 'feature' },
        },
      ],
      correctOptionId: 'detached',
      explanation:
        'Un commit n’est pas une branche : HEAD se détache et pointe directement sur le commit. Aucune étiquette ne bouge.',
    },
  ],
};
