import { Scenario, scenario } from '../../../../engine/scenario';
import {
  allOf,
  branchFile,
  branchTip,
  check,
  commitCount,
  headBranch,
  isHeadDetached,
} from '../../../../engine/validate';
import type { Mission } from '../../../types';

const base = scenario()
  .init()
  .commit('Initial commit', {
    'README.md': '# Projet Nova',
    'src/app.ts': "export const app = 'nova';",
  })
  .commit('feat: API de facturation', {
    'src/billing.ts': "export const billing = 'v1';",
  })
  .branch('feature')
  .checkout('main')
  .build();

const oldest = Object.values(base.commits).sort(
  (left, right) => left.timestamp - right.timestamp,
)[0];
if (!oldest) throw new Error('Contenu invalide : commit racine absent');

const simulated = Scenario.from(base)
  .checkout(oldest.hash)
  .commit('exp: idée', { 'exp.txt': 'expérience' })
  .build();
const orphan = Object.values(simulated.commits).find(
  (commit) => commit.message === 'exp: idée',
);
if (!orphan) throw new Error('Contenu invalide : commit orphelin absent');

const mainTip = base.branches.main ?? '';
const featureTip = base.branches.feature ?? '';
const initialCount = Object.keys(base.commits).length;
const oldShort = oldest.hash.slice(0, 7);
const orphanShort = orphan.hash.slice(0, 7);

export const mission23: Mission = {
  id: 'commit-perdu',
  chapterId: 'branches',
  order: 3,
  number: '2.3',
  title: 'Le commit perdu',
  story:
    "Une régression est apparue dans l'API de facturation. Tu te détaches sur l'ancien commit pour enquêter, tu commites une expérience, puis tu reviens sur main. Git t'avertit alors que ce commit n'est plus relié à aucune branche : garde-le dans une branche de sauvetage avant qu'il ne disparaisse.",
  situation: 'HEAD est sur main ; aucune branche ne protège encore l’expérience à venir.',
  objective: `Détache-toi sur ${oldShort}, commite exp.txt, reviens sur main, puis crée sauvetage sur le commit orphelin.`,
  steps: [
    {
      label: 'Passer par un HEAD détaché sur l’ancien commit',
      done: (state) =>
        isHeadDetached(state) || commitCount(state) === initialCount + 1,
    },
    {
      label: 'Créer le commit expérimental',
      done: (state) => commitCount(state) === initialCount + 1,
    },
    {
      label: 'Revenir sur main',
      done: (state) =>
        headBranch(state) === 'main' && commitCount(state) === initialCount + 1,
    },
    {
      label: 'Créer sauvetage sur le commit orphelin',
      done: (state) => branchTip(state, 'sauvetage') === orphan.hash,
    },
  ],
  takeaway:
    'Un commit détaché n’appartient à aucune branche : il devient orphelin dès qu’on repart, sauf si on crée une étiquette dessus.',
  difficulty: 3,
  par: 6,
  initialState: base,
  validate: (state) =>
    allOf(
      check(headBranch(state) === 'main', 'HEAD doit revenir sur main.'),
      check(
        branchTip(state, 'sauvetage') === orphan.hash,
        'sauvetage doit pointer sur le commit expérimental.',
      ),
      check(
        branchFile(state, 'sauvetage', 'exp.txt') === 'expérience',
        'sauvetage doit conserver exp.txt.',
      ),
      check(branchTip(state, 'main') === mainTip, 'main ne doit pas bouger.'),
      check(branchTip(state, 'feature') === featureTip, 'feature ne doit pas bouger.'),
      check(commitCount(state) === initialCount + 1, 'Un seul commit expérimental est attendu.'),
    ),
  hints: [
    'git checkout <hash> détache HEAD : le commit créé ici n’appartiendra à aucune branche.',
    'Après le retour sur main, Git liste le commit laissé derrière et propose git branch <nom> <hash>.',
    `git checkout ${oldShort}, edit exp.txt "expérience", git add exp.txt, git commit -m "exp: idée", git switch main, git branch sauvetage ${orphanShort}.`,
  ],
  solution: [
    `git checkout ${oldShort}`,
    'edit exp.txt "expérience"',
    'git add exp.txt',
    'git commit -m "exp: idée"',
    'git switch main',
    `git branch sauvetage ${orphanShort}`,
  ],
  predictions: [
    {
      trigger: (parsed, state) =>
        parsed.kind === 'git-checkout' &&
        state.branches[parsed.target] === undefined,
      question: `Où sera HEAD après « git checkout ${oldShort} » ?`,
      options: [
        { id: 'main', label: 'Sur la branche main', target: { kind: 'branch', value: 'main' } },
        {
          id: 'detached',
          label: `Détaché sur le commit ${oldShort}`,
          target: { kind: 'commit', value: oldest.hash },
        },
        { id: 'feature', label: 'Sur la branche feature', target: { kind: 'branch', value: 'feature' } },
      ],
      correctOptionId: 'detached',
      explanation:
        'checkout d’un hash détache HEAD sur le commit. Aucune étiquette ne bouge, et le prochain commit sera orphelin si tu repars sans branche.',
    },
  ],
};
