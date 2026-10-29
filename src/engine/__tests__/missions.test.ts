import { describe, expect, it } from 'vitest';
import { scenario } from '../scenario';
import type { RepoState } from '../types';
import {
  allOf,
  branchFile,
  branchTip,
  check,
  commitCount,
  headBranch,
  headFile,
  isHeadDetached,
  hasBranch,
  worktreePaths,
} from '../validate';
import type { ValidationResult } from '../validate';
import { basicRepo, emptyRepo, runAll } from './helpers';

interface PlannedMission {
  readonly name: string;
  readonly initial: RepoState;
  readonly solution: readonly string[];
  readonly validate: (state: RepoState) => ValidationResult;
}

function featureAheadRepo(): RepoState {
  return scenario()
    .init()
    .commit('Initial commit', { 'README.md': '# Projet', 'src/app.ts': 'v1' })
    .branch('feature')
    .checkout('feature')
    .commit('feat: notes', { 'notes.txt': 'notes de feature' })
    .checkout('main')
    .build();
}

function divergedRepo(): RepoState {
  return scenario()
    .init()
    .commit('Initial commit', { 'README.md': '# Projet', 'src/app.ts': 'v1' })
    .branch('feature')
    .checkout('feature')
    .commit('feat: notes', { 'notes.txt': 'notes de feature' })
    .checkout('main')
    .commit('feat: app', { 'src/app.ts': 'v2' })
    .build();
}

const basic = basicRepo();
const basicMain = basic.branches.main ?? '';

