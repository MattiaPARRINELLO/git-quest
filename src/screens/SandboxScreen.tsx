import { CommitGraph } from '../components/graph/CommitGraph';
import { SplitPane } from '../components/layout/SplitPane';
import { StagingPipeline } from '../components/pipeline/StagingPipeline';
import { Terminal } from '../components/terminal/Terminal';
import { WorktreeStrip } from '../components/worktrees/WorktreeStrip';
import { Icon } from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { cn } from '../lib/cn';
import { useRepoStore } from '../store/useRepoStore';
import { useUiStore } from '../store/useUiStore';
import type { MobileTab } from '../store/useUiStore';

function Visualization() {
  const state = useRepoStore((store) => store.state);
  const batch = useRepoStore((store) => store.lastEvents);
  const worktreeCount = Object.keys(state.worktrees).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {worktreeCount > 1 && <WorktreeStrip />}
      <div className="min-h-0 flex-1">
        <CommitGraph state={state} batch={batch} />
      </div>
      <StagingPipeline />
    </div>
  );
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

  return (
    <nav
      aria-label="Panneaux du bac à sable"
      className="flex shrink-0 border-b border-border bg-panel"
    >
      {TABS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={tab === item.id}
          className={cn('tab flex items-center justify-center gap-1.5', tab === item.id && 'tab-active')}
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

function MobileSandbox() {
  const tab = useUiStore((store) => store.mobileTab);
  const state = useRepoStore((store) => store.state);
  const batch = useRepoStore((store) => store.lastEvents);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MobileTabs />
      {tab === 'terminal' && (
        <div className="min-h-0 flex-1">
          <Terminal />
        </div>
      )}
      {tab === 'graph' && (
        <div className="min-h-0 flex-1">
          <CommitGraph state={state} batch={batch} />
        </div>
      )}
      {tab === 'files' && (
        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto">
          <WorktreeStrip />
          <StagingPipeline />
        </div>
      )}
    </div>
  );
}

export function SandboxScreen() {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <SplitPane
        left={<Terminal />}
        right={<Visualization />}
        initialLeftPercent={40}
      />
    );
  }

  return <MobileSandbox />;
}
