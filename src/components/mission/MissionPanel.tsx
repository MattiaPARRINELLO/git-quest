import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Mission } from '../../content/types';
import type { RepoState } from '../../engine/types';
import { missionText, starsFor } from '../../app/mission';
import { useMediaQuery } from '../../hooks/useMediaQuery';
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
    <span className="inline-flex items-center gap-1" aria-label={`${count} étoile(s) sur 3`}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn('h-[7px] w-[7px]', index < count ? 'bg-warning' : 'bg-border-strong/50')}
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
  // Sur mobile la mission démarre en version mini : le terminal garde la place.
  const compact = useMediaQuery('(max-width: 767px)');
  const [collapsed, setCollapsed] = useState(compact);
  const stars = starsFor(commandsUsed, mission.par);
  const texts = missionText(mission, state);
  const remainingHints = mission.hints.length - hintsUsed;
  const revealed = texts.hints.slice(0, hintsUsed);
  const stepsDone = mission.steps.filter((step) =>
    step.done(state, { entry: mission.initialState }),
  ).length;

  return (
    <section className="shrink-0 bg-panel" aria-label={`Mission ${mission.number} : ${mission.title}`}>
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[13px] text-muted">
            Mission {mission.number} · {commandsUsed} / {mission.par} commandes
          </p>
          <h1 className="mt-0.5 text-[17px] font-medium leading-snug text-text">{mission.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <StarDots count={stars} />
            <span className="text-[13px] text-muted">
              {stepsDone} / {mission.steps.length} étapes
            </span>
          </div>
          <p className="mt-1.5 hidden text-[13.5px] leading-snug text-muted md:block">
            {mission.situation}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="btn btn-quiet h-9 gap-1.5 px-3 text-[13px]"
            onClick={onHint}
            disabled={remainingHints === 0}
            title={
              remainingHints === 0
                ? 'Tous les indices sont révélés'
                : `Indice ${hintsUsed + 1}/${mission.hints.length}`
            }
          >
            <span aria-hidden="true">?</span>
            <span className="hidden sm:inline">
              {remainingHints > 0 ? `Indice ${hintsUsed + 1}/${mission.hints.length}` : 'Indices'}
            </span>
          </button>
          <button
            type="button"
            className="btn btn-quiet h-9 w-9 px-0"
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
            transition={{ duration: 0.18, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="scrollbar-thin max-h-[45dvh] overflow-y-auto px-4 pb-4 md:max-h-60">
              <p className="text-[13px] text-muted">Objectif</p>
              <p className="mt-1.5 bg-panel-2 px-3 py-2.5 text-[14px] leading-relaxed text-text">
                {texts.objective}
              </p>

              <ul className="mt-3 space-y-2">
                {mission.steps.map((step) => {
                  const done = step.done(state, { entry: mission.initialState });
                  return (
                    <li
                      key={step.label}
                      className={cn(
                        'flex items-start gap-2.5 text-[13.5px] leading-relaxed',
                        done ? 'text-success' : 'text-muted',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-[6px] h-2.5 w-2.5 shrink-0',
                          done ? 'bg-success' : 'bg-border-strong',
                        )}
                      />
                      <span className={done ? 'line-through decoration-success/40' : ''}>
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{mission.story}</p>

              {revealed.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {revealed.map((hint, index) => (
                    <li
                      key={hint}
                      className="bg-warning/10 px-3 py-2 text-[13.5px] leading-relaxed text-text"
                    >
                      <span className="text-warning">Indice {index + 1} · </span>
                      {hint}
                    </li>
                  ))}
                </ul>
              )}

              {mission.suggestedCommands && mission.suggestedCommands.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-[13.5px] font-medium text-text">
                    Commandes utiles ici
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {mission.suggestedCommands.map((command) => (
                      <button
                        key={command}
                        type="button"
                        onClick={() => onSuggest(command)}
                        className="bg-panel-2 px-2.5 py-1.5 text-[13px] text-muted transition-colors hover:text-text"
                        title="Pré-remplir la commande sans l’exécuter"
                      >
                        {command}
                      </button>
                    ))}
                  </div>
                </details>
              )}

              <p className="mt-3 text-[13px] leading-relaxed text-muted">
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
