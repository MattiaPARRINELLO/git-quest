import { useHashRoute, routePaths } from '../../router/useHashRoute';
import { useRepoStore } from '../../store/useRepoStore';
import { useUiStore } from '../../store/useUiStore';
import { cn } from '../../lib/cn';
import { Icon } from '../ui/Icon';

/**
 * Signature de la marque : une route qui bifurque. Un seul trait, une seule
 * couleur, comme la ligne d'un plan.
 */
function BrandMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="text-text">
      <path
        d="M5 19V8a3 3 0 0 1 3-3h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M13 5h6M13 5l3 3M13 5l3-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="5" cy="19" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="5" cy="5" r="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="19" cy="5" r="2" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.6" />
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
        'flex h-8 items-center rounded-md px-2.5 text-[13px] transition-colors',
        active
          ? 'bg-panel-2 text-text'
          : 'text-muted hover:bg-panel-2/60 hover:text-text',
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
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-panel px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-5">
        <a href={routePaths.home} className="flex items-center gap-2" aria-label="Accueil GitQuest">
          <BrandMark />
          <span className="text-[15px] font-medium tracking-[-0.01em] text-text">GitQuest</span>
        </a>
        <details className="relative sm:hidden">
          <summary
            className="btn h-8 w-8 list-none px-0 [&::-webkit-details-marker]:hidden"
            aria-label="Ouvrir le menu"
          >
            <Icon name="menu" size={15} />
          </summary>
          <div className="absolute left-0 top-9 z-40 w-44 rounded-lg border border-border bg-panel p-1 shadow-[var(--shadow)]">
            {[
              { href: routePaths.home, label: 'Chapitres', active: route.name === 'home' },
              { href: routePaths.sandbox, label: 'Bac à sable', active: isSandbox },
              { href: routePaths.nova, label: 'Mon arbre', active: route.name === 'nova' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-8 items-center rounded-md px-2 text-[13px] transition-colors',
                  item.active ? 'bg-panel-2 text-text' : 'text-muted hover:text-text',
                )}
              >
                {item.label}
              </a>
            ))}
          </div>
        </details>
        <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Navigation principale">
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
            className="btn hidden gap-2 sm:inline-flex"
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
              className="btn"
              onClick={loadDemo}
              title="Charger un dépôt de démonstration"
            >
              <Icon name="play" size={13} />
              <span className="hidden sm:inline">Démo</span>
            </button>

            <button
              type="button"
              className="btn"
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
          className="btn w-8 px-0"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
          title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} />
        </button>
      </div>
    </header>
  );
}
