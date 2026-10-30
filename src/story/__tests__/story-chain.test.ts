import { describe, expect, it } from 'vitest';
import { findMission } from '../../content';
import { storyChain } from '../checkpoints';
import { STORY_SPECS } from '../specs';

const chain = storyChain();

describe('chaîne Nova (contenu réel)', () => {
  it('calcule les checkpoints sans état écrit à la main', () => {
    expect(chain.map((entry) => entry.missionId)).toEqual(
      STORY_SPECS.map((spec) => spec.missionId),
    );
    for (const entry of chain) {
      expect(entry.after).not.toBe(entry.entry);
      expect(entry.commands.length).toBeGreaterThan(0);
    }
  });

  it('expose un initialState identique au checkpoint calculé', () => {
    for (const entry of chain) {
      const mission = findMission(entry.missionId);
      expect(mission, `mission absente : ${entry.missionId}`).toBeDefined();
      expect(mission?.initialState).toBe(entry.entry);
    }
  });

  it('valide chaque mission depuis son entrée calculée', () => {
    for (const entry of chain) {
      const mission = findMission(entry.missionId);
      if (!mission) throw new Error(`mission absente : ${entry.missionId}`);
      expect(mission.validate(entry.entry, { entry: entry.entry }).ok).toBe(false);
      const result = mission.validate(entry.after, { entry: entry.entry });
      expect(result.ok, `${mission.number} : ${result.reason}`).toBe(true);
    }
  });

  it('la chaîne 1.x produit un arbre propre et cohérent', () => {
    const last = storyChain()[2];
    const tip = last?.after.branches.main ?? '';
    const snapshot = last?.after.commits[tip]?.snapshot ?? {};
    expect(snapshot['README.md']).toBe('version 2');
    expect(snapshot['notes.txt']).toBe('notes de réunion');
    expect(snapshot['app.ts']).toBe('v3');
  });

  it('produit l’arbre final attendu après les 12 missions', () => {
    const last = chain[chain.length - 1];
    if (!last) throw new Error('chaîne vide');
    expect(chain).toHaveLength(12);

    const branches = Object.keys(last.after.branches).sort();
    expect(branches).toEqual(['docs', 'feature', 'hotfix', 'main', 'sauvetage']);

    const worktreePaths = Object.values(last.after.worktrees)
      .map((worktree) => worktree.path)
      .sort();
    expect(worktreePaths).toEqual(['~/gitquest', '~/gitquest-docs']);

    const mainTip = last.after.branches.main ?? '';
    const snapshot = last.after.commits[mainTip]?.snapshot ?? {};
    expect(snapshot['src/export.ts']).toBeDefined();
    expect(snapshot['src/notify.ts']).toBeDefined();
    expect(snapshot['src/login.ts']).toBe('export const login = () => \'ok\';');
    expect(snapshot['bug.txt']).toBe('bug critique');
    expect(last.after.commits[last.after.branches.hotfix ?? '']?.snapshot['bug.txt']).toBe(
      'corrigé',
    );
  });
});
