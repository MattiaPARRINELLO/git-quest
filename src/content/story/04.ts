import type { ChainMission } from '../../story/chain';

/** Chapitre 4 — worktrees, WIP et ménage. */
export const chapter04Story: readonly ChainMission[] = [
  {
    missionId: 'hotfix-worktree',
    prelude: [
      {
        id: 'm4.1-p1',
        teammate: 'yanis',
        commands: [
          'git branch -D feature',
          'git branch feature',
          'git switch feature',
          'edit app.ts "export const app = \'refonte\';"',
          'git add app.ts',
          'git commit -m "feat: refonte du panneau"',
          'git switch main',
          'edit app.ts "export const app = \'v2 main\';"',
          'git add app.ts',
          'git commit -m "fix: configuration"',
          'git switch feature',
        ],
      },
      {
        id: 'm4.1-p2',
        commands: ['edit app.ts "export const app = \'refonte WIP\';"'],
      },
    ],
    slots: [
      {
        slotId: 'm4.1-p1',
        missionId: 'hotfix-worktree',
        signature: { branch: 'feature', files: { 'app.ts': "export const app = 'refonte';" } },
      },
      {
        slotId: 'm4.1-p2',
        missionId: 'hotfix-worktree',
        signature: { branch: 'main', files: { 'app.ts': "export const app = 'v2 main';" } },
      },
      {
        slotId: 'm4.1-c1',
        missionId: 'hotfix-worktree',
        signature: { branch: 'hotfix', present: ['bug.txt'] },
      },
    ],
    reference: [
      'git worktree add ../gitquest-hotfix -b hotfix main',
      'cd ../gitquest-hotfix',
      'edit bug.txt "export function login(req) { if (!req.user) return null; return db.find(req.user); }"',
      'git add bug.txt',
      'git commit -m "fix: bug critique"',
      'cd ../gitquest',
    ],
  },
  {
    missionId: 'deux-worktrees',
    prelude: [
      {
        id: 'm4.2-p1',
        teammate: 'yanis',
        commands: [
          'git add app.ts',
          'git commit -m "wip: refonte UI (reprise)"',
          'git switch main',
          'git branch docs',
          'edit README.md "# Nova — brouillon de documentation"',
        ],
      },
    ],
    slots: [
      {
        slotId: 'm4.2-p1',
        missionId: 'deux-worktrees',
        signature: { branch: 'feature', files: { 'app.ts': "export const app = 'refonte WIP';" } },
      },
      {
        slotId: 'm4.2-c1',
        missionId: 'deux-worktrees',
        signature: { branch: 'docs', present: ['docs/GUIDE.md'] },
      },
    ],
    reference: [
      'git worktree add ../gitquest-docs docs',
      'cd ../gitquest-docs',
      'edit docs/GUIDE.md "# Guide Nova — démarrer, configurer, déployer"',
      'git add docs/GUIDE.md',
      'git commit -m "docs: guide"',
      'cd ../gitquest',
    ],
  },
  {
    missionId: 'menage-worktree',
    prelude: [
      {
        id: 'm4.3-p1',
        teammate: 'samir',
        commands: ['git add README.md', 'git commit -m "docs: readme final"'],
      },
    ],
    slots: [
      {
        slotId: 'm4.3-p1',
        missionId: 'menage-worktree',
        signature: { branch: 'main', files: { 'README.md': '# Nova — WIP de documentation' } },
      },
    ],
    reference: ['git worktree remove ../gitquest-hotfix'],
  },
];
