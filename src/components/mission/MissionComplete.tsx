import { motion } from 'framer-motion';
import type { AfterMission } from '../../content/index';
import type { Mission } from '../../content/types';
import { routePaths } from '../../router/useHashRoute';
import { Icon } from '../ui/Icon';

interface MissionCompleteProps {
  readonly mission: Mission;
  readonly stars: 1 | 2 | 3;
  readonly commandsUsed: number;
  readonly after: AfterMission;
  readonly onInspect: () => void;
  /** Solution affichée, hashes résolus depuis l'état du joueur. */
  readonly solution?: readonly string[];
}

export function MissionComplete({
  mission,
  stars,
  commandsUsed,
  after,
  onInspect,
  solution = mission.solution,
}: MissionCompleteProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="scrollbar-thin max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-panel p-5 shadow-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label={`Mission ${mission.number} réussie`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-success">
            Mission accomplie
          </span>
          <button type="button" className="btn px-2 py-1 text-[11px]" onClick={onInspect}>
            Inspecter
          </button>
        </div>

        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text">
          {mission.number} — {mission.title}
        </h2>

        <div className="mt-4 flex items-center justify-center gap-2 py-2 text-4xl" aria-label={`${stars} étoile(s) sur 3`}>
          {[1, 2, 3].map((value) => (
            <motion.span
              key={value}
              initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.12 * value, type: 'spring', stiffness: 220, damping: 15 }}
              className={value <= stars ? 'text-warning' : 'text-muted/25'}
            >
              ★
            </motion.span>
          ))}
        </div>

        <p className="text-center text-xs text-muted">
          {commandsUsed} commande{commandsUsed > 1 ? 's' : ''} utilisée{commandsUsed > 1 ? 's' : ''} · par{' '}
          {mission.par}
        </p>

        {mission.takeaway && (
          <div className="mt-3 rounded-xl border border-accent/25 bg-accent-soft px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
              Ce que tu dois remarquer
            </p>
            <p className="mt-1 text-xs leading-relaxed text-text">{mission.takeaway}</p>
          </div>
        )}

        {mission.successNote && (
          <p className="mt-3 rounded-xl border border-success/25 bg-success/10 px-3 py-2 text-xs leading-relaxed text-success">
            {mission.successNote}
          </p>
        )}

        <div className="mt-4">
          <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted">
            <Icon name="book" size={12} />
            Solution de référence
          </h3>
          <ol className="mt-2 space-y-1">
            {solution.map((command, index) => (
              <li
                key={`${command}-${index}`}
                className="flex items-baseline gap-2 rounded-lg border border-border bg-panel-2/50 px-2.5 py-1.5 font-mono text-[11px] text-accent-2"
              >
                <span className="text-muted/60">{index + 1}.</span>
                <span className="break-all">{command}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <a href={routePaths.home} className="btn justify-center px-3 py-2 text-sm">
            Carte des chapitres
          </a>
          <a
            href={
              after.kind === 'mission'
                ? routePaths.mission(after.mission.id)
                : after.kind === 'lesson'
                  ? routePaths.lesson(after.chapter.id)
                  : routePaths.home
            }
            className="btn btn-accent justify-center px-3 py-2 text-sm"
          >
            Continuer
            <Icon name="arrow-right" size={15} />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
