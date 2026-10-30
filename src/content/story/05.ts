import type { ChainMission } from '../../story/chain';

const CONFIG_V5 = 'export const config = { retries: 5 };';
const README_FINAL = '# Nova — documentation finale';
const APP_V3 = "export const app = 'v3';";
const MAIN_V5 = 'export const main = { bootstrap: true, retries: 5 };';
const HEALTH = "export const health = () => 'ok';";

/** Chapitre 5 — raccourcis du quotidien : commit ciblé, switch -c, add global. */
export const chapter05Story: readonly ChainMission[] = [
  {
    missionId: 'commit-cible',
    prelude: [
      {
        id: 'm5.1-p1',
        commands: [
          `edit src/config.ts "${CONFIG_V5}"`,
          `edit README.md "${README_FINAL}"`,
          `edit app.ts "${APP_V3}"`,
        ],
      },
    ],
    slots: [
      {
        slotId: 'm5.1-c1',
        missionId: 'commit-cible',
        signature: { branch: 'main', files: { 'src/config.ts': CONFIG_V5 } },
      },
    ],
    reference: ['git commit -m "fix: retries 5" src/config.ts'],
  },
  {
    missionId: 'branche-en-une-commande',
    prelude: [],
    slots: [
      {
        slotId: 'm5.2-c1',
        missionId: 'branche-en-une-commande',
        signature: { branch: 'docs-final', files: { 'README.md': README_FINAL } },
      },
    ],
    reference: [
      'git switch -c docs-final',
      'git commit -m "docs: finale" README.md',
    ],
  },
  {
    missionId: 'tout-indexer',
    prelude: [
      {
        id: 'm5.3-p1',
        commands: [
          'git switch main',
          `edit app.ts "${APP_V3}"`,
          `edit src/config.ts "${CONFIG_V5}"`,
          `edit main.ts "${MAIN_V5}"`,
          `edit src/health.ts "${HEALTH}"`,
        ],
      },
    ],
    slots: [
      {
        slotId: 'm5.3-c1',
        missionId: 'tout-indexer',
        signature: {
          branch: 'main',
          files: {
            'app.ts': APP_V3,
            'src/config.ts': CONFIG_V5,
            'main.ts': MAIN_V5,
            'src/health.ts': HEALTH,
          },
        },
      },
    ],
    reference: ['git add .', 'git commit -m "chore: sprint 5"'],
  },
];
