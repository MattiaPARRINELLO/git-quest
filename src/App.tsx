import { useEffect, useRef } from 'react';
import { TopBar } from './components/layout/TopBar';
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
  useEffect(() => {
    if (document.activeElement === document.body || document.activeElement === null) {
      mainRef.current?.focus();
    }
  }, [routeKey]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
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
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-bg text-text">
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
        className="min-h-0 flex-1 outline-none"
      >
        {screen}
      </main>
    </div>
  );
}
