import { describe, expect, it } from 'vitest';
import { scenario } from '../../engine/scenario';
import { buildChain, entryOf, resolveTemplate, runReference } from '../chain';
import { applyPrelude } from '../chain';
import type { ChainMission } from '../chain';
import type { SlotDefinition } from '../types';

const root = scenario()
  .init()
  .commit('Initial commit', { 'README.md': 'v1', 'app.ts': 'v1' })
  .build();

const slots1: SlotDefinition[] = [
  {
    slotId: 'm1.s1',
    missionId: 'm1',
    signature: { branch: 'main', files: { 'app.ts': 'v2' } },
  },
];

const slots2: SlotDefinition[] = [
  {
    slotId: 'm2.s1',
    missionId: 'm2',
    signature: { branch: 'feature', files: { 'b.ts': 'B' } },
  },
];

const missions: ChainMission[] = [
  {
    missionId: 'm1',
    prelude: [{ id: 'p1', commands: ['edit app.ts "v2"'] }],
    slots: slots1,
    reference: ['git add app.ts', 'git commit -m "fix: app"'],
  },
  {
    missionId: 'm2',
    prelude: [
      { id: 'p2', commands: ['git branch feature'] },
      { id: 'p2b', commands: ['git switch feature'] },
    ],
    slots: slots2,
    reference: ['edit b.ts "B"', 'git add b.ts', 'git commit -m "feat: b"'],
  },
];

describe('chaîne de référence', () => {
  it('rejoue preludes et solutions et calcule les checkpoints', () => {
    const chain = buildChain(root, missions);
    expect(chain).toHaveLength(2);

    const first = entryOf(chain, 'm1');
    expect(first.worktrees.main?.workingDir['app.ts']).toBe('v2');
    expect(chain[0]?.after.commits[chain[0]?.after.branches.main ?? '']?.message).toBe('fix: app');

    const second = entryOf(chain, 'm2');
    expect(second.worktrees.main?.head).toEqual({ kind: 'branch', branch: 'feature' });
  });

  it('remplit la table des slots et résout les placeholders', () => {
    const chain = buildChain(root, missions);
    const table = chain[1]?.table ?? {};
    expect(table['m1.s1']?.commitHash).toBeDefined();
    expect(table['m2.s1']?.commitHash).toBeDefined();

    const entry = entryOf(chain, 'm2');
    const resolved = resolveTemplate(
      'git branch sauvetage {m1.s1}',
      entry,
      entry,
      table,
      [...slots1, ...slots2],
    );
    expect(resolved).toContain(table['m1.s1']?.commitHash);
  });

  it('applique une garde de prelude une seule fois', () => {
    const already = scenario().init().commit('Initial', { 'app.ts': 'v2' }).build();
    const applied = buildChain(already, [
      {
        missionId: 'm1',
        prelude: [
          {
            id: 'p1',
            when: (state) => state.commits[state.branches.main ?? '']?.snapshot['app.ts'] === 'v2',
            commands: ['edit app.ts "v2"'],
          },
        ],
        slots: [],
        reference: [],
      },
    ]);
    expect(applied[0]?.entry).toBe(already);
  });

  it('rejoue la référence avec des placeholders déjà résolus', () => {
    const chain = buildChain(root, missions);
    const entry = entryOf(chain, 'm1');
    // Placeholder fourni par la table précédente absente : résolution par contenu.
    const after = runReference(entry, ['git add app.ts', 'git commit -m "fix: app"'], {}, slots1);
    expect(after.commits[after.branches.main ?? '']?.message).toBe('fix: app');
  });

  it('attribue les commits de prelude au coéquipier', () => {
    const step = {
      id: 'p',
      teammate: 'lea' as const,
      commands: ['edit app.ts "v2"', 'git add app.ts', 'git commit -m "chore: app"'],
    };
    const chain = buildChain(root, [
      { missionId: 'm', prelude: [step], slots: [], reference: [] },
    ]);
    const entry = entryOf(chain, 'm');
    expect(entry.commits[entry.branches.main ?? '']?.author.name).toBe('Léa Moreau');
  });

  it('ne réapplique pas une étape dont la garde est vraie', () => {
    const step = {
      id: 'p',
      teammate: 'samir' as const,
      commands: ['edit app.ts "v2"', 'git add app.ts', 'git commit -m "chore: app"'],
    };
    const chain = buildChain(root, [
      { missionId: 'm', prelude: [step], slots: [], reference: [] },
    ]);
    const entry = entryOf(chain, 'm');

    const replayed = applyPrelude(entry, [
      {
        ...step,
        when: (state) => Object.values(state.commits).some((commit) => commit.message === 'chore: app'),
      },
    ]);
    expect(replayed).toBe(entry);
  });
});
