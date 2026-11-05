import { getLocale } from '../i18n';

export type TextVars = Readonly<Record<string, string | number>>;

/**
 * Choisit un texte selon la langue courante, pour les rares libellés construits
 * à l'exécution dans les missions (prédictions avec hash réel).
 *
 * Le français et l'anglais sont fournis côte à côte pour que la traduction
 * reste visible au même endroit que l'exemple concerné.
 */
export function localizedText(french: string, english: string, vars?: TextVars): string {
  const template = getLocale() === 'en' ? english : french;
  if (vars === undefined) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}
