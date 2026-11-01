import { useHashRoute, routePaths } from '../../router/useHashRoute';
import { useRepoStore } from '../../store/useRepoStore';
import { useUiStore } from '../../store/useUiStore';
import { cn } from '../../lib/cn';
import { Icon } from '../ui/Icon';

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
          aria-label="Accueil GitQuest"
        >
          <BrandMark />
          <span className="display text-[21px] leading-none">GitQuest</span>
        </a>
        <details className="relative sm:hidden">
          <summary
            className="btn btn-quiet list-none px-2 [&::-webkit-details-marker]:hidden"
            aria-label="Ouvrir le menu"
          >
            <Icon name="menu" size={16} />
          </summary>
          <div className="absolute left-0 top-11 z-40 w-48 bg-panel-2 p-1">
            {[
              { href: routePaths.home, label: 'Chapitres', active: route.name === 'home' },
              { href: routePaths.sandbox, label: 'Bac à sable', active: isSandbox },
              { href: routePaths.nova, label: 'Mon arbre', active: route.name === 'nova' },
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
        <nav className="hidden items-center sm:flex" aria-label="Navigation principale">
          <NavLink href={routePaths.home} active={route.name === 'home'}>
            Chapitres
          </NavLink>
          <NavLink href={routePaths.sandbox} active={isSandbox}>
            Bac à sable
          </NavLink>
          <NavLink href={routePaths.nova} active={route.name === 'nova'}>
            Mon arbre
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
            title="Afficher les explications après chaque commande"
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                showExplanations ? 'bg-success' : 'bg-border-strong',
              )}
            />
            Explications
          </button>
        )}

        {isSandbox && (
          <>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={loadDemo}
              title="Charger un dépôt de démonstration"
            >
              <Icon name="play" size={13} />
              <span className="hidden sm:inline">Démo</span>
            </button>

            <button
              type="button"
              className="btn btn-quiet"
              onClick={resetSandbox}
              title="Réinitialiser le bac à sable"
            >
              <Icon name="reset" size={13} />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
          </>
        )}

        <button
          type="button"
          className="btn btn-quiet w-9 px-0"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
          title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
        </button>
      </div>
      </div>
    </header>
  );
}
