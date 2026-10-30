import {
  allOf,
  branchFile,
  branchTip,
  check,
  headBranch,
  isHeadDetached,
} from '../../../../engine/validate';
import type { Commit, RepoState } from '../../../../engine/types';
import { entryState, referenceCommands } from '../../../../story/checkpoints';
import { oldestHash } from '../../../../story/display';
import { branchUnchanged, commitDelta } from '../../../../story/preconditions';
import type { Mission } from '../../../types';

const initial = entryState('commit-perdu');

/**
 * Commit sauvé : créé pendant la mission (absent de l'entrée) et porteur du
 * fichier d'expérience. On ne compare jamais un hash figé.
 */
function rescuedCommit(state: RepoState, entry: RepoState): Commit | undefined {
  const tip = branchTip(state, 'sauvetage');
  if (tip === undefined) return undefined;
  const commit = state.commits[tip];
  if (commit === undefined) return undefined;
  if (entry.commits[tip] !== undefined) return undefined;
  return commit.snapshot['exp.txt'] !== undefined ? commit : undefined;
}

export const mission23: Mission = {
  id: 'commit-perdu',
  chapterId: 'branches',
  order: 3,
  number: '2.3',
  title: 'Le commit perdu',
  story:
    "Une régression est apparue dans l'API de facturation. Tu te détaches sur l'ancien commit pour enquêter, tu commites une expérience, puis tu reviens sur main. Git t'avertit alors que ce commit n'est plus relié à aucune branche : garde-le dans une branche de sauvetage avant qu'il ne disparaisse.",
  situation: 'HEAD est sur main ; aucune branche ne protège encore l’expérience à venir.',
  objective:
    'Détache-toi sur le commit de démarrage, commite exp.txt (contenu libre), reviens sur main, puis crée sauvetage sur le commit orphelin.',
  steps: [
    {
      label: 'Passer par un HEAD détaché sur l’ancien commit',
      done: (state, ctx) => {
        const entry = ctx?.entry ?? initial;
        return isHeadDetached(state) || commitDelta(state, entry) === 1;
      },
    },
    {
      label: 'Créer le commit expérimental',
      done: (state, ctx) => commitDelta(state, ctx?.entry ?? initial) === 1,
    },
    {
      label: 'Revenir sur main',
      done: (state, ctx) =>
        headBranch(state) === 'main' && commitDelta(state, ctx?.entry ?? initial) === 1,
    },
    {
      label: 'Créer sauvetage sur le commit orphelin',
      done: (state, ctx) => rescuedCommit(state, ctx?.entry ?? initial) !== undefined,
    },
  ],
  takeaway:
    'Un commit détaché n’appartient à aucune branche : il devient orphelin dès qu’on repart, sauf si on crée une étiquette dessus.',
  difficulty: 3,
  par: 5,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    const rescued = rescuedCommit(state, entry);
    return allOf(
      check(headBranch(state) === 'main', 'HEAD doit revenir sur main.'),
      check(rescued !== undefined, 'sauvetage doit pointer sur le commit expérimental.'),
      check(
        branchFile(state, 'sauvetage', 'exp.txt') !== undefined,
        'sauvetage doit conserver exp.txt.',
      ),
      check(branchUnchanged(state, entry, 'main'), 'main ne doit pas bouger.'),
      check(branchUnchanged(state, entry, 'feature'), 'feature ne doit pas bouger.'),
      check(commitDelta(state, entry) === 1, 'Un seul commit expérimental est attendu.'),
    );
  },
  hints: [
    'git checkout <hash> détache HEAD : le commit créé ici n’appartiendra à aucune branche.',
    'Après le retour sur main, Git liste le commit laissé derrière et propose git branch <nom> <hash>.',
    'git checkout {m1.1-c1}, git add exp.txt, git commit -m "exp: idée", git switch main, git branch sauvetage {m2.3-c1}.',
  ],
  get solution() {
    return referenceCommands('commit-perdu');
  },
  display: {
    objective:
      'Détache-toi sur {m1.1-c1}, commite exp.txt (contenu libre), reviens sur main, puis crée sauvetage sur le commit orphelin.',
    hints: [
      'git checkout <hash> détache HEAD : le commit créé ici n’appartiendra à aucune branche.',
      'Après le retour sur main, Git liste le commit laissé derrière et propose git branch <nom> <hash>.',
      'git checkout {m1.1-c1}, git add exp.txt, git commit -m "exp: idée", git switch main, git branch sauvetage {m2.3-c1}.',
    ],
    solution: [
      'git checkout {m1.1-c1}',
      'git add exp.txt',
      'git commit -m "exp: idée"',
      'git switch main',
      'git branch sauvetage {m2.3-c1}',
    ],
  },
  predictions: [
    {
      trigger: (parsed, state) =>
        parsed.kind === 'git-checkout' && state.branches[parsed.target] === undefined,
      question: 'Où sera HEAD après ce checkout ?',
      options: [
        { id: 'main', label: 'Sur la branche main', target: { kind: 'branch', value: 'main' } },
        { id: 'detached', label: 'Détaché sur ce commit' },
        { id: 'feature', label: 'Sur la branche feature', target: { kind: 'branch', value: 'feature' } },
      ],
      correctOptionId: 'detached',
      explanation:
        'checkout d’un hash détache HEAD sur le commit. Aucune étiquette ne bouge, et le prochain commit sera orphelin si tu repars sans branche.',
      resolve: (state) => {
        const oldest = oldestHash(state) ?? '';
        return {
          question: `Où sera HEAD après « git checkout ${oldest.slice(0, 7)} » ?`,
          options: [
            { id: 'main', label: 'Sur la branche main', target: { kind: 'branch', value: 'main' } },
            {
              id: 'detached',
              label: `Détaché sur le commit ${oldest.slice(0, 7)}`,
              target: { kind: 'commit', value: oldest },
            },
            { id: 'feature', label: 'Sur la branche feature', target: { kind: 'branch', value: 'feature' } },
          ],
        };
      },
    },
  ],
};
