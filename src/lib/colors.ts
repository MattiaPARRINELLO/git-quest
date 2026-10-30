const BRANCH_HUES = [205, 158, 78, 330, 264, 96, 186, 300];

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Couleur stable et lisible dérivée du nom de branche. Teintes désaturées :
 * le graphe doit rester calme, la couleur sert à suivre une ligne, pas à briller.
 */
export function branchColor(name: string): string {
  const index = stableHash(name) % BRANCH_HUES.length;
  const hue = BRANCH_HUES[index] ?? 18;
  return `hsl(${hue} var(--branch-sat, 54%) var(--branch-light, 62%))`;
}

export function branchColorSoft(name: string): string {
  const index = stableHash(name) % BRANCH_HUES.length;
  const hue = BRANCH_HUES[index] ?? 18;
  return `hsl(${hue} var(--branch-sat, 54%) var(--branch-light, 62%) / 0.14)`;
}

export const ORPHAN_COLOR = 'hsl(120 5% 55%)';
export const HEAD_COLOR = 'var(--accent)';