const missions: readonly PlannedMission[] = [
  // Chapitre 1 — Sous le capot
  {
    name: 'Ch.1 — photographier un fichier avec un premier commit',
    initial: emptyRepo(),
    solution: ['touch note.txt', 'git add note.txt', 'git commit -m "docs: note"'],
    validate: (state) =>
      allOf(
        check(hasBranch(state, 'main'), 'La branche main doit exister après le commit.'),
        check(commitCount(state) === 1, 'Il faut exactement un commit.'),
        check(headFile(state, 'note.txt') === '', 'note.txt doit être dans le snapshot.'),
      ),
  },
  {
    name: 'Ch.1 — une branche est un pointeur, pas une copie',
    initial: basic,
    solution: [
      'git branch feature',
      'git switch feature',
      'edit notes.txt "notes"',
      'git add notes.txt',
      'git commit -m "feat: notes"',
      'git switch main',
    ],
    validate: (state) =>
      allOf(
        check(headBranch(state) === 'main', 'HEAD doit revenir sur main.'),
        check(branchFile(state, 'feature', 'notes.txt') === 'notes', 'feature doit contenir notes.txt.'),
        check(headFile(state, 'notes.txt') === undefined, 'main ne doit pas contenir notes.txt.'),
        check(
          branchTip(state, 'main') !== branchTip(state, 'feature'),
          'Les deux branches doivent pointer sur des commits différents.',
        ),
      ),
  },
  {
    name: 'Ch.1 — HEAD détaché sur un commit',
    initial: basic,
    solution: [`git checkout ${basicMain}`],
    validate: (state) =>
      check(isHeadDetached(state), 'HEAD doit être détaché après git checkout <hash>.'),
  },

  // Chapitre 2 — Les branches
  {
    name: 'Ch.2 — créer une branche sans déplacer HEAD',
    initial: basic,
    solution: ['git branch feature', 'git switch feature'],
    validate: (state) =>
      allOf(
        check(headBranch(state) === 'feature', 'HEAD doit être sur feature.'),
        check(
          branchTip(state, 'feature') === branchTip(state, 'main'),
          'feature doit pointer sur le même commit que main.',
        ),
      ),
  },
  {
    name: 'Ch.2 — faire avancer feature sans toucher à main',
    initial: basic,
    solution: [
      'git switch -c feature',
      'edit notes.txt "travail"',
      'git add notes.txt',
      'git commit -m "feat: travail"',
    ],
    validate: (state) =>
      allOf(
        check(headBranch(state) === 'feature', 'HEAD doit rester sur feature.'),
        check(branchFile(state, 'feature', 'notes.txt') === 'travail', 'feature doit contenir le fichier.'),
        check(
          branchFile(state, 'main', 'notes.txt') === undefined,
          'main ne doit pas bouger.',
        ),
      ),
  },
  {
    name: 'Ch.2 — sortir du mode détaché',
    initial: basic,
    solution: [`git checkout ${basicMain}`, 'git switch main'],
    validate: (state) =>
      allOf(
        check(!isHeadDetached(state), 'HEAD ne doit plus être détaché.'),
        check(headBranch(state) === 'main', 'HEAD doit être rattaché à main.'),
      ),
  },

  // Chapitre 3 — Fusionner
  {
    name: 'Ch.3 — fast-forward : main rattrape feature',
    initial: featureAheadRepo(),
    solution: ['git merge feature'],
    validate: (state) =>
      allOf(
        check(
          branchTip(state, 'main') === branchTip(state, 'feature'),
          'main doit rejoindre feature.',
        ),
        check(commitCount(state) === 2, 'Aucun merge commit ne doit être créé en fast-forward.'),
        check(headFile(state, 'notes.txt') === 'notes de feature', 'notes.txt doit apparaître.'),
      ),
  },
  {
    name: 'Ch.3 — merge commit quand les historiques divergent',
    initial: divergedRepo(),
    solution: ['git merge feature'],
    validate: (state) => {
      const tip = branchTip(state, 'main');
      const commit = tip === undefined ? undefined : state.commits[tip];
      return allOf(
        check(commit !== undefined, 'main doit pointer sur un commit.'),
        check(commit?.parents.length === 2, 'Le merge commit doit avoir deux parents.'),
        check(commit?.snapshot['notes.txt'] === 'notes de feature', 'Le fichier de feature doit être fusionné.'),
        check(commit?.snapshot['src/app.ts'] === 'v2', 'Le travail de main doit être conservé.'),
      );
    },
  },
  {
    name: 'Ch.3 — ne rien faire quand tout est déjà à jour',
    initial: featureAheadRepo(),
    solution: ['git merge main'],
    validate: (state) =>
      allOf(
        check(headBranch(state) === 'main', 'HEAD doit rester sur main.'),
        check(commitCount(state) === 2, 'Aucun commit ne doit être créé.'),
      ),
  },

  // Chapitre 4 — Worktrees
  {
    name: 'Ch.4 — corriger la prod dans un worktree sans toucher au WIP',
    initial: scenario()
      .init()
      .commit('Initial commit', {
        'README.md': '# Projet',
        'src/app.ts': 'v1',
        'bug.txt': 'bug',
      })
      .branch('feature')
      .checkout('feature')
      .write('src/app.ts', 'wip feature')
      .build(),
    solution: [
      'git worktree add ../gitquest-hotfix -b hotfix main',
      'cd ../gitquest-hotfix',
      'edit bug.txt "corrigé"',
      'git add bug.txt',
      'git commit -m "fix: bug critique"',
      'cd ../gitquest',
    ],
    validate: (state) =>
      allOf(
        check(
          worktreePaths(state).includes('~/gitquest-hotfix'),
          'Le worktree hotfix doit exister.',
        ),
        check(branchFile(state, 'hotfix', 'bug.txt') === 'corrigé', 'Le correctif doit être commité sur hotfix.'),
        check(
          state.worktrees.main?.workingDir['src/app.ts'] === 'wip feature',
          'Le travail en cours sur feature doit rester intact.',
        ),
        check(
          branchFile(state, 'feature', 'src/app.ts') === 'v1',
          'feature ne doit pas contenir le correctif ni le WIP commité.',
        ),
        check(state.activeWorktree === 'main', 'Le terminal doit revenir au worktree principal.'),
      ),
  },
  {
    name: 'Ch.4 — travailler sur deux branches en parallèle',
    initial: basic,
    solution: [
      'git worktree add ../gitquest-feature -b feature',
      'cd ../gitquest-feature',
      'edit notes.txt "travail parallèle"',
      'git add notes.txt',
      'git commit -m "feat: parallèle"',
      'cd ../gitquest',
    ],
    validate: (state) =>
      allOf(
        check(worktreePaths(state).length === 2, 'Deux worktrees sont attendus.'),
        check(branchFile(state, 'feature', 'notes.txt') === 'travail parallèle', 'feature doit être commitée.'),
        check(headBranch(state) === 'main', 'Le worktree principal doit rester sur main.'),
        check(state.worktrees.main?.workingDir['notes.txt'] === undefined, 'Le working dir de main doit rester intact.'),
      ),
  },
  {
    name: 'Ch.4 — supprimer un worktree propre sans perdre la branche',
    initial: runAll(basic, [
      'git branch feature',
      'git worktree add ../gitquest-feature feature',
    ]),
    solution: ['git worktree remove ../gitquest-feature'],
    validate: (state) =>
      allOf(
        check(worktreePaths(state).length === 1, 'Le worktree doit être supprimé.'),
        check(hasBranch(state, 'feature'), 'La branche feature doit survivre.'),
      ),
  },
];

describe('missions planifiées (spec-first)', () => {
  for (const mission of missions) {
    it(mission.name, () => {
      const finalState = runAll(mission.initial, mission.solution);
      const result = mission.validate(finalState);
      expect(result.ok, result.reason).toBe(true);
    });
  }
});
