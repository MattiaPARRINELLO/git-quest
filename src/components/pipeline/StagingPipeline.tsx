import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRepoStore } from '../../store/useRepoStore';
import { headCommitOf, snapshotOf } from '../../engine/ops/refs';
import { worktreeStatus } from '../../engine/ops/diff';
import type { FileChange } from '../../engine/ops/diff';
import { cn } from '../../lib/cn';

type ChipStatus = 'new' | 'modified' | 'deleted' | 'staged' | 'committed';
type ChipZone = 'working' | 'staging' | 'commit';

const CHIP_STYLES: Record<ChipStatus, string> = {
  new: 'border-success/35 bg-success/10 text-success',
  modified: 'border-warning/35 bg-warning/10 text-warning',
  deleted: 'border-danger/35 bg-danger/10 text-danger',
  staged: 'border-accent/40 bg-accent-soft text-accent',
  committed: 'border-border bg-panel text-muted',
};

const STATUS_LABEL: Record<ChipStatus, string> = {
  new: 'nouveau',
  modified: 'modifié',
  deleted: 'supprimé',
  staged: 'stagé',
  committed: 'commit',
};

const ZONE_LABEL: Record<ChipZone, string> = {
  working: 'Working dir',
  staging: 'Index',
  commit: 'Dernier commit',
};

interface Chip {
  readonly path: string;
  readonly status: ChipStatus;
  readonly zone: ChipZone;
  /** Anime le déplacement working dir -> staging (fichiers absents de HEAD). */
  readonly flow?: boolean;
  readonly diffLabel?: string;
}

