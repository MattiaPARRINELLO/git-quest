import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const NATIVE_ACTIVATION_SELECTOR = 'a[href], button, input, select, textarea, summary';

/**
 * Focus d'ouverture, piège du Tab dans la boîte et restitution du focus à la
 * fermeture. Utilisable seul (dialogues avec leurs propres raccourcis) ou via
 * `useDialogKeyboard`.
 */
export function useModalFocus<T extends HTMLElement>(
  ref: RefObject<T | null>,
  initialFocus = '[data-autofocus]',
): void {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const previous =
      document.activeElement instanceof HTMLElement && document.activeElement !== root
        ? document.activeElement
        : null;

    const initial = root.querySelector<HTMLElement>(initialFocus) ?? root;
    initial.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;
      const focusable = [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) {
        event.preventDefault();
        root.focus();
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === root)) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previous?.isConnected === true) previous.focus();
    };
  }, [ref, initialFocus]);
}

interface DialogKeyboardOptions {
  /** Entrée sur un élément non interactif : valide le dialogue. */
  readonly onConfirm?: (() => void) | undefined;
  /** Échap : ferme ou annule. */
  readonly onCancel?: (() => void) | undefined;
  /** Sélecteur de l'élément focalisé à l'ouverture. */
  readonly initialFocus?: string | undefined;
}

/**
 * Comportement clavier commun aux popups : Entrée valide, Échap annule, Tab
 * reste dans la boîte et le focus revient d'où il venait.
 */
export function useDialogKeyboard<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: DialogKeyboardOptions = {},
): void {
  const confirmRef = useRef(options.onConfirm);
  confirmRef.current = options.onConfirm;
  const cancelRef = useRef(options.onCancel);
  cancelRef.current = options.onCancel;

  useModalFocus(ref, options.initialFocus ?? '[data-autofocus]');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (cancelRef.current === undefined) return;
        event.preventDefault();
        event.stopPropagation();
        cancelRef.current();
        return;
      }

      if (event.key !== 'Enter') return;
      const target = event.target;
      if (target instanceof Element && target.closest(NATIVE_ACTIVATION_SELECTOR) !== null) {
        return;
      }
      if (confirmRef.current === undefined) return;
      event.preventDefault();
      confirmRef.current();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
