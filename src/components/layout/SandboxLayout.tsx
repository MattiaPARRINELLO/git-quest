import { useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { CommitGraph } from '../graph/CommitGraph';
import { SplitPane } from './SplitPane';
import { StagingPipeline } from '../pipeline/StagingPipeline';
import { Terminal } from '../terminal/Terminal';
import { WorktreeStrip } from '../worktrees/WorktreeStrip';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useKeyboardOpen } from '../../hooks/useKeyboardOpen';
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

interface TabItem {
  readonly id: MobileTab;
  readonly label: string;
  readonly icon: IconName;
}

const TABS: ReadonlyArray<TabItem> = [
  { id: 'terminal', label: 'Terminal', icon: 'terminal' },
  { id: 'graph', label: 'Graphe', icon: 'graph' },
  { id: 'files', label: 'Fichiers', icon: 'files' },
];

/** En mission, « Fichiers » vit dans le panneau secondaire, pas dans les onglets. */
const MISSION_TABS: ReadonlyArray<TabItem> = TABS.filter((item) => item.id !== 'files');

interface MobileTabsProps {
  readonly tabs: ReadonlyArray<TabItem>;
  readonly active: MobileTab;
}

function MobileTabs({ tabs, active }: MobileTabsProps) {
  const unseen = useUiStore((store) => store.graphUnseen);
  const setTab = useUiStore((store) => store.setMobileTab);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;

    event.preventDefault();
    const target = tabs[next];
    if (target === undefined) return;
    setTab(target.id);
    buttons.current[next]?.focus();
  };

  return (
    <nav
      role="tablist"
      aria-label="Panneaux du bac à sable"
      className="flex shrink-0  bg-panel"
    >
      {tabs.map((item, index) => (
        <button
          key={item.id}
          ref={(element) => {
            buttons.current[index] = element;
          }}
          type="button"
          role="tab"
          tabIndex={active === item.id ? 0 : -1}
          aria-selected={active === item.id}
          className={cn('tab flex items-center justify-center gap-1.5', active === item.id && 'tab-active')}
          onKeyDown={(event) => onKeyDown(event, index)}
          onClick={() => setTab(item.id)}
        >
          <Icon name={item.icon} size={14} />
          {item.label}
          {item.id === 'graph' && unseen > 0 && active !== 'graph' && (
            <span className="ml-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[12px] font-medium leading-none text-on-accent">
              {unseen > 9 ? '9+' : unseen}
            </span>
          )}
          {active === item.id && (
            <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-accent" />
          )}
        </button>
      ))}
    </nav>
  );
}

/**
 * Panneau du haut sur mobile : version mini de la mission ou de l'arbre de
 * fichiers. Il est masqué quand le clavier virtuel est ouvert, sans être
 * démonté, pour conserver la bascule et le dépliage choisis.
 */
function MobileSecondaryPanel({ missionPanel }: { readonly missionPanel: ReactNode }) {
  const [panel, setPanel] = useState<'mission' | 'files'>('mission');

  return (
    <section className="shrink-0  bg-panel" aria-label="Panneau secondaire">
      <div
        role="group"
        aria-label="Contenu du panneau secondaire"
        className="flex items-center gap-1 px-2 py-1.5"
      >
        {(
          [
            { id: 'mission', label: 'Mission', icon: 'target' },
            { id: 'files', label: 'Fichiers', icon: 'files' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={panel === item.id}
            onClick={() => setPanel(item.id)}
            className={cn(
              'flex items-center gap-1  px-2 py-0.5 text-[13px] font-medium transition-colors',
              panel === item.id
                ? 'bg-panel-2 text-text'
                : 'text-muted hover:text-text',
            )}
          >
            <Icon name={item.icon} size={12} />
            {item.label}
          </button>
        ))}
      </div>
      {panel === 'mission' ? (
        missionPanel
      ) : (
        <div className="scrollbar-thin max-h-[42dvh] overflow-y-auto">
          <WorktreeStrip />
          <StagingPipeline />
        </div>
      )}
    </section>
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
  const keyboardOpen = useKeyboardOpen();
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

  const visibleTabs = missionPanel === undefined ? TABS : MISSION_TABS;
  const activeTab: MobileTab = visibleTabs.some((item) => item.id === tab) ? tab : 'terminal';

  return (
    <div className="flex h-full min-h-0 flex-col">
      {missionPanel !== undefined && (
        <div className={cn(keyboardOpen && 'hidden')}>
          <MobileSecondaryPanel missionPanel={missionPanel} />
        </div>
      )}
      <MobileTabs tabs={visibleTabs} active={activeTab} />
      {activeTab === 'terminal' && (
        <div className="min-h-0 flex-1">
          <Terminal {...(onCommand === undefined ? {} : { onCommand })} />
        </div>
      )}
      {activeTab === 'graph' && <div className="min-h-0 flex-1">{graph}</div>}
      {missionPanel === undefined && activeTab === 'files' && (
        <div className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto">
          <WorktreeStrip />
          <StagingPipeline />
        </div>
      )}
    </div>
  );
}
