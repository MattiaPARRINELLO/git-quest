import { useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { CommitGraph } from '../graph/CommitGraph';
import { SplitPane } from './SplitPane';
import { StagingPipeline } from '../pipeline/StagingPipeline';
import { Terminal } from '../terminal/Terminal';
import { WorktreeStrip } from '../worktrees/WorktreeStrip';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/cn';
import { useRepoStore } from '../../store/useRepoStore';
import { useUiStore } from '../../store/useUiStore';
import type { MobileTab } from '../../store/useUiStore';

interface SandboxLayoutProps {
  readonly onCommand?: (input: string) => void;
  readonly missionPanel?: ReactNode;
  readonly graphOverlay?: ReactNode;
  readonly onSelectCommit?: (hash: string) => void;
  readonly onSelectBranch?: (name: string) => void;
}

const TABS: ReadonlyArray<{ id: MobileTab; label: string; icon: IconName }> = [
  { id: 'terminal', label: 'Terminal', icon: 'terminal' },
  { id: 'graph', label: 'Graphe', icon: 'graph' },
  { id: 'files', label: 'Fichiers', icon: 'files' },
];

function MobileTabs() {
  const tab = useUiStore((store) => store.mobileTab);
  const unseen = useUiStore((store) => store.graphUnseen);
  const setTab = useUiStore((store) => store.setMobileTab);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    else return;

    event.preventDefault();
    const target = TABS[next];
    if (target === undefined) return;
    setTab(target.id);
    buttons.current[next]?.focus();
  };

  return (
    <nav
      role="tablist"
      aria-label="Panneaux du bac à sable"
      className="flex shrink-0 border-b border-border bg-panel"
    >
      {TABS.map((item, index) => (
        <button
          key={item.id}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          type="button"
          role="tab"
          tabIndex={tab === item.id ? 0 : -1}
          aria-selected={tab === item.id}
          className={cn('tab flex items-center justify-center gap-1.5', tab === item.id && 'tab-active')}
          onKeyDown={(event) => onKeyDown(event, index)}
          onClick={() => setTab(item.id)}
        >
          <Icon name={item.icon} size={14} />
          {item.label}
          {item.id === 'graph' && unseen > 0 && tab !== 'graph' && (
            <span className="ml-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold leading-none text-white">
              {unseen > 9 ? '9+' : unseen}
            </span>
          )}
          {tab === item.id && (
            <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-accent" />
          )}
        </button>
      ))}
    </nav>
  );
}

export function SandboxLayout({
  onCommand,
  missionPanel,
  graphOverlay,
  onSelectCommit,
  onSelectBranch,
}: SandboxLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const tab = useUiStore((store) => store.mobileTab);
  const state = useRepoStore((store) => store.state);
  const batch = useRepoStore((store) => store.lastEvents);
  const worktreeCount = Object.keys(state.worktrees).length;

  const graph = (
    <CommitGraph
      state={state}
      batch={batch}
      {...(graphOverlay === undefined ? {} : { overlay: graphOverlay })}
      {...(onSelectCommit === undefined ? {} : { onSelectCommit })}
      {...(onSelectBranch === undefined ? {} : { onSelectBranch })}
    />
  );

  if (isDesktop) {
    return (
      <SplitPane
        left={
          <div className="flex h-full min-h-0 flex-col">
            {missionPanel}
            <div className="min-h-0 flex-1">
              <Terminal {...(onCommand === undefined ? {} : { onCommand })} />
            </div>
          </div>
        }
        right={
          <div className="flex h-full min-h-0 flex-col">
            {worktreeCount > 1 && <WorktreeStrip />}
            <div className="min-h-0 flex-1">{graph}</div>
            <StagingPipeline />
          </div>
        }
        initialLeftPercent={40}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {missionPanel}
      <MobileTabs />
      {tab === 'terminal' && (
        <div className="min-h-0 flex-1">
          <Terminal {...(onCommand === undefined ? {} : { onCommand })} />
        </div>
      )}
      {tab === 'graph' && <div className="min-h-0 flex-1">{graph}</div>}
      {tab === 'files' && (
        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto">
          <WorktreeStrip />
          <StagingPipeline />
        </div>
      )}
    </div>
  );
}
