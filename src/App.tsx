import { useEffect } from 'react';
import { TopBar } from './components/layout/TopBar';
import { SandboxScreen } from './screens/SandboxScreen';
import { useUiStore } from './store/useUiStore';

export default function App() {
  const theme = useUiStore((store) => store.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (window.location.hash !== '#/sandbox') {
      window.history.replaceState(null, '', '#/sandbox');
    }
  }, []);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-bg text-text">
      <TopBar />
      <main className="min-h-0 flex-1">
        <SandboxScreen />
      </main>
    </div>
  );
}
