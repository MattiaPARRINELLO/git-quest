const BRANCH_HUES = [258, 190, 152, 38, 330, 212, 14, 280];

function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** Couleur stable et vive dérivée du nom de branche. */
export function branchColor(name: string): string {
  const index = stableHash(name) % BRANCH_HUES.length;
  const hue = BRANCH_HUES[index] ?? 258;
  return `hsl(${hue} 82% 64%)`;
}

export function branchColorSoft(name: string): string {
  const index = stableHash(name) % BRANCH_HUES.length;
  const hue = BRANCH_HUES[index] ?? 258;
  return `hsl(${hue} 82% 64% / 0.14)`;
}

export const ORPHAN_COLOR = 'hsl(220 8% 55%)';
export const HEAD_COLOR = 'var(--accent)';
