import { useEffect, useRef, useState } from 'react';
import type { Prediction } from '../../content/types';
import { useDialogKeyboard, useModalFocus } from '../../hooks/useDialogKeyboard';
import { useTranslation } from '../../i18n/useTranslation';
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
  const { t } = useTranslation();
  const card = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  useModalFocus(card);

  const optionId = (index: number): string => `prediction-option-${index}`;

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onSkip();
        return;
      }

      const total = prediction.options.length;

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        setSelected((current) => (current + 1) % total);
        return;
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        setSelected((current) => (current - 1 + total) % total);
        return;
      }

      const digit = Number.parseInt(event.key, 10);
      if (!Number.isNaN(digit) && digit >= 1 && digit <= total) {
        const option = prediction.options[digit - 1];
        if (option) {
          event.preventDefault();
          onAnswer(option.id);
        }
        return;
      }

      if (event.key !== 'Enter') return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('a[href], button, input, select, textarea, summary') !== null
      ) {
        return;
      }
      const option = prediction.options[selected];
      if (option) {
        event.preventDefault();
        onAnswer(option.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prediction, onAnswer, onSkip, selected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-black/60" />

      <div
        ref={card}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-label={t('prediction.aria')}
        aria-live="assertive"
        aria-activedescendant={optionId(selected)}
        className="pointer-events-auto relative w-full max-w-md bg-panel outline-none"
      >
        <div className="flex items-center justify-between gap-2  px-4 py-2.5">
          <span className="flex items-center gap-2 text-[13px] text-accent">
            <Icon name="play" size={11} />
            {t('prediction.paused')}
          </span>
          <button
            type="button"
            className="rounded px-1 text-[13px] text-muted transition-colors hover:text-text"
            onClick={onSkip}
            title={t('prediction.skipTitle')}
          >
            {t('prediction.skip')}
          </button>
        </div>

        <div className="px-4 py-4">
          <p className="mono-meta">{t('prediction.label')}</p>
          <p className="mt-1 text-[15px] font-medium leading-snug text-text">{prediction.question}</p>

          <div className="mt-3 flex flex-col gap-1">
            {prediction.options.map((option, index) => (
              <button
                key={option.id}
                id={optionId(index)}
                type="button"
                tabIndex={-1}
                onClick={() => onAnswer(option.id)}
                onMouseEnter={() => setSelected(index)}
                aria-current={index === selected ? 'true' : undefined}
                className={`flex items-center justify-between gap-2  border px-2.5 py-2 text-left text-[13px] text-text transition-colors focus-visible:border-accent ${
                  index === selected ? 'border-border-strong bg-panel-3' : 'border-border bg-panel-2'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center bg-panel text-[13px] tabular-nums text-muted"
                  >
                    {index + 1}
                  </span>
                  {option.label}
                </span>
                {option.target && (
                  <span className="flex shrink-0 items-center gap-1 text-[12px] text-muted">
                    <Icon name="graph" size={11} />
                    {t('prediction.graph')}
                  </span>
                )}
              </button>
            ))}
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-muted/75">
            {t('prediction.keys', { total: prediction.options.length })}
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
  const { t } = useTranslation();
  const dialog = useRef<HTMLDivElement>(null);
  useDialogKeyboard(dialog, { onConfirm: onContinue, onCancel: onContinue });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-black/60" />
      <div
        ref={dialog}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="pointer-events-auto relative w-full max-w-md bg-panel outline-none"
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
            <p className={`text-[15px] font-medium ${correct ? 'text-success' : 'text-warning'}`}>
              {correct ? t('prediction.correct') : t('prediction.incorrect')}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">{explanation}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-3  px-4 py-2.5">
          <span className="text-[12px] text-muted" aria-hidden="true">
            {t('prediction.continueKey')}
          </span>
          <button
            type="button"
            data-autofocus
            className="btn btn-accent h-10 px-4 text-[14px]"
            onClick={onContinue}
          >
            {t('mission.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
