import { DEFAULT_AUTHOR, hashFor, timestampFor } from '../../engine/hashes';
import type { RepoState } from '../../engine/types';

/**
 * Ajoute `count` commits sur une branche latérale `decalage`, sans toucher à
 * `main`, au working dir ni aux worktrees. Sert à simuler un joueur qui arrive
 * sur une mission avec des commits en plus.
 */
export function withSideCommits(state: RepoState, count: number): RepoState {
  const baseTip = state.branches.main;
  const baseSnapshot = baseTip === undefined ? {} : state.commits[baseTip]?.snapshot ?? {};
  let next = state;
  let tip = baseTip;

  for (let index = 1; index <= count; index += 1) {
    const hash = hashFor(next.nextId);
    next = {
      ...next,
      commits: {
        ...next.commits,
        [hash]: {
          hash,
          parents: tip === undefined ? [] : [tip],
          message: `chore: décalage ${index}`,
          snapshot: { ...baseSnapshot, [`decalage-${index}.txt`]: `décalage ${index}` },
          author: DEFAULT_AUTHOR,
          timestamp: timestampFor(next.clock + 1),
          branch: 'decalage',
        },
      },
      nextId: next.nextId + 1,
      clock: next.clock + 1,
    };
    tip = hash;
  }

  return tip === undefined ? next : { ...next, branches: { ...next.branches, decalage: tip } };
}
