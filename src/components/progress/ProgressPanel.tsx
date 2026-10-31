import type { ProgressSummary } from '../../app/xp';
import { Icon } from '../ui/Icon';
import { cn } from '../../lib/cn';

interface ProgressPanelProps {
  readonly summary: ProgressSummary;
  /** Version compacte pour l'écran de fin. */
  readonly compact?: boolean;
}

/** Niveau, XP et badges : tout est dérivé de la progression enregistrée. */
export function ProgressPanel({ summary, compact = false }: ProgressPanelProps) {
  const { level, xp, badges, unlockedBadges } = summary;
  const remaining = level.span === 0 ? 0 : Math.max(0, level.nextAt - xp);

  return (
    <section
      className={cn('rounded-xl border border-border bg-panel', compact ? 'p-4' : 'mt-4 p-4')}
      aria-label="Niveau et badges"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex items-center gap-2 text-[11.5px] text-muted">
          <span aria-hidden="true" className="h-3 w-[2px] rounded-full bg-accent" />
          Niveau {level.level} · <span className="text-text">{level.title}</span>
        </p>
        <span className="font-mono text-[11.5px] tabular-nums text-muted">
          {xp} XP
          {level.span === 0 ? (
            <span className="text-text"> · niveau maximum</span>
          ) : (
            <span> · {remaining} XP avant {level.level + 1}</span>
          )}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-panel-3">
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${level.percent}%` }}
          />
        </span>
        <span className="font-mono text-[11px] tabular-nums text-muted">{level.percent}%</span>
      </div>

      <div className="mt-3.5 flex items-baseline justify-between gap-2 border-t border-border pt-3">
        <span className="mono-meta">Badges</span>
        <span className="mono-meta tabular-nums">
          {unlockedBadges} / {badges.length}
        </span>
      </div>

      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {badges.map((badge) => (
          <li
            key={badge.id}
            className={cn(
              'flex items-start gap-2 rounded-md px-1.5 py-1',
              badge.unlocked ? 'bg-panel-2/60' : 'opacity-60',
            )}
            title={badge.description}
          >
            <Icon
              name={badge.unlocked ? 'award' : 'lock'}
              size={12}
              className={cn('mt-0.5 shrink-0', badge.unlocked ? 'text-warning' : 'text-muted')}
            />
            <span className="min-w-0">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[12px] text-text">{badge.title}</span>
                {badge.counter !== null && (
                  <span className="font-mono text-[10px] tabular-nums text-muted">
                    {badge.counter.done} / {badge.counter.total}
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                {badge.description}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
