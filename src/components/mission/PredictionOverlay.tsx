import { useEffect, useRef } from 'react';
import type { Prediction } from '../../content/types';
import { Icon } from '../ui/Icon';

interface PredictionOverlayProps {
  readonly prediction: Prediction;
  readonly onAnswer: (optionId: string) => void;
  readonly onSkip: () => void;
}

/**
 * Prédiction : plein écran, centrée, jamais confondue avec le graphe.
 * Le fond assombrit sans bloquer le graphe (pointer-events-none) pour garder
 * la réponse par clic sur un commit.
 */
export function PredictionOverlay({ prediction, onAnswer, onSkip }: PredictionOverlayProps) {
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    card.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onSkip();
        return;
      }
      const index = Number.parseInt(event.key, 10);
      if (!Number.isNaN(index) && index >= 1 && index <= prediction.options.length) {
        const option = prediction.options[index - 1];
        if (option) {
          event.preventDefault();
          onAnswer(option.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prediction, onAnswer, onSkip]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-bg/65" />

      <div
        ref={card}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-label="Prédiction"
        aria-live="assertive"
        className="pointer-events-auto relative w-full max-w-md rounded-xl border border-border bg-panel shadow-[var(--shadow)] outline-none"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <span className="flex items-center gap-2 text-[11.5px] text-accent">
            <Icon name="play" size={11} />
            Exécution en pause
          </span>
          <button
            type="button"
            className="rounded px-1 text-[11.5px] text-muted transition-colors hover:text-text"
            onClick={onSkip}
            title="Exécuter la commande sans répondre"
          >
            Passer
          </button>
        </div>

        <div className="px-4 py-4">
          <p className="mono-meta">Prédiction</p>
          <p className="mt-1 text-[15px] font-medium leading-snug text-text">{prediction.question}</p>

          <div className="mt-3 flex flex-col gap-1">
            {prediction.options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onAnswer(option.id)}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-panel-2 px-2.5 py-2 text-left text-[13px] text-text transition-colors hover:border-border-strong hover:bg-panel-3 focus-visible:border-accent"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-panel font-mono text-[10px] text-muted"
                  >
                    {index + 1}
                  </span>
                  {option.label}
                </span>
                {option.target && (
                  <span className="flex shrink-0 items-center gap-1 font-mono text-[9.5px] text-muted">
                    <Icon name="graph" size={11} />
                    graphe
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="mt-3 text-[10.5px] leading-relaxed text-muted/75">
            Touche 1–{prediction.options.length} pour répondre, Échap pour passer. Tu peux aussi
            cliquer un commit ou une étiquette sur le graphe.
          </p>
        </div>
      </div>
    </div>
  );
}

interface PredictionFeedbackProps {
  readonly correct: boolean;
  readonly explanation: string;
  readonly onContinue: () => void;
}

export function PredictionFeedback({ correct, explanation, onContinue }: PredictionFeedbackProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-bg/60" />
      <div
        role="status"
        className="pointer-events-auto relative w-full max-w-md rounded-xl border border-border bg-panel shadow-[var(--shadow)]"
      >
        <div className="flex items-start gap-2.5 px-4 pt-4">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              correct ? 'bg-success text-bg' : 'bg-warning text-bg'
            }`}
          >
            {correct ? <Icon name="check" size={12} /> : '!'}
          </span>
          <div>
            <p className={`text-[13px] font-medium ${correct ? 'text-success' : 'text-warning'}`}>
              {correct ? 'Bonne prédiction' : 'Pas tout à fait'}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{explanation}</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end border-t border-border px-4 py-2.5">
          <button type="button" className="btn h-8 px-3 text-[12px]" onClick={onContinue}>
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
