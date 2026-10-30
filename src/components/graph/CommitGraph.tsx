import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode, WheelEvent as ReactWheelEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { RepoState, GitEvent } from '../../engine/types';
import { branchColor } from '../../lib/colors';
import { layoutGraph, PADDING_X } from './layout';
import type { BranchLabel, GraphNode } from './layout';
import { Icon } from '../ui/Icon';

interface CommitGraphProps {
  readonly state: RepoState;
  readonly batch: { readonly id: number; readonly events: readonly GitEvent[] };
  /** Contenu flottant au-dessus du graphe (prédiction, feedback). */
  readonly overlay?: ReactNode;
  readonly onSelectCommit?: (hash: string) => void;
  readonly onSelectBranch?: (name: string) => void;
}

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

function clampScale(scale: number): number {
  return Math.min(2, Math.max(0.45, scale));
}

function eventDelays(events: readonly GitEvent[]): {
  commits: Map<string, number>;
  branches: Map<string, number>;
} {
  const commits = new Map<string, number>();
  const branches = new Map<string, number>();
  events.forEach((event, index) => {
    const delay = Math.min(index * 0.12, 0.6);
    if ('commit' in event && typeof event.commit === 'string') commits.set(event.commit, delay);
    if (event.type === 'branch-created' || event.type === 'branch-moved') {
      branches.set(event.name, delay);
    }
    if (event.type === 'branch-deleted') branches.set(event.name, delay);
  });
  return { commits, branches };
}

function targetFromEvents(events: readonly GitEvent[]): string | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event) continue;
    if (event.type === 'commit-created' || event.type === 'merge-commit') return event.commit;
    if (event.type === 'head-detached') return event.commit;
    if (event.type === 'head-attached') return event.commit;
    if (event.type === 'branch-created') return event.commit;
    if (event.type === 'branch-moved') return event.to;
    if (event.type === 'merge-fast-forward') return event.to;
  }
  return null;
}

function nodeLabelWidth(name: string): number {
  return Math.max(34, name.length * 6.6 + 18);
}

