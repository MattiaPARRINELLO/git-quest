import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { DemoSlide } from '../../content/types';
import { execute } from '../../engine/execute';
import type { GitEvent, RepoState } from '../../engine/types';
import { CommitGraph } from '../graph/CommitGraph';
import { explainEvent } from '../../explanations/fr';

interface DemoState {
  readonly state: RepoState;
  readonly events: readonly GitEvent[];
  readonly command?: string;
  readonly explanation?: string;
}

export function MiniDemo({ slide }: { readonly slide: DemoSlide }) {
  const [step, setStep] = useState(0);

  const states = useMemo<DemoState[]>(() => {
    const result: DemoState[] = [{ state: slide.initialState, events: [] }];
    let current = slide.initialState;
    for (const demoStep of slide.steps) {
      const executed = execute(current, demoStep.command);
      if (executed.error) {
        throw new Error(
          `Démo invalide (${demoStep.command}) : ${executed.error.message}`,
        );
      }
      current = executed.newState;
      result.push({
        state: current,
        events: executed.events,
        command: demoStep.command,
        explanation: demoStep.explanation,
      });
    }
    return result;
  }, [slide]);

  const current = states[step] ?? states[0];
  if (!current) return null;
  const done = step >= slide.steps.length;
  const lastCommand = step === 0 ? undefined : slide.steps[step - 1]?.command;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel">
      <div className="h-56 sm:h-64">
        <CommitGraph state={current.state} batch={{ id: step, events: current.events }} />
      </div>

      <div className="flex flex-col gap-2 border-t border-border px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {step === 0 ? (
            <p className="text-[12px] text-muted">État initial du dépôt. Lance la démo pour voir chaque étape.</p>
          ) : (
            <p className="font-mono text-[12px] text-text">
              <span className="text-muted/70">$ </span>
              {lastCommand}
            </p>
          )}
          {current.explanation && (
            <p className="mt-1 text-[12px] leading-relaxed text-muted">{current.explanation}</p>
          )}
          {current.events.length > 0 && (
            <p className="mt-1 text-[11px] text-muted/70">{explainEvent(current.events[0]!)}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="font-mono text-[10.5px] tabular-nums text-muted">
            {step} / {slide.steps.length}
          </span>
          {done ? (
            <button type="button" className="btn h-8 px-2.5 text-[12px]" onClick={() => setStep(0)}>
              Recommencer
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-accent h-8 px-2.5 text-[12px]"
              onClick={() => setStep(step + 1)}
            >
              Étape suivante
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DemoSlideView({ slide }: { readonly slide: DemoSlide }) {
  return (
    <div>
      <h2 className="display text-[30px] leading-[1.12] text-text">{slide.title}</h2>
      {slide.caption && <p className="mt-1.5 text-[12.5px] text-muted">{slide.caption}</p>}
      <div className="mt-4">
        <MiniDemo slide={slide} />
      </div>
    </div>
  );
}

export function AnimatedSlide({ children }: { readonly children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
