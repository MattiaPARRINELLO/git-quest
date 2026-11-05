import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setLocale } from './index';
import { useTranslation } from './useTranslation';

function LanguageProbe() {
  const { locale, t } = useTranslation();
  return (
    <button type="button" onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}>
      {t('nav.chapters')}
    </button>
  );
}

describe('useTranslation', () => {
  afterEach(() => setLocale('fr'));

  it('re-rend le composant au changement de langue', async () => {
    const user = userEvent.setup();
    render(<LanguageProbe />);

    expect(screen.getByRole('button')).toHaveTextContent('Chapitres');
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('Chapters');
  });
});