export function CommitGraph({
  state,
  batch,
  overlay,
  onSelectCommit,
  onSelectBranch,
}: CommitGraphProps) {
  const layout = useMemo(() => layoutGraph(state), [state]);
  const delays = useMemo(() => eventDelays(batch.events), [batch]);
  const prefersReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [view, setView] = useState<Viewport>({ x: 24, y: 12, scale: 1 });
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const lastBatchId = useRef(batch.id);
  const initialized = useRef(false);

  const duration = prefersReducedMotion || reducedMotion ? 0 : 0.36;

  const activeHeadNode = useMemo(() => {
    const worktree = state.worktrees[state.activeWorktree];
    if (!worktree) return undefined;
    const hash =
      worktree.head.kind === 'branch'
        ? state.branches[worktree.head.branch]
        : worktree.head.commit;
    return layout.nodes.find((node) => node.hash === hash);
  }, [layout.nodes, state]);

  const centerOn = useCallback((node: GraphNode | undefined) => {
    if (!node) return;
    const bounds = containerRef.current?.getBoundingClientRect();
    const width = bounds?.width ?? 760;
    const height = bounds?.height ?? 460;
    const scale = viewRef.current.scale;
    setView({
      scale,
      x: width * 0.62 - node.x * scale,
      y: height * 0.5 - node.y * scale,
    });
  }, []);

  useEffect(() => {
    if (initialized.current || !activeHeadNode) return;
    const frame = requestAnimationFrame(() => {
      initialized.current = true;
      centerOn(activeHeadNode);
    });
    return () => cancelAnimationFrame(frame);
  }, [activeHeadNode, centerOn]);

  useEffect(() => {
    if (batch.id === lastBatchId.current) return;
    lastBatchId.current = batch.id;
    if (batch.events.length === 0) return;
    const hash = targetFromEvents(batch.events);
    const node = hash === null ? activeHeadNode : layout.nodes.find((item) => item.hash === hash);
    if (!node) return;

    const bounds = containerRef.current?.getBoundingClientRect();
    const width = bounds?.width ?? 760;
    const current = viewRef.current;
    const screenX = current.x + node.x * current.scale;
    if (screenX > width - 120 || screenX < 80) {
      setView({
        scale: current.scale,
        x: width * 0.62 - node.x * current.scale,
        y: current.y,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch.id]);

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const current = viewRef.current;
    const factor = event.deltaY < 0 ? 1.08 : 0.92;
    const nextScale = clampScale(current.scale * factor);
    const cursorX = event.clientX - bounds.left;
    const cursorY = event.clientY - bounds.top;
    setView({
      scale: nextScale,
      x: cursorX - ((cursorX - current.x) / current.scale) * nextScale,
      y: cursorY - ((cursorY - current.y) / current.scale) * nextScale,
    });
  };

  /**
   * Éléments interactifs posés au-dessus du graphe (toolbar, prédiction,
   * feedback). Un pointerdown dessus ne doit jamais démarrer le déplacement :
   * `setPointerCapture` redirigerait le pointerup vers le graphe et le bouton
   * ne recevrait aucun `click`.
   */
  const INTERACTIVE_SELECTOR =
    'button, a, input, textarea, select, [role="alertdialog"], [role="dialog"], [data-no-pan]';

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target;
    if (target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null) {
      return;
    }
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY };
    setView((current) => ({ ...current, x: current.x + deltaX, y: current.y + deltaY }));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const zoomBy = (factor: number) => {
    setView((current) => ({ ...current, scale: clampScale(current.scale * factor) }));
  };

  const tooltipStyle = hovered
    ? {
        left: view.x + hovered.x * view.scale,
        top: view.y + hovered.y * view.scale - 14,
      }
    : undefined;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-bg">
      <div className="pointer-events-none absolute left-3 top-2.5 z-10 flex items-center gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted">Graphe</h2>
        <span className="rounded border border-border bg-panel/80 px-1.5 py-0.5 font-mono text-[10px] text-muted">
          {layout.nodes.length} commit{layout.nodes.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="absolute right-2 top-2 z-20 flex items-center gap-1">
        <button
          type="button"
          className="btn bg-panel/90 px-2"
          onClick={() => zoomBy(1.15)}
          aria-label="Zoomer"
          title="Zoomer"
        >
          +
        </button>
        <button
          type="button"
          className="btn bg-panel/90 px-2"
          onClick={() => zoomBy(0.87)}
          aria-label="Dézoomer"
          title="Dézoomer"
        >
          −
        </button>
        <button
          type="button"
          className="btn bg-panel/90"
          onClick={() => centerOn(activeHeadNode)}
          title="Recentrer sur HEAD"
        >
          <Icon name="target" size={13} />
          <span className="hidden sm:inline">HEAD</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        <svg
          width="100%"
          height="100%"
          role="img"
          aria-label="Graphe des commits"
          className="select-none"
        >
          <defs>
            <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
              <path d="M 26 0 L 0 0 0 26" fill="none" stroke="var(--graph-grid)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" opacity="0.55" />

          <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
            {layout.lanes.map((lane) => (
              <line
                key={lane.index}
                x1={PADDING_X - 26}
                y1={lane.y}
                x2={layout.width}
                y2={lane.y}
                stroke={lane.color}
                strokeOpacity={0.13}
                strokeWidth={1}
              />
            ))}

            {layout.edges.map((edge) => {
              const child = state.commits[edge.toHash];
              const color =
                child?.branch === undefined ? 'var(--border-strong)' : branchColor(child.branch);
              const control = Math.max(30, (edge.to.x - edge.from.x) * 0.45);
              const d = `M ${edge.from.x} ${edge.from.y} C ${edge.from.x + control} ${edge.from.y}, ${edge.to.x - control} ${edge.to.y}, ${edge.to.x} ${edge.to.y}`;
              return (
                <motion.path
                  key={edge.id}
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={edge.isMergeParent ? 1.6 : 2}
                  strokeDasharray={edge.isMergeParent ? '4 3' : undefined}
                  strokeOpacity={0.85}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.85 }}
                  transition={{
                    duration,
                    delay: (delays.commits.get(edge.toHash) ?? 0) * 0.5,
                    ease: 'easeOut',
                  }}
                />
              );
            })}

            {layout.nodes.map((node) => (
              <CommitNodeView
                key={node.hash}
                node={node}
                commit={state.commits[node.hash]}
                delay={delays.commits.get(node.hash) ?? 0}
                duration={duration}
                onHover={setHovered}
                {...(onSelectCommit === undefined ? {} : { onSelect: onSelectCommit })}
              />
            ))}

            <AnimatePresence initial={false}>
              {layout.branchLabels.map((label) => (
                <BranchLabelView
                  key={label.name}
                  label={label}
                  delay={delays.branches.get(label.name) ?? 0}
                  duration={duration}
                  {...(onSelectBranch === undefined ? {} : { onSelect: onSelectBranch })}
                />
              ))}
            </AnimatePresence>
          </g>
        </svg>

        {hovered && tooltipStyle && (
          <div
            className="pointer-events-none absolute z-30 w-64 -translate-x-1/2 -translate-y-full rounded-xl border border-border bg-panel/95 p-2.5 text-[11px] shadow-2xl backdrop-blur"
            style={tooltipStyle}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10.5px] text-accent-2">{hovered.shortHash}</span>
              {hovered.orphan && (
                <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[9px] text-warning">
                  orphelin
                </span>
              )}
            </div>
            <p className="mt-1 font-medium text-text">{hovered.message}</p>
            <p className="mt-1 font-mono text-[10px] text-muted">
              parents : {hovered.parents.length === 0 ? 'aucun' : hovered.parents.map((parent) => parent.slice(0, 7)).join(', ')}
            </p>
            <div className="mt-1.5 border-t border-border/70 pt-1.5 font-mono text-[10px] text-muted">
              {hovered.files.length === 0
                ? 'snapshot vide'
                : hovered.files.slice(0, 6).join(' · ') +
                  (hovered.files.length > 6 ? ` +${hovered.files.length - 6}` : '')}
            </div>
            {hovered.orphan && (
              <p className="mt-1.5 text-[10px] text-warning/90">
                Commit orphelin : aucune branche ne pointe ici.
              </p>
            )}
          </div>
        )}

        {layout.nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="max-w-xs text-center">
              <p className="text-sm font-medium text-text">Aucun commit</p>
              <p className="mt-1 text-xs text-muted">
                Crée un fichier avec <span className="font-mono text-accent-2">touch notes.txt</span>,
                indexe-le puis commit.
              </p>
            </div>
          </div>
        )}

        {overlay}

        <div className="pointer-events-none absolute bottom-2 left-3 font-mono text-[10px] text-muted/80">
          molette = zoom · glisser = déplacer
        </div>
        <label className="absolute bottom-2 right-3 flex items-center gap-1.5 font-mono text-[10px] text-muted">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.target.checked)}
            className="h-3 w-3 accent-violet-500"
          />
          sans animation
        </label>
      </div>
    </div>
  );
}

