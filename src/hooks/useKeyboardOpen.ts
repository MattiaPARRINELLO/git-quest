import { useEffect, useState } from 'react';
import { onKeyboardVisibility } from '../native/keyboard';

/** En dessous de cette réduction du viewport, on considère qu'aucun clavier n'est ouvert. */
const KEYBOARD_THRESHOLD = 140;

/**
 * Détecte un clavier virtuel ouvert sur mobile. Deux signaux se complètent :
 * le viewport visuel qui rétrécit dans le navigateur, et l'événement du plugin
 * Capacitor `Keyboard` dans l'APK (où `adjustResize` réduit la WebView, donc
 * l'écart entre `innerHeight` et le viewport visuel reste nul).
 */
export function useKeyboardOpen(): boolean {
  const [viewportOpen, setViewportOpen] = useState(false);
  const [nativeOpen, setNativeOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      setViewportOpen(window.innerHeight - viewport.height > KEYBOARD_THRESHOLD);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => onKeyboardVisibility(setNativeOpen), []);

  return viewportOpen || nativeOpen;
}
