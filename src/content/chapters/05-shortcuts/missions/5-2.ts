import {
  allOf,
  branchFile,
  check,
  hasBranch,
  headBranch,
} from '../../../../engine/validate';
import { entryState } from '../../../../story/checkpoints';
import { branchUnchanged, commitDelta } from '../../../../story/preconditions';
import type { Mission } from '../../../types';

const README_FINAL = '# Nova — documentation finale';

const initial = entryState('branche-en-une-commande');

export const mission52: Mission = {
  id: 'branche-en-une-commande',
  chapterId: 'shortcuts',
  order: 2,
  number: '5.2',
  title: 'Créer et rejoindre en une fois',
  story:
    'La documentation finale est prête sur le disque, mais elle ne doit pas atterrir sur main avant la relecture. L’équipe ouvre toujours une branche dédiée : cette fois, fais-le en une seule commande, puis commite le fichier seul.',
  situation:
    'README.md contient la documentation finale, non commitée ; la branche docs-final n’existe pas.',
  objective:
    'Crée la branche docs-final et bascule dessus en une commande, puis commite README.md sur cette branche.',
  steps: [
    {
      label: 'docs-final existe et HEAD est dessus',
      done: (state) => hasBranch(state, 'docs-final') && headBranch(state) === 'docs-final',
    },
    {
      label: 'README.md final est commité sur docs-final',
      done: (state) =>
        headBranch(state) === 'docs-final' &&
        branchFile(state, 'docs-final', 'README.md') === README_FINAL,
    },
    {
      label: 'main n’a pas bougé',
      done: (state, ctx) =>
        headBranch(state) === 'docs-final' &&
        branchUnchanged(state, ctx?.entry ?? initial, 'main'),
    },
  ],
  takeaway:
    'git switch -c <branche> crée la branche et rattache HEAD en une commande, au lieu de git branch puis git switch.',
  difficulty: 1,
  par: 2,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(hasBranch(state, 'docs-final'), 'La branche docs-final doit exister.'),
      check(headBranch(state) === 'docs-final', 'HEAD doit être sur docs-final.'),
      check(
        branchFile(state, 'docs-final', 'README.md') === README_FINAL,
        'docs-final doit contenir la documentation finale.',
      ),
      check(
        branchUnchanged(state, entry, 'main'),
        'main ne doit pas bouger : la doc n’est pas encore livrée.',
      ),
      check(commitDelta(state, entry) === 1, 'Un seul commit est attendu.'),
    );
  },
  hints: [
    'git branch docs-final crée la branche sans y aller ; il faudrait ensuite un git switch.',
    'L’option -c de git switch demande à créer la branche au passage.',
    'git switch -c docs-final, puis git commit -m "docs: finale" README.md.',
  ],
  solution: ['git switch -c docs-final', 'git commit -m "docs: finale" README.md'],
  predictions: [
    {
      trigger: (parsed) => parsed.kind === 'git-switch' && parsed.create,
      question: 'Que fait cette commande ?',
      options: [
        { id: 'deux', label: 'Elle crée docs-final et y rattache HEAD' },
        { id: 'une', label: 'Elle bascule seulement, la branche doit déjà exister' },
      ],
      correctOptionId: 'deux',
      explanation:
        '-c signifie « create » : la branche est créée sur le commit courant, puis HEAD s’y rattache.',
    },
  ],
  suggestedCommands: [
    'git status',
    'git branch',
    'git switch -c docs-final',
    'git commit -m "docs: finale" README.md',
  ],
};
