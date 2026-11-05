import { useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { contentFor } from './localized';
import type { ContentPack } from './localized';

/**
 * Contenu pédagogique de la langue courante.
 *
 * Le hook s'abonne au changement de langue : tous les écrans qui l'utilisent
 * se rafraîchissent sans rechargement.
 */
export function useContent(): ContentPack {
  const { locale } = useTranslation();
  return useMemo(() => contentFor(locale), [locale]);
}
