import { useSyncExternalStore } from 'react';
import { getLocale, subscribeLocale, t } from './index';
import type { Locale } from './index';

/**
 * Abonnement React à la langue courante. Le composant se re-rend quand
 * `setLocale` est appelé, sans état dupliqué dans un store.
 */
export function useTranslation(): { readonly locale: Locale; readonly t: typeof t } {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return { locale, t };
}
