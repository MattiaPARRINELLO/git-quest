import type { CapacitorConfig } from '@capacitor/cli';
import type { KeyboardResize } from '@capacitor/keyboard';

/**
 * Coquille Android de GitQuest.
 *
 * Le contenu embarqué est exactement le `dist/` de la PWA : une seule base de
 * code, deux livrables. Voir docs/NATIVE-ANDROID.md.
 *
 * `androidScheme` est figé à `https` et ne doit plus changer : l'origine de la
 * WebView dépend de ce schéma, donc le modifier invalide IndexedDB et
 * localStorage (progression, étoiles, brouillons) des installations existantes.
 */
const config: CapacitorConfig = {
  appId: 'dev.gitquest.app',
  appName: 'GitQuest',
  webDir: 'dist',
  backgroundColor: '#0a0b0f',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0b0f',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      // Masqué explicitement par initNative() une fois la progression hydratée,
      // pour éviter le flash d'écran vide au démarrage.
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#0a0b0fff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      // Fond sombre, icônes claires : cohérent avec le thème par défaut.
      style: 'DARK',
      backgroundColor: '#0a0b0f',
      overlaysWebView: false,
    },
    Keyboard: {
      // Le layout se redimensionne au lieu de passer sous le clavier : le
      // terminal garde sa zone de saisie visible.
      resize: 'native' as KeyboardResize,
    },
  },
};

export default config;
