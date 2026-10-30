import { useHashRoute, routePaths } from '../../router/useHashRoute';
import { useRepoStore } from '../../store/useRepoStore';
import { useUiStore } from '../../store/useUiStore';
import { cn } from '../../lib/cn';
import { Icon } from '../ui/Icon';

function BrandMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="brand-line" x1="4" y1="28" x2="28" y2="4">
          <stop stopColor="var(--success)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="var(--panel-2)" stroke="var(--border)" />
      <path
        d="M9 23V11c0-2 1.6-3.5 3.6-3.5H23"
        fill="none"
        stroke="url(#brand-line)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="9" cy="24" r="2.6" fill="var(--bg)" stroke="var(--success)" strokeWidth="1.8" />
      <circle cx="9" cy="9" r="2.6" fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.8" />
      <circle cx="23" cy="7.5" r="2.6" fill="var(--bg)" stroke="var(--accent-2)" strokeWidth="1.8" />
    </svg>
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
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-panel/80 px-3 backdrop-blur-md sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <a href={routePaths.home} className="flex items-center gap-2.5" aria-label="Accueil GitQuest">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight text-text">GitQuest</span>
        </a>
        <nav className="ml-1 hidden items-center gap-1 sm:flex" aria-label="Navigation principale">
          <a
            href={routePaths.home}
            className={cn(
              'rounded-lg px-2 py-1 text-xs font-medium transition-colors',
              route.name === 'home' ? 'bg-panel-2 text-text' : 'text-muted hover:text-text',
            )}
          >
            Chapitres
          </a>
          <a
            href={routePaths.sandbox}
            className={cn(
              'rounded-lg px-2 py-1 text-xs font-medium transition-colors',
              isSandbox ? 'bg-panel-2 text-text' : 'text-muted hover:text-text',
            )}
          >
            Bac à sable
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-1.5">
        {showExplanationToggle && (
          <button
            type="button"
            className="btn hidden sm:inline-flex"
            aria-pressed={showExplanations}
            onClick={() => setShowExplanations(!showExplanations)}
            title="Afficher les explications après chaque commande"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                showExplanations ? 'bg-success' : 'bg-border-strong'
              }`}
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
              <Icon name="play" size={14} />
              <span className="hidden sm:inline">Démo</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={resetSandbox}
              title="Réinitialiser le bac à sable"
            >
              <Icon name="reset" size={14} />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
          </>
        )}

        <button
          type="button"
          className="btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
          title={theme === 'dark' ? 'Thème clair' : 'Thème sombre'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
        </button>
      </div>
    </header>
  );
}