function CommitNodeView({
  node,
  commit,
  delay,
  duration,
  onHover,
  onSelect,
}: {
  readonly node: GraphNode;
  readonly commit: RepoState['commits'][string] | undefined;
  readonly delay: number;
  readonly duration: number;
  readonly onHover: (node: GraphNode | null) => void;
  readonly onSelect?: (hash: string) => void;
}) {
  const color = node.branch === undefined ? 'var(--border-strong)' : branchColor(node.branch);
  const isMerge = node.parents.length > 1;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: node.orphan ? 0.35 : 1 }}
      transition={{ duration, delay }}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
      onPointerDown={
        onSelect === undefined ? undefined : (event) => event.stopPropagation()
      }
      onClick={
        onSelect === undefined
          ? undefined
          : (event) => {
              event.stopPropagation();
              onSelect(node.hash);
            }
      }
      role={onSelect === undefined ? undefined : 'button'}
      tabIndex={onSelect === undefined ? undefined : 0}
      aria-label={onSelect === undefined ? undefined : `Sélectionner le commit ${node.shortHash}`}
      onKeyDown={
        onSelect === undefined
          ? undefined
          : (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(node.hash);
              }
            }
      }
      style={{ cursor: onSelect === undefined ? 'help' : 'pointer' }}
    >
      {node.head && (
        <title>
          {`HEAD · ${node.headPaths.join(', ')}${node.detachedHead ? ' (détaché)' : ''}`}
        </title>
      )}
      {node.head && (
        <circle
          cx={node.x}
          cy={node.y}
          r={(isMerge ? 9 : 6.5) + 4}
          fill="none"
          stroke={color}
          strokeOpacity={node.activeHead ? 0.9 : 0.4}
          strokeWidth={1.4}
          strokeDasharray={node.detachedHead ? '3 2' : undefined}
        />
      )}
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={isMerge ? 9 : 6.5}
        fill={node.head ? color : 'var(--panel)'}
        stroke={color}
        strokeWidth={2.4}
        initial={{ scale: 0.4 }}
        animate={{ scale: 1 }}
        transition={{ duration, delay, type: 'spring', stiffness: 260, damping: 20 }}
        style={{ transformOrigin: `${node.x}px ${node.y}px` }}
      />
      {isMerge && (
        <circle cx={node.x} cy={node.y} r={3} fill={node.head ? 'var(--panel)' : color} />
      )}
      <text
        x={node.x}
        y={node.y + 22}
        textAnchor="middle"
        className="fill-[var(--muted)] font-mono"
        fontSize={9}
        stroke="var(--panel)"
        strokeWidth={3}
        paintOrder="stroke"
      >
        {node.shortHash}
      </text>
      {commit?.parents.length === 0 && (
        <text
          x={node.x}
          y={node.y - 14}
          textAnchor="middle"
          className="fill-[var(--muted)]"
          fontSize={9}
        >
          racine
        </text>
      )}
    </motion.g>
  );
}

