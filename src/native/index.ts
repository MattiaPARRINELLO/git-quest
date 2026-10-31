import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNative } from './platform';

type Theme = 'dark' | 'light';

/**
 * Le bouton retour Android suit l'historique de la SPA. À la racine, on réduit
 * l'application au lieu de la quitter : une sortie brutale en pleine mission
 * ferait perdre le fil au joueur.
 */
async function registerBackButton(): Promise<void> {
  await App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && window.history.length > 1) {
      window.history.back();
      return;
    }
    void App.minimizeApp();
  });
}

/**
 * Contenu en bord à bord : les marges de sécurité sont gérées en CSS
 * (`.safe-frame` dans index.css), donc la barre de statut recouvre le contenu.
 * Depuis Android 15 l'edge-to-edge est imposé, ce réglage est donc la seule
 * option cohérente.
 */
async function applyStatusBar(theme: Theme): Promise<void> {
  await StatusBar.setOverlaysWebView({ overlay: true });
  await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
}

/**
 * Appelé une fois depuis main.tsx. No-op total dans le navigateur : la PWA ne
 * charge aucune API native.
 */
export async function initNative(): Promise<void> {
  if (!isNative()) return;
  await Promise.all([registerBackButton(), applyStatusBar('dark')]);
}

/** Recale la barre de statut quand le thème clair/sombre change. */
export async function syncStatusBar(theme: Theme): Promise<void> {
  if (!isNative()) return;
  await applyStatusBar(theme);
}

/**
 * Masque le splash une fois la progression hydratée et le premier écran rendu.
 * Lancé depuis main.tsx pour éviter le flash d'écran vide.
 */
export async function hideSplash(): Promise<void> {
  if (!isNative()) return;
  await SplashScreen.hide();
}
