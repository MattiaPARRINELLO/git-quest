import { AnimatePresence, motion } from 'framer-motion';
import { useRepoStore } from '../../store/useRepoStore';
import { headCommitOf, snapshotOf } from '../../engine/ops/refs';
import { worktreeStatus } from '../../engine/ops/diff';
import type { FileChange } from '../../engine/ops/diff';
import { cn } from '../../lib/cn';

type ChipStatus = 'new' | 'modified' | 'deleted' | 'staged' | 'committed';

const CHIP_STYLES: Record<ChipStatus, string> = {
  new: 'border-sky-400/40 bg-sky-400/10 text-sky-300',
  modified: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  deleted: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
  staged: 'border-violet-400/50 bg-violet-400/10 text-violet-200',
  committed: 'border-border bg-panel-2 text-muted',
};

const STATUS_LABEL: Record<ChipStatus, string> = {
  new: 'nouveau',
  modified: 'modifié',
  deleted: 'supprimé',
  staged: 'stagé',
  committed: 'commit',
};

interface Chip {
  readonly path: string;
  readonly status: ChipStatus;
  readonly testId: string;
  /** Anime le déplacement working dir -> staging (fichiers absents de HEAD). */
  readonly flow?: boolean;
}

function changeStatus(change: FileChange): ChipStatus {
  if (change.status === 'added') return 'new';
  if (change.status === 'deleted') return 'deleted';
  return 'modified';
}

function Zone({
  title,
  subtitle,
  chips,
  emptyLabel,
  accent,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly chips: readonly Chip[];
  readonly emptyLabel: string;
  readonly accent: string;
}) {
  return (
    <section className="flex min-h-[92px] min-w-0 flex-1 flex-col rounded-xl border border-border bg-panel-2/60 sm:min-h-0">
      <header className="flex items-baseline justify-between gap-2 border-b border-border/70 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text">{title}</h3>
        </div>
        <span className="font-mono text-[10px] text-muted">{subtitle}</span>
      </header>
      <div className="scrollbar-thin flex min-h-0 flex-1 flex-wrap content-start gap-1.5 overflow-y-auto p-2">
        {chips.length === 0 && (
          <span className="px-1 py-1 text-[11px] italic text-muted/70">{emptyLabel}</span>
        )}
        <AnimatePresence initial={false}>
          {chips.map((chip) => (
            <motion.span
              key={`${chip.testId}-${chip.path}`}
              layout
              {...(chip.flow ? { layoutId: `flow-${chip.path}` } : {})}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.22 }}
              className={cn(
                'inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10.5px]',
                CHIP_STYLES[chip.status],
              )}
              title={`${chip.path} — ${STATUS_LABEL[chip.status]}`}
            >
              <span className="opacity-60">
                {chip.status === 'deleted' ? '−' : chip.status === 'new' ? '+' : '•'}
              </span>
              <span className="truncate">{chip.path}</span>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

export function StagingPipeline() {
  const state = useRepoStore((store) => store.state);
  const worktree = state.worktrees[state.activeWorktree];

  if (!worktree) {
    return (
      <div className="border-t border-border bg-panel px-3 py-4 text-xs text-muted">
        Aucun worktree actif.
      </div>
    );
  }

  const status = worktreeStatus(state, worktree);
  const headSnapshot = snapshotOf(state, headCommitOf(state, worktree.head));

  const headPaths = new Set(Object.keys(headSnapshot));
  const workingChips: Chip[] = [
    ...status.untracked.map((path) => ({
      path,
      status: 'new' as const,
      testId: 'working',
      flow: true,
    })),
    ...status.unstaged.map((change) => ({
      path: change.path,
      status: changeStatus(change),
      testId: 'working',
      flow: !headPaths.has(change.path),
    })),
  ];

  const stagingChips: Chip[] = status.staged.map((change) => ({
    path: change.path,
    status: 'staged',
    testId: 'staging',
    flow: !headPaths.has(change.path),
  }));

  const commitChips: Chip[] = Object.keys(headSnapshot)
    .sort()
    .map((path) => ({ path, status: 'committed' as const, testId: 'commit' }));

  return (
    <section className="flex shrink-0 flex-col gap-2 border-t border-border bg-panel px-2 py-2.5 sm:h-[210px] sm:px-3">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Pipeline
          </h2>
          <span className="rounded border border-border bg-panel-2 px-1.5 py-0.5 font-mono text-[10px] text-text">
            {worktree.path}
          </span>
        </div>
        <span className="hidden font-mono text-[10px] text-muted sm:inline">
          working dir → index → dernier commit
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row">
        <Zone
          title="Working dir"
          subtitle={`${workingChips.length} fichier${workingChips.length > 1 ? 's' : ''}`}
          chips={workingChips}
          emptyLabel="Aucune modification locale"
          accent="var(--warning)"
        />
        <div className="hidden items-center text-muted/50 sm:flex" aria-hidden="true">
          →
        </div>
        <Zone
          title="Staging"
          subtitle={`${stagingChips.length} indexé${stagingChips.length > 1 ? 's' : ''}`}
          chips={stagingChips}
          emptyLabel="Index vide"
          accent="var(--accent)"
        />
        <div className="hidden items-center text-muted/50 sm:flex" aria-hidden="true">
          →
        </div>
        <Zone
          title="Dernier commit"
          subtitle={`${commitChips.length} fichier${commitChips.length > 1 ? 's' : ''}`}
          chips={commitChips}
          emptyLabel="Aucun commit"
          accent="var(--success)"
        />
      </div>
    </section>
  );
}
