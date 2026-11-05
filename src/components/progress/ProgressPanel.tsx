import type { ProgressSummary } from '../../app/xp';
import { Icon } from '../ui/Icon';
import { cn } from '../../lib/cn';
import { useTranslation } from '../../i18n/useTranslation';

interface ProgressPanelProps {
  readonly summary: ProgressSummary;
  /** Version compacte pour l'écran de fin. */
  readonly compact?: boolean;
}

/** Niveau, XP et badges : tout est dérivé de la progression enregistrée. */
export function ProgressPanel({ summary, compact = false }: ProgressPanelProps) {
  const { t } = useTranslation();
  const { level, xp, badges, unlockedBadges } = summary;
  const remaining = level.span === 0 ? 0 : Math.max(0, level.nextAt - xp);

  return (
    <section
      className={cn('bg-panel-2 p-6', compact ? '' : 'mt-4')}
      aria-label={t('progress.panelAria')}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <p className="text-[17px] text-text">
          {t('progress.level', { level: level.level, title: level.title })}
        </p>
        <p className="text-[14px] tabular-nums text-muted">
          {xp} XP
          {level.span === 0 ? (
            <span className="text-text">{t('progress.maxLevel')}</span>
          ) : (
            <span>
              {t('progress.toNext', {
                xp: remaining,
                next: level.level + 1,
              })}
            </span>
          )}
        </p>
      </div>

      <div className="mt-3 h-1 w-full bg-panel-3">
        <span
          className="block h-full bg-accent transition-[width] duration-500"
          style={{ width: `${level.percent}%` }}
        />
      </div>

      <p className="mt-6 text-[13.5px] text-muted">
        {t('progress.badges', { unlocked: unlockedBadges, total: badges.length })}
      </p>

      <ul className="mt-3 grid gap-x-10 gap-y-3 sm:grid-cols-2">
        {badges.map((badge) => (
          <li
            key={badge.id}
            className={cn('flex items-start gap-2.5', badge.unlocked ? '' : 'opacity-60')}
            title={badge.description}
          >
            <Icon
              name={badge.unlocked ? 'award' : 'lock'}
              size={14}
              className={cn('mt-1 shrink-0', badge.unlocked ? 'text-warning' : 'text-muted')}
            />
            <span className="min-w-0">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[14.5px] text-text">{badge.title}</span>
                {badge.counter !== null && (
                  <span className="text-[13px] tabular-nums text-muted">
                    {badge.counter.done} / {badge.counter.total}
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                {badge.description}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
