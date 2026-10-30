import type { Prediction } from '../../content/types';
import { Icon } from '../ui/Icon';

interface PredictionOverlayProps {
  readonly prediction: Prediction;
  readonly onAnswer: (optionId: string) => void;
  readonly onSkip: () => void;
}

export function PredictionOverlay({ prediction, onAnswer, onSkip }: PredictionOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-2"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-accent/40 bg-panel/95 p-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
              Prédiction
            </p>
            <p className="mt-1 text-sm font-medium leading-snug text-text">{prediction.question}</p>
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

        <div className="mt-2.5 flex flex-col gap-1.5">
          {prediction.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onAnswer(option.id)}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-panel-2 px-2.5 py-2 text-left text-xs text-text transition-colors hover:border-accent/60 hover:bg-accent-soft"
            >
              <span>{option.label}</span>
              {option.target && (
                <span className="flex shrink-0 items-center gap-1 font-mono text-[9px] text-muted">
                  <Icon name="graph" size={11} />
                  sur le graphe
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="mt-2 text-[10px] text-muted">
          Tu peux aussi cliquer directement un commit ou une étiquette sur le graphe.
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
    <div
      className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-2"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className={`pointer-events-auto w-full max-w-md rounded-2xl border p-3.5 shadow-2xl backdrop-blur-md ${
          correct
            ? 'border-success/40 bg-success/10'
            : 'border-warning/40 bg-warning/10'
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              correct ? 'bg-success text-bg' : 'bg-warning text-bg'
            }`}
          >
            {correct ? '✓' : '!'}
          </span>
          <div>
            <p className={`text-xs font-semibold ${correct ? 'text-success' : 'text-warning'}`}>
              {correct ? 'Bonne prédiction' : 'Pas tout à fait'}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">{explanation}</p>
          </div>
        </div>
        <div className="mt-2.5 flex justify-end">
          <button type="button" className="btn px-2.5 py-1 text-[11px]" onClick={onContinue}>
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
