import { useEffect, useRef } from 'react';
import { TopBar } from './components/layout/TopBar';
import { cn } from './lib/cn';
import { routePaths, useHashRoute } from './router/useHashRoute';
import { HomeScreen } from './screens/HomeScreen';
import { LessonScreen } from './screens/LessonScreen';
import { PrologueScreen } from './screens/PrologueScreen';
import { MissionScreen } from './screens/MissionScreen';
import { SandboxScreen } from './screens/SandboxScreen';
import { NovaScreen } from './screens/NovaScreen';
import { InterludeScreen } from './screens/InterludeScreen';
import { FinalScreen } from './screens/FinalScreen';
import { useUiStore } from './store/useUiStore';
import { syncStatusBar } from './native';

export default function App() {
  const theme = useUiStore((store) => store.theme);
  const route = useHashRoute();
  const mainRef = useRef<HTMLElement>(null);
  const routeKey =
    route.name === 'mission'
      ? `mission:${route.missionId}`
      : route.name === 'lesson' || route.name === 'interlude'
        ? `${route.name}:${route.chapterId}`
        : route.name;

  /**
   * Après une navigation, le focus reste sur le lien cliqué qui vient d'être
   * démonté. On le pose sur le contenu, sauf si un écran a déjà pris la main
   * (le terminal focalise sa saisie au montage).
   */
  /**
   * L'accueil est une page : c'est le document qui défile. Les écrans de travail
   * gardent une coquille fixe, chacun gérant son propre défilement.
   */
  const isPage = route.name === 'home';

  useEffect(() => {
    if (document.activeElement === document.body || document.activeElement === null) {
      mainRef.current?.focus();
    }
    if (isPage) window.scrollTo(0, 0);
  }, [routeKey, isPage]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    void syncStatusBar(theme);
  }, [theme]);

  useEffect(() => {
    if (window.location.hash === '' || window.location.hash === '#') {
      window.history.replaceState(null, '', routePaths.home);
    }
  }, []);

  let screen;
  switch (route.name) {
    case 'sandbox':
      screen = <SandboxScreen />;
      break;
    case 'nova':
      screen = <NovaScreen />;
      break;
    case 'interlude':
      screen = <InterludeScreen chapterId={route.chapterId} />;
      break;
    case 'final':
      screen = <FinalScreen />;
      break;
    case 'lesson':
      screen = <LessonScreen key={route.chapterId} chapterId={route.chapterId} />;
      break;
    case 'prologue':
      screen = <PrologueScreen />;
      break;
    case 'mission':
      screen = <MissionScreen key={route.missionId} missionId={route.missionId} />;
      break;
    case 'home':
      screen = <HomeScreen />;
      break;
    default:
      screen = (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-sm text-muted">Page introuvable.</p>
          <a href={routePaths.home} className="btn">
            Retour aux chapitres
          </a>
        </div>
      );
  }

  return (
    <div
      className={cn(
        'safe-frame flex flex-col bg-bg text-text',
        isPage ? 'min-h-dvh' : 'h-dvh min-h-0 overflow-hidden',
      )}
    >
      <a
        href="#contenu-principal"
        className="sr-only rounded-lg border border-border bg-panel px-3 py-2 text-sm text-text focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[60]"
      >
        Aller au contenu
      </a>
      <TopBar />
      <main
        id="contenu-principal"
        ref={mainRef}
        tabIndex={-1}
        className={cn('outline-none', isPage ? 'flex-1' : 'min-h-0 flex-1')}
      >
        {screen}
      </main>
    </div>
  );
}
