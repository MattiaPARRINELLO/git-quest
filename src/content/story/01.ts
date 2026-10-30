import type { ChainMission } from '../../story/chain';

/** Chapitre 1 — Nova : index, snapshot, piège du `-am`. */
export const chapter01Story: readonly ChainMission[] = [
  {
    missionId: 'trois-zones',
    prelude: [
      {
        id: 'm1.1-p1',
        commands: [
          'edit a.txt "Nova — notes de conception : synchronisation locale + cache hors-ligne."',
          'edit b.txt "Nova — idées : mode sombre, export PDF, partage de notes."',
        ],
      },
    ],
    slots: [
      {
        slotId: 'm1.1-c1',
        missionId: 'trois-zones',
        signature: { branch: 'main', files: { 'a.txt': 'Nova — notes de conception : synchronisation locale + cache hors-ligne.' } },
      },
    ],
    reference: ['git add a.txt', 'git commit -m "fix: a.txt"'],
  },
  {
    missionId: 'snapshot-fige',
    prelude: [
      {
        id: 'm1.2-p1',
        teammate: 'lea',
        commands: ['git add b.txt', 'git commit -m "chore: b.txt v2"'],
      },
      {
        id: 'm1.2-p2',
        commands: ['edit app.ts "v2"', 'git add app.ts', 'edit app.ts "v3"'],
      },
    ],
    slots: [
      {
        slotId: 'm1.2-c1',
        missionId: 'snapshot-fige',
        signature: { branch: 'main', files: { 'app.ts': 'v2' } },
      },
    ],
    reference: ['git commit -m "docs: v2"'],
  },
  {
    missionId: 'piege-am',
    prelude: [
      {
        id: 'm1.3-p1',
        teammate: 'lea',
        when: (state) =>
          Object.values(state.commits).some((commit) => commit.message === 'chore: app.ts v3') ||
          state.branches.main !== undefined &&
            state.commits[state.branches.main]?.snapshot['app.ts'] === 'v3',
        commands: ['git add app.ts', 'git commit -m "chore: app.ts v3"'],
      },
      {
        id: 'm1.3-p2',
        teammate: 'samir',
        commands: [
          'edit README.md "# Nova — assistant de notes d’équipe."',
          'git add README.md',
          'git commit -m "docs: readme v1"',
        ],
      },
      {
        id: 'm1.3-p3',
        commands: ['edit README.md "# Nova — assistant de notes d’équipe. Démarrage : npm run dev."', 'edit notes.txt "Notes de réunion : cache LRU, export CSV, hotfix login."'],
      },
    ],
    slots: [
      {
        slotId: 'm1.3-c1',
        missionId: 'piege-am',
        signature: { branch: 'main', files: { 'README.md': '# Nova — assistant de notes d’équipe. Démarrage : npm run dev.' } },
      },
      {
        slotId: 'm1.3-c2',
        missionId: 'piege-am',
        signature: { branch: 'main', files: { 'notes.txt': 'Notes de réunion : cache LRU, export CSV, hotfix login.' } },
      },
    ],
    reference: [
      'git commit -am "docs: readme"',
      'git add notes.txt',
      'git commit -m "docs: notes"',
    ],
  },
];
