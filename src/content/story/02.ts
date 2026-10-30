import type { ChainMission } from '../../story/chain';

/** Chapitre 2 — branches, divergence, commit orphelin. */
export const chapter02Story: readonly ChainMission[] = [
  {
    missionId: 'branche-pointeur',
    prelude: [],
    slots: [
      {
        slotId: 'm2.1-c1',
        missionId: 'branche-pointeur',
        signature: { branch: 'experiment', present: ['notes.txt'] },
      },
    ],
    reference: [
      'git branch experiment',
      'git switch experiment',
      'edit notes.txt "notes de la branche"',
      'git add notes.txt',
      'git commit -m "feat: notes expérimentales"',
    ],
  },
  {
    missionId: 'qui-avance',
    prelude: [
      {
        id: 'm2.2-p1',
        commands: ['git switch main', 'git branch feature', 'git switch feature'],
      },
    ],
    slots: [
      {
        slotId: 'm2.2-c1',
        missionId: 'qui-avance',
        signature: { branch: 'feature', present: ['feature.ts'] },
      },
      {
        slotId: 'm2.2-c2',
        missionId: 'qui-avance',
        signature: { branch: 'main', present: ['main.ts'] },
      },
    ],
    reference: [
      'edit feature.ts "export const feature = true;"',
      'git add feature.ts',
      'git commit -m "feat: module feature"',
      'git switch main',
      'edit main.ts "export const main = true;"',
      'git add main.ts',
      'git commit -m "feat: module main"',
    ],
  },
  {
    missionId: 'commit-perdu',
    prelude: [],
    slots: [
      {
        slotId: 'm2.3-c1',
        missionId: 'commit-perdu',
        signature: { branch: null, present: ['exp.txt'] },
      },
    ],
    reference: [
      'git checkout {m1.1-c1}',
      'edit exp.txt "expérience"',
      'git add exp.txt',
      'git commit -m "exp: idée"',
      'git switch main',
      'git branch sauvetage {m2.3-c1}',
    ],
  },
];
