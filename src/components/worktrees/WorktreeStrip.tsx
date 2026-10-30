import { AnimatePresence, motion } from 'framer-motion';
import { useRepoStore } from '../../store/useRepoStore';
import { worktreeStatus } from '../../engine/ops/diff';
import { headLabel } from '../../lib/prompt';
import { cn } from '../../lib/cn';

export function WorktreeStrip() {
  const state = useRepoStore((store) => store.state);
  const execute = useRepoStore((store) => store.execute);

  const worktrees = Object.values(state.worktrees);
  if (worktrees.length <= 1) return null;

  return (
    <section
      aria-label="Worktrees"
      className="shrink-0 border-b border-border bg-panel px-3 py-2.5"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted">
          Worktrees
        </h2>
        <span className="font-mono text-[10px] text-muted">
          cliquer = <span className="text-text">cd &lt;chemin&gt;</span>
        </span>
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
                aria-label={`Aller au worktree ${worktree.path}`}
                className={cn(
                  'group flex min-w-[190px] max-w-[260px] flex-col gap-1 rounded-xl border px-3 py-2 text-left transition-colors',
                  active
                    ? 'border-accent/70 bg-accent-soft'
                    : 'border-border bg-panel-2 hover:border-border-strong',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[11px] text-text">{worktree.path}</span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 font-mono text-[10px]',
                      active ? 'bg-accent/20 text-accent' : 'bg-panel-3 text-muted',
                    )}
                  >
                    {active ? 'actif' : 'cd'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[10.5px] text-muted">
                    {headLabel(worktree.head)}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 font-mono text-[10px]',
                      modified > 0 ? 'text-warning' : 'text-muted/70',
                    )}
                  >
                    {modified === 0 ? 'propre' : `${modified} modif.`}
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
