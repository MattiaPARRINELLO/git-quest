import { entryState } from '../../../../story/checkpoints';
import {
  allOf,
  branchFile,
  branchTip,
  check,
  headBranch,
} from '../../../../engine/validate';
import { commitDelta } from '../../../../story/preconditions';
import type { Mission } from '../../../types';

const initial = entryState('qui-avance');

export const mission22: Mission = {
  id: 'qui-avance',
  chapterId: 'branches',
  order: 2,
  number: '2.2',
  title: 'Qui avance ?',
  story:
    "Tu es sur feature, et main pointe encore sur le même commit. Avant de livrer, l’équipe veut comprendre une règle simple : quand tu commites, quelle étiquette bouge ? Fais avancer feature, puis main de son côté pour créer deux lignes parallèles.",
  situation: 'main et feature pointent sur le même commit ; HEAD est sur feature.',
  objective:
    'Commite feature.ts sur feature, puis main.ts sur main, et laisse les deux branches diverger.',
  steps: [
    {
      label: 'Committer feature.ts sur feature',
      done: (state) => branchFile(state, 'feature', 'feature.ts') !== undefined,
    },
    {
      label: 'Basculer sur main',
      done: (state) => headBranch(state) === 'main',
    },
    {
      label: 'Committer main.ts sur main',
      done: (state) => branchFile(state, 'main', 'main.ts') !== undefined,
    },
    {
      label: 'Faire diverger main et feature',
      done: (state, ctx) => {
        const entry = ctx?.entry ?? initial;
        return (
          branchTip(state, 'main') !== branchTip(state, 'feature') &&
          commitDelta(state, entry) === 2
        );
      },
    },
  ],
  takeaway: 'Un commit ne déplace que la branche sur laquelle HEAD est attaché.',
  difficulty: 2,
  par: 5,
  initialState: initial,
  validate: (state, ctx) => {
    const entry = ctx?.entry ?? initial;
    return allOf(
      check(headBranch(state) === 'main', 'HEAD doit revenir sur main.'),
      check(branchFile(state, 'feature', 'feature.ts') !== undefined, 'feature doit contenir feature.ts.'),
      check(branchFile(state, 'main', 'main.ts') !== undefined, 'main doit contenir main.ts.'),
      check(branchFile(state, 'main', 'feature.ts') === undefined, 'main ne doit pas contenir feature.ts.'),
      check(
        branchTip(state, 'main') !== branchTip(state, 'feature'),
        'Les deux branches doivent avoir divergé.',
      ),
      check(
        branchTip(state, 'feature') !== branchTip(entry, 'feature'),
        'feature doit avoir avancé après son commit.',
      ),
      check(commitDelta(state, entry) === 2, 'Deux nouveaux commits sont attendus.'),
    );
  },
  hints: [
    'Un commit déplace uniquement l’étiquette de la branche sur laquelle HEAD est attaché.',
    'Les deux fichiers sont déjà écrits : commite feature.ts sur feature, puis main.ts sur main.',
    'git add feature.ts, git commit -m "feat: module feature", git switch main, git add main.ts, git commit -m "feat: module main".',
  ],
  solution: [
    'git add feature.ts',
    'git commit -m "feat: module feature"',
    'git switch main',
    'git add main.ts',
    'git commit -m "feat: module main"',
  ],
  predictions: [
    {
      trigger: (parsed, state) =>
        parsed.kind === 'git-commit' && headBranch(state) === 'feature',
      question: 'Quelle étiquette bouge après ce commit ?',
      options: [
        { id: 'main', label: 'main', target: { kind: 'branch', value: 'main' } },
        { id: 'feature', label: 'feature', target: { kind: 'branch', value: 'feature' } },
      ],
      correctOptionId: 'feature',
      explanation:
        'HEAD est attaché à feature : seul son pointeur avance. main reste sur le commit partagé.',
    },
  ],
};