interface Preview {
  readonly path: string;
  readonly zone: ChipZone;
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
  onHover,
  onLeave,
  onPin,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly chips: readonly Chip[];
  readonly emptyLabel: string;
  readonly accent: string;
  readonly onHover: (chip: Chip) => void;
  readonly onLeave: () => void;
  readonly onPin: (chip: Chip) => void;
}) {
  return (
    <section className="flex min-h-[92px] min-w-0 flex-1 flex-col bg-panel-2/40 sm:min-h-0">
      <header className="flex items-baseline justify-between gap-2  px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
          <h3 className="text-[12px] font-medium text-text">{title}</h3>
        </div>
        <span className="mono-meta">{subtitle}</span>
      </header>
      <div className="scrollbar-thin flex min-h-0 flex-1 flex-wrap content-start gap-1.5 overflow-y-auto p-2">
        {chips.length === 0 && (
          <span className="px-1 py-1 text-[13px] text-muted/60">{emptyLabel}</span>
        )}
        <AnimatePresence initial={false}>
          {chips.map((chip) => (
            <motion.button
              type="button"
              key={`${chip.zone}-${chip.path}`}
              layout
              {...(chip.flow ? { layoutId: `flow-${chip.path}` } : {})}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.22 }}
              className={cn(
                'inline-flex max-w-full items-center gap-1  border px-1.5 py-0.5 text-left text-[13px] transition-colors hover:border-border-strong',
                CHIP_STYLES[chip.status],
              )}
              aria-label={`${ZONE_LABEL[chip.zone]} — ${chip.path}`}
              title={`${chip.path} — ${STATUS_LABEL[chip.status]} (${ZONE_LABEL[chip.zone]})`}
              onMouseEnter={() => onHover(chip)}
              onMouseLeave={onLeave}
              onFocus={() => onHover(chip)}
              onClick={() => onPin(chip)}
            >
              <span className="opacity-60">
                {chip.status === 'deleted' ? '−' : chip.status === 'new' ? '+' : '•'}
              </span>
              <span className="truncate">{chip.path}</span>
              {chip.diffLabel && (
                <span className="shrink-0 rounded bg-warning/15 px-1 text-[12px] text-warning">
                  {chip.diffLabel}
                </span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

export function StagingPipeline() {
  const state = useRepoStore((store) => store.state);
  const worktree = state.worktrees[state.activeWorktree];
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pinned, setPinned] = useState(false);

  if (!worktree) {
    return (
      <div className=" bg-panel px-3 py-4 text-xs text-muted">
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
      zone: 'working' as const,
      flow: true,
      diffLabel: 'non suivi',
    })),
    ...status.unstaged.map((change) => ({
      path: change.path,
      status: changeStatus(change),
      zone: 'working' as const,
      flow: !headPaths.has(change.path),
      ...(worktree.index[change.path] === worktree.workingDir[change.path]
        ? {}
        : { diffLabel: '≠ index' }),
    })),
  ];

  const stagingChips: Chip[] = status.staged.map((change) => ({
    path: change.path,
    status: 'staged',
    zone: 'staging',
    flow: !headPaths.has(change.path),
    ...(headPaths.has(change.path) ? { diffLabel: '≠ dernier commit' } : { diffLabel: 'nouveau' }),
  }));

  const commitChips: Chip[] = Object.keys(headSnapshot)
    .sort()
    .map((path) => ({ path, status: 'committed' as const, zone: 'commit' }));

  const contentFor = (target: Preview): string | undefined => {
    if (target.zone === 'working') return worktree.workingDir[target.path];
    if (target.zone === 'staging') return worktree.index[target.path];
    return headSnapshot[target.path];
  };

  const hover = (chip: Chip): void => {
    setPreview({ path: chip.path, zone: chip.zone });
  };

  const leave = (): void => {
    if (!pinned) setPreview(null);
  };

  const pin = (chip: Chip): void => {
    setPinned(true);
    setPreview({ path: chip.path, zone: chip.zone });
  };

  const previewContent = preview === null ? undefined : contentFor(preview);

  return (
    <section
      className="relative flex shrink-0 flex-col gap-2 bg-panel px-5 py-3 sm:h-[210px]"
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || preview === null) return;
        event.preventDefault();
        setPinned(false);
        setPreview(null);
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-[2px] rounded-full bg-accent" />
          <h2 className="text-[13.5px] font-medium text-text">Pipeline</h2>
          <span className="text-[13px] text-muted">{worktree.path}</span>
        </div>
        <span className="hidden text-[12.5px] text-muted sm:inline">
          survol ou clic pour voir un fichier
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row">
        <Zone
          title="Working dir"
          subtitle={`${workingChips.length} fichier${workingChips.length > 1 ? 's' : ''}`}
          chips={workingChips}
          emptyLabel="Aucune modification locale"
          accent="var(--warning)"
          onHover={hover}
          onLeave={leave}
          onPin={pin}
        />
        <div className="hidden items-center text-muted/40 sm:flex" aria-hidden="true">
          <span className="text-[14px]">→</span>
        </div>
        <Zone
          title="Staging"
          subtitle={`${stagingChips.length} indexé${stagingChips.length > 1 ? 's' : ''}`}
          chips={stagingChips}
          emptyLabel="Index vide"
          accent="var(--accent)"
          onHover={hover}
          onLeave={leave}
          onPin={pin}
        />
        <div className="hidden items-center text-muted/40 sm:flex" aria-hidden="true">
          <span className="text-[14px]">→</span>
        </div>
        <Zone
          title="Dernier commit"
          subtitle={`${commitChips.length} fichier${commitChips.length > 1 ? 's' : ''}`}
          chips={commitChips}
          emptyLabel="Aucun commit"
          accent="var(--success)"
          onHover={hover}
          onLeave={leave}
          onPin={pin}
        />
      </div>

      {preview && (
        <div className="absolute bottom-2 right-2 z-30 w-[min(22rem,calc(100%-1rem))] overflow-hidden -strong bg-panel sm:right-3">
          <header className="flex items-center justify-between gap-2 px-1 py-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 rounded bg-panel-2 px-1 py-0.5 text-[13px] text-muted">
                {ZONE_LABEL[preview.zone]}
              </span>
              <span className="truncate text-[13px] text-text">{preview.path}</span>
            </div>
            <button
              type="button"
              className="shrink-0 rounded px-1 text-xs text-muted hover:text-text"
              onClick={() => {
                setPinned(false);
                setPreview(null);
              }}
              aria-label="Fermer l’aperçu"
            >
              ×
            </button>
          </header>
          <pre
            aria-live="polite"
            className="scrollbar-thin max-h-24 overflow-auto whitespace-pre-wrap break-words px-3 py-2 text-[12.5px] leading-relaxed text-muted"
          >
            {previewContent === undefined ? '— absent dans cette zone' : previewContent || '(fichier vide)'}
          </pre>
        </div>
      )}
    </section>
  );
}
