/**
 * Feature flag « Reprendre l'histoire depuis ici ».
 *
 * `?story=beta` active et mémorise, `?story=stable` désactive et mémorise.
 * Le choix survit aux visites suivantes via localStorage.
 */
const KEY = 'gitquest.flags.v1';

/** Repli en mémoire quand localStorage est indisponible (tests, mode privé strict). */
let memoryFlag: string | null = null;

function safeGet(): string | null {
  try {
    const stored = window.localStorage.getItem(KEY);
    return stored ?? memoryFlag;
  } catch {
    return memoryFlag;
  }
}

function safeSet(value: string): void {
  memoryFlag = value;
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Stockage indisponible : le flag reste valable pour la visite courante.
  }
}

export function storyBetaEnabled(search?: string): boolean {
  try {
    const params = new URLSearchParams(search ?? window.location.search);
    const choice = params.get('story');
    if (choice === 'beta') {
      safeSet('beta');
      return true;
    }
    if (choice === 'stable') {
      safeSet('stable');
      return false;
    }
    return safeGet() === 'beta';
  } catch {
    return false;
  }
}

export function resetStoryFlag(): void {
  memoryFlag = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // rien à faire
  }
}
