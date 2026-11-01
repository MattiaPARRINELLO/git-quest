import { useEffect, useState } from 'react';

/** En dessous de cette réduction du viewport, on considère qu'aucun clavier n'est ouvert. */
const KEYBOARD_THRESHOLD = 140;

/**
 * Détecte un clavier virtuel ouvert sur mobile. Le viewport visuel rétrécit
 * alors que la fenêtre garde sa hauteur : les écrans peuvent rendre la place
 * occupée par leurs panneaux secondaires au contenu utile.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      setOpen(window.innerHeight - viewport.height > KEYBOARD_THRESHOLD);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);

  return open;
}
