import { Keyboard } from '@capacitor/keyboard';
import { isNative } from './platform';

/**
 * Signale l'ouverture du clavier virtuel dans la coquille Capacitor.
 *
 * En natif, `adjustResize` réduit réellement la WebView : la hauteur de fenêtre
 * suit le clavier et l'écart avec le viewport visuel reste nul. Le seul signal
 * fiable est donc l'événement du plugin `Keyboard`.
 *
 * No-op dans le navigateur : la PWA déduit le clavier du viewport visuel.
 */
export function onKeyboardVisibility(listener: (open: boolean) => void): () => void {
  if (!isNative()) return () => undefined;

  const handles: Array<{ remove: () => Promise<void> }> = [];
  let disposed = false;

  void Keyboard.addListener('keyboardDidShow', () => listener(true)).then((handle) => {
    if (disposed) void handle.remove();
    else handles.push(handle);
  });
  void Keyboard.addListener('keyboardDidHide', () => listener(false)).then((handle) => {
    if (disposed) void handle.remove();
    else handles.push(handle);
  });

  return () => {
    disposed = true;
    for (const handle of handles) void handle.remove();
  };
}
