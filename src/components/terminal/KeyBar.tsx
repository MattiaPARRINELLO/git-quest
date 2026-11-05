import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '../../lib/cn';
import type { MessageKey } from '../../i18n';
import { useTranslation } from '../../i18n/useTranslation';

interface KeyBarProps {
  /** Insère un caractère à la position du curseur. */
  readonly onInsert: (token: string) => void;
  /** Complète la saisie (équivalent de Tab). */
  readonly onComplete: () => void;
  /** Rappelle l'historique des commandes. */
  readonly onHistory: (direction: 'up' | 'down') => void;
  /** Exécute la commande. */
  readonly onSubmit: () => void;
}

interface KeySpec {
  readonly label: string;
  readonly value: string;
  readonly ariaKey: MessageKey;
}

/**
 * Caractères Git impossibles à taper confortablement sur un clavier tactile :
 * les options (`-m`, `-b`), les guillemets des messages, les chemins.
 */
const TOKENS: readonly KeySpec[] = [
  { label: '-', value: '-', ariaKey: 'keybar.dash' },
  { label: '"', value: '"', ariaKey: 'keybar.quote' },
  { label: '/', value: '/', ariaKey: 'keybar.slash' },
  { label: '.', value: '.', ariaKey: 'keybar.dot' },
  { label: '_', value: '_', ariaKey: 'keybar.underscore' },
  { label: '~', value: '~', ariaKey: 'keybar.tilde' },
  { label: '␣', value: ' ', ariaKey: 'keybar.space' },
];

function Key({
  children,
  ariaLabel,
  onPress,
  variant = 'default',
}: {
  readonly children: string;
  readonly ariaLabel: string;
  readonly onPress: () => void;
  readonly variant?: 'default' | 'accent';
}) {
  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    // Sans ça, le bouton prend le focus et le clavier tactile se referme.
    event.preventDefault();
  };

  const handleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onPress();
  };

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={cn(
        'flex h-10 min-w-10 shrink-0 items-center justify-center  border px-2.5 text-[14px] transition-colors',
        variant === 'accent'
          ? 'border-accent/40 bg-accent/15 text-accent'
          : 'border-border bg-panel-2 text-text active:bg-panel-3',
      )}
    >
      {children}
    </button>
  );
}

/**
 * Barre de touches du terminal mobile. Elle ne doit jamais voler le focus à la
 * saisie : chaque touche empêche la prise de focus au pointerdown.
 */
export function KeyBar({ onInsert, onComplete, onHistory, onSubmit }: KeyBarProps) {
  const { t } = useTranslation();
  return (
    <div
      role="toolbar"
      aria-label={t('keybar.toolbar')}
      className="flex shrink-0 items-center gap-1.5 /70 bg-panel/40 px-2 py-1.5"
    >
      <div className="scrollbar-thin flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
        <Key ariaLabel={t('keybar.complete')} onPress={onComplete}>
          Tab
        </Key>
        <Key ariaLabel={t('keybar.previous')} onPress={() => onHistory('up')}>
          ↑
        </Key>
        <Key ariaLabel={t('keybar.next')} onPress={() => onHistory('down')}>
          ↓
        </Key>
        {TOKENS.map((token) => (
          <Key key={token.value} ariaLabel={t(token.ariaKey)} onPress={() => onInsert(token.value)}>
            {token.label}
          </Key>
        ))}
      </div>
      <Key ariaLabel={t('keybar.run')} variant="accent" onPress={onSubmit}>
        {t('keybar.enter')}
      </Key>
    </div>
  );
}
