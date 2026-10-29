import type { Author, CommitHash } from './types';

/**
 * Hashes déterministes : Git hashe le contenu (SHA-1), ici on hashe un compteur.
 * Écart assumé, documenté dans docs/ARCHITECTURE.md, pour des tests/missions stables.
 */
export function hashFor(counter: number): CommitHash {
  let hash = 0x811c9dc5;
  const input = `gitquest:commit:${counter}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0').slice(0, 7);
}

/** Base des timestamps logiques (2023-11-14T22:13:20Z). */
export const BASE_TIMESTAMP = 1_700_000_000;

export function timestampFor(clock: number): number {
  return BASE_TIMESTAMP + clock;
}

export const DEFAULT_AUTHOR: Author = {
  name: 'GitQuest',
  email: 'gitquest@example.com',
};
