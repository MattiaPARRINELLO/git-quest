import { describe, expect, it } from 'vitest';
import { scenario } from '../../engine/scenario';
import {
  branchUnchanged,
  branchUnchangedSince,
  cleanWorkingTree,
  commitDelta,
  commitDeltaIs,
  commitsSince,
  evaluate,
  headOn,
  worktreesAre,
} from '../preconditions';
import { withSideCommits } from './helpers';

const base = scenario()
  .init()
  .commit('Initial commit', { 'README.md': 'v1' })
  .build();

describe('préconditions du story-repo', () => {
  it('commitsSince et commitDelta sont relatifs à l’entrée', () => {
    const shifted = withSideCommits(base, 2);
    expect(commitDelta(shifted, shifted)).toBe(0);
    expect(commitsSince(shifted, shifted)).toEqual([]);
    expect(commitDelta(shifted, base)).toBe(2);
    expect(commitsSince(shifted, base)).toHaveLength(2);

    const farther = withSideCommits(shifted, 1);
    expect(commitDelta(farther, shifted)).toBe(1);
    expect(commitsSince(farther, shifted)[0]?.message).toBe('chore: décalage 1');
  });

  it('branchUnchanged compare les tips, pas une valeur figée', () => {
    const shifted = withSideCommits(base, 1);
    expect(branchUnchanged(base, shifted, 'main')).toBe(true);
    expect(branchUnchangedSince('main', shifted)(base).ok).toBe(true);
  });

  it('évalue une liste et rend la première raison d’échec', () => {
    const result = evaluate(base, [
      headOn('main'),
      cleanWorkingTree(),
      worktreesAre(['~/gitquest']),
      commitDeltaIs(0, base),
    ]);
    expect(result.ok).toBe(true);

    const failed = evaluate(base, [headOn('main'), headOn('feature')]);
    expect(failed.ok).toBe(false);
    expect(failed.reason).toContain('feature');
  });

  it('commitDeltaIs échoue quand des commits ont été créés', () => {
    const after = withSideCommits(withSideCommits(base, 1), 1);
    const entry = withSideCommits(base, 1);
    expect(commitDeltaIs(0, entry)(after).ok).toBe(false);
    expect(commitDeltaIs(1, entry)(after).ok).toBe(true);
  });
});
