import type { ChainMission } from '../../story/chain';

const TEAM_NOTIFY = "export const notify = (message: string) => 'Nova: ' + message;";
const TEAM_PREFIX = "export const notify = (message: string) => '[Nova] ' + message;";
const LOCAL_NOTIFY = 'export const notify = (message: string) => message.trim();';
const MERGED_NOTIFY =
  "export const notify = (message: string) => '[Nova] ' + message.trim();";

/**
 * Chapitre 6 — collaboration : remote, push, pull.
 * Un coéquipier est simulé en poussant une branche temporaire sur `main` du
 * remote (`git push origin equipe:main`), puis en revenant sur `main`.
 */
export const chapter06Story: readonly ChainMission[] = [
  {
    missionId: 'premier-push',
    prelude: [],
    slots: [],
    reference: [
      'git remote add origin git@github.com:nova/nova.git',
      'git push -u origin main',
    ],
  },
  {
    missionId: 'pull-equipe',
    prelude: [
      {
        id: 'm6.2-p1',
        teammate: 'lea',
        commands: [
          'git branch equipe',
          'git switch equipe',
          `edit src/notify.ts "${TEAM_NOTIFY}"`,
          'git add src/notify.ts',
          'git commit -m "feat: préfixe notifications"',
          'git push origin equipe:main',
          'git switch main',
          'git branch -D equipe',
        ],
      },
    ],
    slots: [],
    reference: ['git pull'],
  },
  {
    missionId: 'conflit-de-pull',
    prelude: [
      {
        id: 'm6.3-p1',
        teammate: 'lea',
        commands: [
          'git branch equipe',
          'git switch equipe',
          `edit src/notify.ts "${TEAM_PREFIX}"`,
          'git add src/notify.ts',
          'git commit -m "feat: préfixe équipe"',
          'git push origin equipe:main',
          'git switch main',
          'git branch -D equipe',
        ],
      },
      {
        id: 'm6.3-p2',
        commands: [
          `edit src/notify.ts "${LOCAL_NOTIFY}"`,
          'git add src/notify.ts',
          'git commit -m "feat: nettoyage notifications"',
        ],
      },
    ],
    slots: [
      {
        slotId: 'm6.3-c1',
        missionId: 'conflit-de-pull',
        signature: { branch: 'main', files: { 'src/notify.ts': MERGED_NOTIFY } },
      },
    ],
    reference: [
      'git pull',
      `edit src/notify.ts "${MERGED_NOTIFY}"`,
      'git add src/notify.ts',
      'git merge --continue',
    ],
  },
];
