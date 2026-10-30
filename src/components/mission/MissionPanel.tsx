import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Mission } from '../../content/types';
import type { RepoState } from '../../engine/types';
import { missionText, starsFor } from '../../app/mission';
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

function StarDots({ count }: { readonly count: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`${count} étoile(s) sur 3`}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn(
            'h-[5px] w-[5px] rounded-full',
            index < count ? 'bg-warning' : 'bg-border-strong/60',
          )}
        />
      ))}
    </span>
  );
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
  const texts = missionText(mission, state);
  const remainingHints = mission.hints.length - hintsUsed;
  const revealed = texts.hints.slice(0, hintsUsed);
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
          <span aria-hidden="true" className="mt-1.5 h-3.5 w-[2px] shrink-0 rounded-full bg-accent" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-mono text-[10.5px] text-muted">{mission.number}</span>
              <h2 className="truncate text-[13.5px] font-medium text-text">{mission.title}</h2>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="font-mono text-[10.5px] tabular-nums text-muted">
                {commandsUsed} / {mission.par} commandes
              </span>
              <StarDots count={stars} />
            </div>
            <p className="mt-1 text-[11.5px] leading-snug text-muted">
              <span className="text-muted/70">Situation de départ · </span>
              {mission.situation}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className="btn h-7 gap-1 px-2 text-[11.5px]"
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
              {remainingHints > 0 ? `Indice ${hintsUsed + 1}/${mission.hints.length}` : 'Indices'}
            </span>
          </button>
          <button
            type="button"
            className="btn h-7 w-7 px-0 text-[11.5px]"
            onClick={() => setCollapsed((value) => !value)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Déplier la mission' : 'Replier la mission'}
          >
            <Icon
              name="chevron"
              size={12}
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
            transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="scrollbar-thin max-h-56 overflow-y-auto px-3 pb-3">
              <div className="border-l-2 border-accent/70 pl-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="mono-meta">Objectif</p>
                  <span className="font-mono text-[10px] tabular-nums text-muted">
                    {stepsDone}/{mission.steps.length}
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-text">{texts.objective}</p>
                <ul className="mt-2 space-y-1">
                  {mission.steps.map((step) => {
                    const done = step.done(state, { entry: mission.initialState });
                    return (
                      <li
                        key={step.label}
                        className={cn(
                          'flex items-start gap-2 text-[11.5px] leading-relaxed',
                          done ? 'text-success' : 'text-muted',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'mt-[5px] h-2 w-2 shrink-0 rounded-[2px] border',
                            done ? 'border-success bg-success' : 'border-border-strong',
                          )}
                        />
                        <span className={done ? 'line-through decoration-success/40' : ''}>
                          {step.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="mt-2.5 text-[12px] leading-relaxed text-muted">{mission.story}</p>

              {revealed.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {revealed.map((hint, index) => (
                    <li
                      key={hint}
                      className="border-l-2 border-warning/60 pl-2.5 text-[11.5px] leading-relaxed text-muted"
                    >
                      <span className="font-mono text-[10px] text-warning">Indice {index + 1} · </span>
                      {hint}
                    </li>
                  ))}
                </ul>
              )}

              {mission.suggestedCommands && mission.suggestedCommands.length > 0 && (
                <details className="mt-3 border-t border-border pt-2">
                  <summary className="cursor-pointer text-[11.5px] font-medium text-text">
                    Commandes utiles ici
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {mission.suggestedCommands.map((command) => (
                      <button
                        key={command}
                        type="button"
                        onClick={() => onSuggest(command)}
                        className="rounded-md border border-border bg-panel-2 px-2 py-1 font-mono text-[10.5px] text-muted transition-colors hover:border-border-strong hover:text-text"
                        title="Pré-remplir la commande sans l’exécuter"
                      >
                        {command}
                      </button>
                    ))}
                  </div>
                </details>
              )}

              <p className="mt-2.5 text-[10.5px] text-muted/60">
                La validation se fait après chaque commande. En cas d’échec, utilise « Indice »
                pour comprendre ce qui manque.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
