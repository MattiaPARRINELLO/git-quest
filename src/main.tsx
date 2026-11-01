import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/newsreader';
import './styles/index.css';
import App from './App';
import { hideSplash, initNative } from './native';
import { useProgressStore } from './store/useProgressStore';
import { useRepoStore } from './store/useRepoStore';
import { useMissionDraftStore } from './store/useMissionDraftStore';

async function bootstrap(): Promise<void> {
  await initNative();
  await Promise.all([
    useRepoStore.getState().hydrate(),
    useProgressStore.getState().hydrate(),
    useMissionDraftStore.getState().hydrate(),
  ]);
  const container = document.getElementById('root');
  if (!container) throw new Error('Élément #root introuvable');
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  // Le splash natif reste affiché tant que la progression n'est pas hydratée :
  // on le masque après la première frame pour éviter un écran vide.
  requestAnimationFrame(() => {
    void hideSplash();
  });
}

void bootstrap();
