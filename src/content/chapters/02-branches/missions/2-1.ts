import {
  allOf,
  check,
  hasBranch,
  headBranch,
  headFile,
} from '../../../../engine/validate';
import type { Commit, RepoState } from '../../../../engine/types';
import { entryState } from '../../../../story/checkpoints';
import { branchUnchanged, commitDelta, commitsSince } from '../../../../story/preconditions';
import { changeSetOf } from '../../../../story/slots';
import type { Mission } from '../../../types';

const initial = entryState('branche-pointeur');

/**
 * Commit créé sur `experiment` qui introduit ou modifie notes.txt.
 * La simple présence du fichier ne suffit pas : il existe déjà sur main depuis
 * le chapitre 1, donc une branche créée sans commit ne doit rien valider.
 */
function notesCommit(state: RepoState, entry: RepoState): Commit | undefined {
  return commitsSince(state, entry).find(
    (commit) =>
      commit.branch === 'experiment' &&
      changeSetOf(state, commit).some(
        (change) => change.path === 'notes.txt' && change.content !== null,
      ),
  );
}

export const mission21: Mission = {
  id: 'branche-pointeur',
  chapterId: 'branches',
  order: 1,
  number: '2.1',
  title: 'Le pointeur fantôme',
  story:
    "L'équipe veut tester une idée de notes internes sans polluer main. Tu crées une branche experiment, tu y travailles, puis tu vérifies que main n'a pas bougé d'un millimètre. Une branche n'est qu'une étiquette : c'est le moment de le prouver.",
  situation: 'HEAD est sur main ; la branche experiment n’existe pas encore.',
  objective: 'Crée la branche experiment, commite notes.txt dessus (le contenu est libre), et laisse main intacte.',
  steps: [
    { label: 'Créer la branche experiment', done: (state) => hasBranch(state, 'experiment') },
    {
      label: 'Committer notes.txt sur experiment',
      done: (state, ctx) => notesCommit(state, ctx?.entry ?? initial) !== undefined,
    },
    {
      label: 'Terminer sur experiment avec main inchangée',
      done: (state, ctx) => {
        const entry = ctx?.entry ?? initial;
        return headBranch(state) === 'experiment' && branchUnchanged(state, entry, 'main');
      },
    },
  ],
  takeaway: 'Une branche est un pointeur : seule l’étiquette de HEAD avance au commit.',
  difficulty: 2,
  par: 5,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(headBranch(state) === 'experiment', 'HEAD doit être sur experiment.'),
      check(
        notesCommit(state, entry) !== undefined,
        'Un nouveau commit sur experiment doit modifier notes.txt.',
      ),
      check(branchUnchanged(state, entry, 'main'), 'main ne doit pas bouger.'),
      check(
        headFile(state, 'notes.txt') !== undefined,
        'Le HEAD de experiment doit voir notes.txt.',
      ),
      check(commitDelta(state, entry) === 1, 'Un seul nouveau commit est attendu.'),
    );
  },
  hints: [
    'Créer une branche ne change pas HEAD : il faut ensuite y basculer.',
    'Après le switch, crée notes.txt (n’importe quel contenu), indexe-le, puis commit.',
    'git branch experiment, git switch experiment, edit notes.txt "mes notes", git add notes.txt, git commit -m "feat: notes expérimentales".',
  ],
  solution: [
    'git branch experiment',
    'git switch experiment',
    'edit notes.txt "notes de la branche"',
    'git add notes.txt',
    'git commit -m "feat: notes expérimentales"',
  ],
  predictions: [
    {
      trigger: (parsed) =>
        (parsed.kind === 'git-switch' &&
          !parsed.create &&
          parsed.branch === 'experiment') ||
        (parsed.kind === 'git-checkout' && parsed.target === 'experiment'),
      question: 'Après ce changement de branche, où sera HEAD ?',
      options: [
        { id: 'main', label: 'Sur la branche main', target: { kind: 'branch', value: 'main' } },
        {
          id: 'experiment',
          label: 'Sur la branche experiment',
          target: { kind: 'branch', value: 'experiment' },
        },
        {
          id: 'detached',
          label: 'Détaché sur un commit',
        },
      ],
      correctOptionId: 'experiment',
      explanation:
        'switch et checkout de branche rattachent HEAD à l’étiquette : experiment, même si elle pointe encore sur le commit de main.',
      resolve: (state) => {
        const tip = state.branches.main ?? '';
        return {
          options: [
            { id: 'main', label: 'Sur la branche main', target: { kind: 'branch', value: 'main' } },
            {
              id: 'experiment',
              label: 'Sur la branche experiment',
              target: { kind: 'branch', value: 'experiment' },
            },
            {
              id: 'detached',
              label: `Détaché sur le commit ${tip.slice(0, 7)}`,
              target: { kind: 'commit', value: tip },
            },
          ],
        };
      },
    },
  ],
};
