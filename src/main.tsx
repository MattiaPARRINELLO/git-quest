import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles/index.css';
import App from './App';
import { useRepoStore } from './store/useRepoStore';

async function bootstrap(): Promise<void> {
  await useRepoStore.getState().hydrate();
  const container = document.getElementById('root');
  if (!container) throw new Error('Élément #root introuvable');
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
