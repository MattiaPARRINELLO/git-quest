/**
 * Validation simplifiée de `git check-ref-format --branch`.
 * On refuse les noms vides, commençant par `-`, `HEAD`, contenant `..`, des espaces,
 * caractères de contrôle, ou finissant par `.lock` / `/` / `.`.
 */
export function isValidBranchName(name: string): boolean {
  if (name.length === 0) return false;
  if (name === 'HEAD' || name === '@') return false;
  if (name.startsWith('-') || name.startsWith('/') || name.endsWith('/')) return false;
  if (name.endsWith('.') || name.endsWith('.lock')) return false;
  if (name.includes('..') || name.includes('//') || name.includes('@{')) return false;
  if (/[\s~^:?*[\\\u0000-\u001f\u007f]/.test(name)) return false;
  return true;
}
