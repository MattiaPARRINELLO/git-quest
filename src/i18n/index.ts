import { en } from './locales/en';
import { fr } from './locales/fr';
import type { MessageKey } from './locales/fr';

export type { MessageKey };

export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const localeNames: Readonly<Record<Locale, string>> = {
  fr: 'Français',
  en: 'English',
};

const CATALOGS: Readonly<Record<Locale, Readonly<Record<MessageKey, string>>>> = {
  fr,
  en,
};

const STORAGE_KEY = 'gitquest.locale';

function isLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as readonly string[]).includes(value);
}

function detectLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  }
  // Les tests restent en français : la détection navigateur ne s'applique
  // qu'en développement et en production, jamais sous Vitest.
  if (import.meta.env.MODE === 'test') return 'fr';
  if (typeof navigator !== 'undefined' && !navigator.language.toLowerCase().startsWith('fr')) {
    return 'en';
  }
  return 'fr';
}

let currentLocale: Locale = detectLocale();
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  if (locale === currentLocale) return;
  currentLocale = locale;
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, locale);
  for (const listener of listeners) listener();
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type MessageVars = Readonly<Record<string, string | number>>;

function interpolate(message: string, vars: MessageVars | undefined): string {
  if (vars === undefined) return message;
  return message.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Traduit une clé dans la langue courante.
 * Les modules hors React (moteur applicatif, explications) peuvent l'appeler
 * directement : `setLocale` les fait changer au prochain rendu.
 */
export function t(key: MessageKey, vars?: MessageVars): string {
  return interpolate(CATALOGS[currentLocale][key], vars);
}
