import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Mission } from '../../content/types';
import type { RepoState } from '../../engine/types';
import { starsFor } from '../../app/mission';
import { cn } from '../../lib/cn';
import { Icon } from '../ui/Icon';

interface MissionPanelProps {
  readonly mission: Mission;
  readonly state: RepoState;
  readonly commandsUsed: number;
  readonly hintsUsed: number;
  readonly onHint: () => void;
  readonly onSuggest: (command: string) => void;
}

export function MissionPanel({
  mission,
  state,
  commandsUsed,
  hintsUsed,
  onHint,
  onSuggest,
}: MissionPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const stars = starsFor(commandsUsed, mission.par);
  const remainingHints = mission.hints.length - hintsUsed;
  const revealed = mission.hints.slice(0, hintsUsed);
  const stepsDone = mission.steps.filter((step) =>
    step.done(state, { entry: mission.initialState }),
  ).length;

  return (
    <section
      className="shrink-0 border-b border-border bg-panel"
      aria-label={`Mission ${mission.number} : ${mission.title}`}
    >
      <div className="flex items-start justify-between gap-3 px-3 py-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent/40 bg-accent-soft font-mono text-[11px] font-semibold text-accent">
            {mission.number}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 className="truncate text-sm font-semibold text-text">{mission.title}</h2>
              <span className="font-mono text-[10px] text-muted">
                {commandsUsed} / {mission.par} commandes
              </span>
              <span
                className="font-mono text-[10px] text-warning"
                title={`Projection : ${stars} étoile(s)`}
              >
                {'★'.repeat(stars)}
                <span className="text-muted/40">{'★'.repeat(3 - stars)}</span>
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-muted">
              <span className="mr-1 text-[9px] uppercase tracking-wider text-muted/70">
                Situation de départ ·
              </span>
              {mission.situation}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className="btn px-2"
            onClick={onHint}
            disabled={remainingHints === 0}
            title={
              remainingHints === 0
                ? 'Tous les indices sont révélés'
                : `Indice ${hintsUsed + 1}/${mission.hints.length}`
            }
          >
            <span className="font-mono text-[10px]">?</span>
            <span className="hidden sm:inline">
              Indice {remainingHints > 0 ? `${hintsUsed + 1}/3` : ''}
            </span>
          </button>
          <button
            type="button"
            className="btn px-2"
            onClick={() => setCollapsed((value) => !value)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Déplier la mission' : 'Replier la mission'}
          >
            <Icon
              name="chevron"
              size={13}
              className={cn('transition-transform', collapsed ? 'rotate-90' : '-rotate-90')}
            />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="scrollbar-thin max-h-52 overflow-y-auto px-3 pb-3">
              <div className="rounded-lg border border-border bg-panel-2/50 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                    Objectif
                  </p>
                  <span className="font-mono text-[10px] text-muted">
                    {stepsDone}/{mission.steps.length}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text">{mission.objective}</p>
                <ul className="mt-2 space-y-1">
                  {mission.steps.map((step) => {
                    const done = step.done(state, { entry: mission.initialState });
                    return (
                      <li
                        key={step.label}
                        className={`flex items-start gap-1.5 text-[11px] leading-relaxed ${
                          done ? 'text-success' : 'text-muted'
                        }`}
                      >
                        <span className="mt-0.5 font-mono text-[10px]">{done ? '✓' : '○'}</span>
                        <span className={done ? 'line-through decoration-success/50' : ''}>
                          {step.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted">{mission.story}</p>

              {revealed.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {revealed.map((hint, index) => (
                    <li
                      key={hint}
                      className="rounded-lg border border-warning/25 bg-warning/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-warning"
                    >
                      <span className="font-mono text-[10px] opacity-70">Indice {index + 1} · </span>
                      {hint}
                    </li>
                  ))}
                </ul>
              )}


              <p className="mt-2 text-[10px] text-muted/70">
                La validation se fait après chaque commande. En cas d’échec, utilise « Indice »
                pour comprendre ce qui manque.
              </p>
            </div>
              {mission.suggestedCommands && mission.suggestedCommands.length > 0 && (
                <details className="mt-2 rounded-lg border border-border bg-panel-2/50 px-2.5 py-2">
                  <summary className="cursor-pointer text-[11px] font-medium text-text">
                    Commandes utiles ici
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {mission.suggestedCommands.map((command) => (
                      <button
                        key={command}
                        type="button"
                        onClick={() => onSuggest(command)}
                        className="rounded-md border border-border bg-panel px-2 py-1 font-mono text-[10px] text-accent-2 transition-colors hover:border-accent/50 hover:bg-accent-soft"
                        title="Pré-remplir la commande sans l’exécuter"
                      >
                        {command}
                      </button>
                    ))}
                  </div>
                </details>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
