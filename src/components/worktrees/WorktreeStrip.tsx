import { AnimatePresence, motion } from 'framer-motion';
import { useRepoStore } from '../../store/useRepoStore';
import { worktreeStatus } from '../../engine/ops/diff';
import { headLabel } from '../../lib/prompt';
import { cn } from '../../lib/cn';
import { useTranslation } from '../../i18n/useTranslation';

export function WorktreeStrip() {
  const { t } = useTranslation();
  const state = useRepoStore((store) => store.state);
  const execute = useRepoStore((store) => store.execute);

  const worktrees = Object.values(state.worktrees);
  if (worktrees.length <= 1) return null;

  return (
    <section
      aria-label={t('worktree.title')}
      className="shrink-0  bg-panel px-3 py-2.5"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[12px] font-medium text-text">
          <span aria-hidden="true" className="h-3 w-[2px] rounded-full bg-accent" />
          {t('worktree.title')}
        </h2>
        <span className="text-[12px] text-muted">{t('worktree.clickHint')}</span>
      </div>

      <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
        <AnimatePresence initial={false}>
          {worktrees.map((worktree) => {
            const status = worktreeStatus(state, worktree);
            const modified = status.staged.length + status.unstaged.length + status.untracked.length;
            const active = worktree.id === state.activeWorktree;

            return (
              <motion.button
                key={worktree.id}
                type="button"
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22 }}
                onClick={() => execute(`cd ${worktree.path}`)}
                aria-pressed={active}
                aria-label={t('worktree.goAria', { path: worktree.path })}
                className={cn(
                  'group flex min-w-[190px] max-w-[260px] flex-col gap-1  border px-3 py-2 text-left transition-colors',
                  active
                    ? 'border-accent/70 bg-accent-soft'
                    : 'border-border bg-panel-2 hover:border-border-strong',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] text-text">{worktree.path}</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[12px]',
                      active ? 'bg-accent/20 text-accent' : 'bg-panel-3 text-muted',
                    )}
                  >
                    {active ? t('worktree.active') : t('worktree.cd')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] text-muted">
                    {headLabel(worktree.head)}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-[12px]',
                      modified > 0 ? 'text-warning' : 'text-muted/70',
                    )}
                  >
                    {modified === 0
                      ? t('worktree.clean')
                      : t('worktree.modified', { count: modified })}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
