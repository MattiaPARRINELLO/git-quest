import { useHashRoute, routePaths } from '../../router/useHashRoute';
import { useRepoStore } from '../../store/useRepoStore';
import { useUiStore } from '../../store/useUiStore';
import { cn } from '../../lib/cn';
import { Icon } from '../ui/Icon';
import { setLocale } from '../../i18n';
import { useTranslation } from '../../i18n/useTranslation';

/**
 * Signature de la marque : une route qui bifurque, terminée par HEAD.
 * Un trait, une couleur, la même grammaire que le graphe.
 */
function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 19V8a3 3 0 0 1 3-3h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
      <path
        d="M13 5h6M13 5l3 3M13 5l3-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <rect x="3" y="17" width="4" height="4" fill="currentColor" />
      <rect x="3" y="3" width="4" height="4" fill="currentColor" />
      <rect x="17" y="3" width="4" height="4" fill="var(--accent)" />
    </svg>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  readonly href: string;
  readonly active: boolean;
  readonly children: string;
}) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-9 items-center px-3 text-[13.5px] transition-colors',
        active ? 'text-text' : 'text-muted hover:text-text',
      )}
    >
      {children}
    </a>
  );
}

export function TopBar() {
  const { locale, t } = useTranslation();
  const route = useHashRoute();
  const loadDemo = useRepoStore((store) => store.loadDemo);
  const resetSandbox = useRepoStore((store) => store.resetSandbox);
  const theme = useUiStore((store) => store.theme);
  const toggleTheme = useUiStore((store) => store.toggleTheme);
  const showExplanations = useUiStore((store) => store.showExplanations);
  const setShowExplanations = useUiStore((store) => store.setShowExplanations);

  const isSandbox = route.name === 'sandbox';
  const showExplanationToggle = isSandbox || route.name === 'mission';

  return (
    <header className="shrink-0">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between gap-3 px-5 sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <a
          href={routePaths.home}
          className="flex items-center gap-2.5 text-text"
          aria-label={t('nav.homeAria')}
        >
          <BrandMark />
          <span className="display text-[21px] leading-none">GitQuest</span>
        </a>
        <details className="relative sm:hidden">
          <summary
            className="btn btn-quiet list-none px-2 [&::-webkit-details-marker]:hidden"
            aria-label={t('nav.openMenu')}
          >
            <Icon name="menu" size={16} />
          </summary>
          <div className="absolute left-0 top-11 z-40 w-48 bg-panel-2 p-1">
            {[
              { href: routePaths.home, label: t('nav.chapters'), active: route.name === 'home' },
              { href: routePaths.sandbox, label: t('nav.sandbox'), active: isSandbox },
              { href: routePaths.nova, label: t('nav.myTree'), active: route.name === 'nova' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-10 items-center px-3 text-[14px] transition-colors',
                  item.active ? 'bg-panel-2 text-text' : 'text-muted hover:text-text',
                )}
              >
                {item.label}
              </a>
            ))}
          </div>
        </details>
        <nav className="hidden items-center sm:flex" aria-label={t('nav.main')}>
          <NavLink href={routePaths.home} active={route.name === 'home'}>
            {t('nav.chapters')}
          </NavLink>
          <NavLink href={routePaths.sandbox} active={isSandbox}>
            {t('nav.sandbox')}
          </NavLink>
          <NavLink href={routePaths.nova} active={route.name === 'nova'}>
            {t('nav.myTree')}
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-1.5">
        {showExplanationToggle && (
          <button
            type="button"
            className="btn btn-quiet hidden gap-2 sm:inline-flex"
            aria-pressed={showExplanations}
            onClick={() => setShowExplanations(!showExplanations)}
            title={t('controls.explanationsTitle')}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                showExplanations ? 'bg-success' : 'bg-border-strong',
              )}
            />
            {t('controls.explanations')}
          </button>
        )}

        {isSandbox && (
          <>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={loadDemo}
              title={t('controls.demoTitle')}
            >
              <Icon name="play" size={13} />
              <span className="hidden sm:inline">{t('controls.demo')}</span>
            </button>

            <button
              type="button"
              className="btn btn-quiet"
              onClick={resetSandbox}
              title={t('controls.resetTitle')}
            >
              <Icon name="reset" size={13} />
              <span className="hidden sm:inline">{t('controls.reset')}</span>
            </button>
          </>
        )}

        <button
          type="button"
          className="btn btn-quiet px-2 text-[12px] font-medium uppercase"
          onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
          aria-label={
            locale === 'fr' ? t('controls.switchToEnglish') : t('controls.switchToFrench')
          }
          title={locale === 'fr' ? 'Français' : 'English'}
        >
          {locale === 'fr' ? 'EN' : 'FR'}
        </button>

        <button
          type="button"
          className="btn btn-quiet w-9 px-0"
          onClick={toggleTheme}
          aria-label={
            theme === 'dark' ? t('controls.lightTheme') : t('controls.darkTheme')
          }
          title={
            theme === 'dark' ? t('controls.lightThemeShort') : t('controls.darkThemeShort')
          }
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
        </button>
      </div>
      </div>
    </header>
  );
}