function BranchLabelView({
  label,
  delay,
  duration,
  onSelect,
}: {
  readonly label: BranchLabel;
  readonly delay: number;
  readonly duration: number;
  readonly onSelect?: (name: string) => void;
}) {
  const MAX_LABEL_WIDTH = 118;
  const fullWidth = nodeLabelWidth(label.name);
  const width = Math.min(MAX_LABEL_WIDTH, fullWidth);
  const maxChars = Math.max(4, Math.floor((width - 18) / 6.6));
  const text = fullWidth > width ? `${label.name.slice(0, maxChars)}…` : label.name;
  return (
    <motion.g
      initial={{ opacity: 0, x: label.x, y: label.y + 4 }}
      animate={{ opacity: 1, x: label.x, y: label.y }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      onPointerDown={
        onSelect === undefined ? undefined : (event) => event.stopPropagation()
      }
      onClick={
        onSelect === undefined
          ? undefined
          : (event) => {
              event.stopPropagation();
              onSelect(label.name);
            }
      }
      role={onSelect === undefined ? undefined : 'button'}
      tabIndex={onSelect === undefined ? undefined : 0}
      aria-label={onSelect === undefined ? undefined : `Sélectionner la branche ${label.name}`}
      onKeyDown={
        onSelect === undefined
          ? undefined
          : (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(label.name);
              }
            }
      }
      style={{ cursor: onSelect === undefined ? 'default' : 'pointer' }}
    >
      <title>{`Branche ${label.name}`}</title>
      <rect
        x={0}
        y={0}
        width={width}
        height={18}
        rx={9}
        fill="var(--panel)"
        stroke={label.color}
        strokeOpacity={0.85}
      />
      <text x={9} y={12.5} fill={label.color} fontSize={10} className="font-mono font-semibold">
        {text}
      </text>
    </motion.g>
  );
}
