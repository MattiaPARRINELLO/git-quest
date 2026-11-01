import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useDialogKeyboard } from '../../hooks/useDialogKeyboard';
import type { AfterMission } from '../../content/index';
import type { Mission } from '../../content/types';
import { routePaths } from '../../router/useHashRoute';
import { Icon } from '../ui/Icon';
import { cn } from '../../lib/cn';

interface MissionCompleteProps {
  readonly mission: Mission;
  readonly stars: 1 | 2 | 3;
  readonly commandsUsed: number;
  readonly after: AfterMission;
  readonly onInspect: () => void;
  /** Solution affichée, hashes résolus depuis l'état du joueur. */
  readonly solution?: readonly string[];
  /** Épilogue narratif de l'épisode. */
  readonly outcome?: string;
  /** Accroche vers la mission suivante. */
  readonly teaser?: string;
}

export function afterHref(after: AfterMission): string {
  return after.kind === 'mission'
    ? routePaths.mission(after.mission.id)
    : after.kind === 'lesson'
      ? routePaths.interlude(after.chapter.id)
      : routePaths.home;
}

/**
 * Barre compacte affichée à la place du panneau de fin quand on l'a réduit
 * pour inspecter l'arbre : elle garde le chemin vers la suite accessible.
 */
export function MissionCompleteBar({
  mission,
  stars,
  after,
  onResume,
}: {
  readonly mission: Mission;
  readonly stars: 1 | 2 | 3;
  readonly after: AfterMission;
  readonly onResume: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3">
      <div className="pointer-events-auto flex w-full max-w-lg flex-wrap items-center justify-between gap-2 rounded-2xl border border-success/40 bg-panel px-3 py-2 ">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[13px] text-success">
            Mission accomplie
          </span>
          <span className="flex items-center gap-1" aria-label={`${stars} étoile(s) sur 3`}>
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={cn('h-2.5 w-2.5', index < stars ? 'bg-warning' : 'bg-border-strong/50')}
              />
            ))}
          </span>
          <span className="truncate text-[13px] text-muted">
            {mission.number} — {mission.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn px-2 py-1 text-[13px]" onClick={onResume}>
            Revoir
          </button>
          <a href={afterHref(after)} className="btn btn-accent px-2 py-1 text-[13px]">
            Continuer
            <Icon name="arrow-right" size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

export function MissionComplete({
  mission,
  stars,
  commandsUsed,
  after,
  onInspect,
  solution = mission.solution,
  outcome,
  teaser,
}: MissionCompleteProps) {
  const dialog = useRef<HTMLDivElement>(null);
  useDialogKeyboard(dialog, { onCancel: onInspect });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/85 p-4">
      <motion.div
        ref={dialog}
        tabIndex={-1}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
        className="scrollbar-thin max-h-[90vh] w-full max-w-xl overflow-y-auto bg-panel  outline-none"
        role="dialog"
        aria-modal="true"
        aria-label={`Mission ${mission.number} réussie`}
      >
        <header className="flex items-center justify-between gap-2  px-5 py-3">
          <span className="flex items-center gap-2 text-[12px] text-success">
            <span aria-hidden="true" className="h-1.5 w-1.5  bg-success" />
            Mission accomplie
          </span>
          <button type="button" className="btn btn-quiet h-9 px-3 text-[13px]" onClick={onInspect}>
            Inspecter
          </button>
        </header>

        <div className="px-5 py-4">
          <span className="text-[13px] text-muted">Mission {mission.number}</span>
          <h2 className="display mt-1 text-[32px] leading-[1.12] text-text">{mission.title}</h2>

          <div className="mt-3 flex items-center gap-4  py-2.5">
            <div className="flex items-center gap-1" aria-label={`${stars} étoile(s) sur 3`}>
              {[1, 2, 3].map((value) => (
                <motion.span
                  key={value}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.06 * value, duration: 0.22 }}
                  className={cn(
                    'h-3.5 w-3.5',
                    value <= stars ? 'bg-warning' : 'bg-border-strong/50',
                  )}
                />
              ))}
            </div>
            <p className="text-[13px] tabular-nums text-muted">
              {commandsUsed} commande{commandsUsed > 1 ? 's' : ''} · par {mission.par}
            </p>
          </div>

          {mission.takeaway && (
            <div className="mt-3 border-l-2 border-accent pl-3">
              <p className="mono-meta">Ce que tu dois remarquer</p>
              <p className="mt-1 text-[13px] leading-relaxed text-text">{mission.takeaway}</p>
            </div>
          )}

          {mission.successNote && (
            <p className="mt-3 border-l-2 border-success/60 pl-3 text-[12.5px] leading-relaxed text-success">
              {mission.successNote}
            </p>
          )}

          {outcome !== undefined && (
            <p className="display mt-3 text-[15px] leading-7 text-text/85">{outcome}</p>
          )}

          {teaser !== undefined && (
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              <span className="text-text">À suivre · </span>
              {teaser}
            </p>
          )}

          <div className="mt-4">
            <h3 className="flex items-center gap-1.5 text-[13.5px] text-muted">
              <Icon name="book" size={12} />
              Solution de référence
            </h3>
            <ol className="mt-1.5  ">
              {solution.map((command, index) => (
                <li
                  key={`${command}-${index}`}
                  className="flex items-baseline gap-3 py-1.5 text-[13.5px]"
                >
                  <span className="w-4 shrink-0 text-right text-[12px] tabular-nums text-muted">
                    {index + 1}
                  </span>
                  <code className="break-all text-text">{command}</code>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2  px-5 py-3 sm:flex-row sm:justify-end">
          <a href={routePaths.home} className="btn btn-quiet h-11 justify-center px-4 text-[14px]">
            Carte des chapitres
          </a>
          <a
            href={afterHref(after)}
            data-autofocus
            className="btn btn-accent h-9 justify-center px-3.5 text-[13px]"
          >
            Continuer
            <Icon name="arrow-right" size={15} />
          </a>
        </div>

        <p className="mt-3 text-center text-[12px] text-muted/80" aria-hidden="true">
          Entrée pour continuer · Échap pour rester dans le dépôt
        </p>
      </motion.div>
    </div>
  );
}
