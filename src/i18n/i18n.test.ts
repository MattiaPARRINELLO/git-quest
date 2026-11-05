import { afterEach, describe, expect, it } from 'vitest';
import { getLocale, setLocale, t } from './index';
import { fr } from './locales/fr';
import { en } from './locales/en';
import type { MessageKey } from './index';

const KEYS = Object.keys(fr) as MessageKey[];

function placeholders(message: string): string[] {
  return [...message.matchAll(/\{([a-zA-Z0-9_]+)\}/g)]
    .map((match) => match[1] ?? '')
    .sort();
}

describe('traductions', () => {
  afterEach(() => setLocale('fr'));

  it('démarre en français sous Vitest', () => {
    expect(getLocale()).toBe('fr');
  });

  it('change de langue et interpole les variables', () => {
    setLocale('en');
    expect(t('nav.chapters')).toBe('Chapters');
    expect(t('chapter.meta', { number: 2, done: 1, total: 3, minutes: 4 })).toBe(
      'Chapter 2 · 1/3 missions · 4 min lesson',
    );
  });

  it('garde le même jeu de clés et de variables dans les deux catalogues', () => {
    for (const key of KEYS) {
      expect(en[key], `clé anglaise manquante : ${key}`).toBeTypeOf('string');
      expect(en[key].trim(), `traduction vide : ${key}`).not.toBe('');
      expect(placeholders(fr[key]), `variables divergentes : ${key}`).toEqual(
        placeholders(en[key]),
      );
    }
  });

  it('interdit les tirets cadratins dans les catalogues', () => {
    for (const key of KEYS) {
      expect(fr[key]).not.toContain('\u2014');
      expect(en[key]).not.toContain('\u2014');
    }
  });
});
