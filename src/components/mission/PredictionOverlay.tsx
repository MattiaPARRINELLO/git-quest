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
      <div className="pointer-events-none absolute inset-0 bg-bg/70 backdrop-blur-[3px]" />

      <div
        ref={card}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-label="Prédiction"
        aria-live="assertive"
        className="pointer-events-auto relative w-full max-w-md rounded-2xl border-2 border-accent/60 bg-panel p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_24px_80px_-12px_rgba(0,0,0,0.9)] outline-none"
      >
        <span className="absolute -top-3 left-4 flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
          <Icon name="play" size={11} />
          Exécution en pause
        </span>

        <div className="mt-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
              Prédiction
            </p>
            <p className="mt-1 text-base font-medium leading-snug text-text">{prediction.question}</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] text-muted hover:text-text"
            onClick={onSkip}
            title="Exécuter la commande sans répondre"
          >
            Passer
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          {prediction.options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onAnswer(option.id)}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-panel-2 px-2.5 py-2 text-left text-sm text-text transition-colors hover:border-accent/60 hover:bg-accent-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border font-mono text-[10px] text-muted">
                  {index + 1}
                </span>
                {option.label}
              </span>
              {option.target && (
                <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] text-muted">
                  <Icon name="graph" size={11} />
                  sur le graphe
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="mt-2.5 text-[10px] text-muted">
          Touche 1–{prediction.options.length} pour répondre, Échap pour passer. Tu peux aussi
          cliquer un commit ou une étiquette sur le graphe.
        </p>
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
      <div className="pointer-events-none absolute inset-0 bg-bg/60 backdrop-blur-[2px]" />
      <div
        role="status"
        className={`pointer-events-auto relative w-full max-w-md rounded-2xl border-2 p-4 shadow-2xl ${
          correct
            ? 'border-success/50 bg-success/10'
            : 'border-warning/50 bg-warning/10'
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              correct ? 'bg-success text-bg' : 'bg-warning text-bg'
            }`}
          >
            {correct ? '✓' : '!'}
          </span>
          <div>
            <p className={`text-sm font-semibold ${correct ? 'text-success' : 'text-warning'}`}>
              {correct ? 'Bonne prédiction' : 'Pas tout à fait'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{explanation}</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" className="btn px-3 py-1.5 text-xs" onClick={onContinue}>
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
