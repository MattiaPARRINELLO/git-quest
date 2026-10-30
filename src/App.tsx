import { useEffect } from 'react';
import { TopBar } from './components/layout/TopBar';
import { routePaths, useHashRoute } from './router/useHashRoute';
import { HomeScreen } from './screens/HomeScreen';
import { LessonScreen } from './screens/LessonScreen';
import { MissionScreen } from './screens/MissionScreen';
import { SandboxScreen } from './screens/SandboxScreen';
import { NovaScreen } from './screens/NovaScreen';
import { useUiStore } from './store/useUiStore';

export default function App() {
  const theme = useUiStore((store) => store.theme);
  const route = useHashRoute();

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
    case 'lesson':
      screen = <LessonScreen key={route.chapterId} chapterId={route.chapterId} />;
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
      <TopBar />
      <main className="min-h-0 flex-1">{screen}</main>
    </div>
  );
}
