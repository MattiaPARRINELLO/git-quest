import type { ChainMission } from '../../story/chain';

/** Chapitre 3 — fast-forward, merge commit, ménage de branches. */
export const chapter03Story: readonly ChainMission[] = [
  {
    missionId: 'avance-rapide',
    prelude: [
      {
        id: 'm3.1-p1',
        teammate: 'ines',
        when: (state) =>
          Object.values(state.commits).some((commit) => commit.parents.length === 2),
        commands: ['git merge feature'],
      },
      {
        id: 'm3.1-p2',
        teammate: 'ines',
        commands: [
          'git branch -D feature',
          'git branch feature',
          'git switch feature',
          'edit src/export.ts "export const exportCsv = () => \'csv\';"',
          'git add src/export.ts',
          'git commit -m "feat: export CSV"',
          'git switch main',
        ],
      },
    ],
    slots: [
      {
        slotId: 'm3.1-p2',
        missionId: 'avance-rapide',
        signature: { branch: 'feature', files: { 'src/export.ts': "export const exportCsv = () => 'csv';" } },
      },
    ],
    reference: ['git merge feature'],
  },
  {
    missionId: 'merge-commit',
    prelude: [
      {
        id: 'm3.2-p1',
        teammate: 'ines',
        commands: [
          'git switch feature',
          'edit src/notify.ts "export const notify = (message: string) => message;"',
          'git add src/notify.ts',
          'git commit -m "feat: notifications"',
          'git switch main',
        ],
      },
      {
        id: 'm3.2-p2',
        teammate: 'lea',
        commands: [
          'edit src/config.ts "export const config = { retries: 3 };"',
          'git add src/config.ts',
          'git commit -m "fix: configuration"',
        ],
      },
    ],
    slots: [
      {
        slotId: 'm3.2-p1',
        missionId: 'merge-commit',
        signature: { branch: 'feature', files: { 'src/notify.ts': 'export const notify = (message: string) => message;' } },
      },
      {
        slotId: 'm3.2-p2',
        missionId: 'merge-commit',
        signature: { branch: 'main', files: { 'src/config.ts': 'export const config = { retries: 3 };' } },
      },
      {
        slotId: 'm3.2-c1',
        missionId: 'merge-commit',
        signature: { branch: 'main', files: { 'src/notify.ts': 'export const notify = (message: string) => message;' } },
      },
    ],
    reference: ['git merge feature'],
  },
  {
    missionId: 'menage-branches',
    prelude: [
      {
        id: 'm3.3-p1',
        teammate: 'ines',
        commands: [
          'git branch feature-login',
          'git switch feature-login',
          'edit src/login.ts "export const login = () => \'ok\';"',
          'git add src/login.ts',
          'git commit -m "feat: formulaire de connexion"',
          'git switch main',
          'git merge feature-login',
        ],
      },
      {
        id: 'm3.3-p2',
        teammate: 'ines',
        commands: [
          'git branch -D experiment',
          'git branch experiment',
          'git switch experiment',
          'edit exp.txt "expérience"',
          'git add exp.txt',
          'git commit -m "exp: test de cache"',
          'git switch main',
        ],
      },
    ],
    slots: [
      {
        slotId: 'm3.3-p1',
        missionId: 'menage-branches',
        signature: { branch: 'feature-login', files: { 'src/login.ts': "export const login = () => 'ok';" } },
      },
      {
        slotId: 'm3.3-p2',
        missionId: 'menage-branches',
        signature: { branch: 'experiment', files: { 'exp.txt': 'expérience' } },
      },
    ],
    reference: [
      'git branch -d feature-login',
      'git merge experiment',
      'git branch -d experiment',
    ],
  },
];
