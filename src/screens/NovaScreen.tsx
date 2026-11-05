import { useMemo, useRef, useState } from 'react';
import { execute } from '../engine/execute';
import type { RepoState } from '../engine/types';
import { CommitGraph } from '../components/graph/CommitGraph';
import { missionSequence } from '../content';
import { routePaths } from '../router/useHashRoute';
import { useProgressStore } from '../store/useProgressStore';
import { teammateForAuthor } from '../story/actor';
import { findMission } from '../content';
import { unreferencedHashes } from '../story/display';
import { downloadSvgAsPng } from '../lib/export-graph';
import { cn } from '../lib/cn';
import { useTranslation } from '../i18n/useTranslation';

function stats(nova: RepoState, journal: readonly { kind: string }[]) {
  const commits = Object.values(nova.commits);
  return {
    commits: commits.length,
    branches: Object.keys(nova.branches).length,
    merges: commits.filter((commit) => commit.parents.length === 2).length,
    worktreesCreated: journal.filter((entry) => entry.kind === 'worktree').length,
    worktreesActive: Object.keys(nova.worktrees).length,
    orphans: unreferencedHashes(nova).length,
  };
}

function Stars({ count }: { readonly count: number }) {
  const { t } = useTranslation();
  return (
    <span
      className="inline-flex items-center gap-[3px]"
      aria-label={t('nova.starsAria', { count })}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn(
            'h-[7px] w-[7px]',
            index < count ? 'bg-warning' : 'bg-border-strong/60',
          )}
        />
      ))}
    </span>
  );
}

export function NovaScreen() {
  const { t } = useTranslation();
  const story = useProgressStore((store) => store.story);
  const completed = useProgressStore((store) => store.completed);
  const [selected, setSelected] = useState<string | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const nova = story.nova;
  const stars = Object.values(completed).reduce((sum, item) => sum + item.stars, 0);
  const log = useMemo(() => {
    if (nova === null) return '';
    return execute(nova, 'git log --oneline --graph')
      .output.map((line) => line.text)
      .join('\n');
  }, [nova]);

  if (nova === null) {
    return (
      <div className="mx-auto flex h-full max-w-[640px] flex-col justify-center px-5 py-12">
        <h1 className="display text-[28px] leading-[1.1] text-text sm:text-[32px]">
          {t('nova.title')}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-text">{t('nova.emptyText')}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{t('nova.emptyHint')}</p>
        <a href={routePaths.home} className="btn btn-accent mt-6 h-11 w-fit px-5 text-[14px]">
          {t('app.backToChapters')}
        </a>
      </div>
    );
  }

  const numbers = stats(nova, story.journal);
  const commit = selected === null ? undefined : nova.commits[selected];
  const origin = selected === null
    ? undefined
    : Object.values(story.slots).find((record) => record.commitHash === selected);
  const author = commit === undefined ? undefined : teammateForAuthor(commit.author);
  const originMission = origin === undefined ? undefined : findMission(origin.missionId);

  const timeline = missionSequence
    .filter((mission) => completed[mission.id] !== undefined)
    .map((mission) => ({
      mission,
      stars: completed[mission.id]?.stars ?? 1,
      messages: [
        ...new Set(
          Object.values(story.slots)
            .filter((record) => record.missionId === mission.id)
            .map((record) => record.message),
        ),
      ],
    }));

  const copyLog = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(log);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const exportPng = (): void => {
    const svg = graphRef.current?.querySelector('svg');
    if (svg instanceof SVGSVGElement) void downloadSvgAsPng(svg, 'nova.png');
  };

  const summary: ReadonlyArray<readonly [string, number]> = [
    [t('nova.missions'), Object.keys(completed).length],
    [t('nova.commits'), numbers.commits],
    [t('nova.branches'), numbers.branches],
    [t('nova.merges'), numbers.merges],
    [t('nova.stars'), stars],
    [t('nova.worktreesCreated'), numbers.worktreesCreated],
    [t('nova.worktreesActive'), numbers.worktreesActive],
    [t('nova.orphans'), numbers.orphans],
  ];

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-[28px] leading-[1.1] sm:text-[32px]">{t('nova.title')}</h1>
            <p className="mt-2 text-[15px] text-muted">{t('nova.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-quiet px-3" onClick={exportPng}>
              {t('nova.exportPng')}
            </button>
            <button
              type="button"
              className="btn btn-quiet px-3"
              onClick={() => void copyLog()}
            >
              {copied ? t('nova.copied') : t('nova.copyLog')}
            </button>
            <a href={routePaths.home} className="btn btn-quiet px-3">
              {t('nova.map')}
            </a>
          </div>
        </header>

        <p className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-[14px] text-muted">
          {summary.map(([label, value]) => (
            <span key={label} className="inline-flex items-baseline gap-2">
              <span className="text-[24px] leading-none tabular-nums text-text">{value}</span>
              <span>{label}</span>
            </span>
          ))}
        </p>

        {timeline.length > 0 && (
          <section className="mt-12" aria-label={t('nova.storyAria')}>
            <h2 className="display text-[30px] leading-none text-text">{t('nova.storyTitle')}</h2>
            <ol className="mt-5 space-y-4">
              {timeline.map(({ mission, stars: missionStars, messages }) => (
                <li key={mission.id}>
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-[13px] tabular-nums text-muted">{mission.number}</span>
                    <span className="text-[16px] font-medium text-text">{mission.title}</span>
                    <Stars count={missionStars} />
                  </div>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted">
                    {messages.length > 0 ? messages.join(' · ') : t('nova.noMessage')}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div ref={graphRef} className="min-h-[24rem] overflow-hidden bg-panel">
            <CommitGraph
              state={nova}
              batch={{ id: 0, events: [] }}
              onSelectCommit={(hash) => setSelected(hash)}
            />
          </div>

          <aside className="bg-panel">
            <div className="px-4 py-4">
              <h2 className="text-[15px] font-medium text-text">
                {commit ? t('nova.selectedCommit') : t('nova.detail')}
              </h2>
              {commit ? (
                <div className="mt-3 space-y-2 text-[14px] leading-snug">
                  <p className="text-[13px] text-accent-2">{commit.hash.slice(0, 7)}</p>
                  <p className="font-medium leading-snug text-text">{commit.message}</p>
                  <p className="text-muted">
                    {author === undefined
                      ? t('nova.you')
                      : `${author.name} · ${author.role}`}
                  </p>
                  <p className="text-muted">
                    {t('nova.parents', { count: commit.parents.length })}
                  </p>
                  <p className="text-muted">
                    {t('nova.branch', { branch: commit.branch ?? t('nova.detachedHead') })}
                  </p>
                  <p className="text-muted">
                    {t('nova.filesCount', { count: Object.keys(commit.snapshot).length })}
                  </p>
                  <p className="text-[13px] text-muted">
                    {t('nova.orphanLabel', {
                      value: unreferencedHashes(nova).includes(commit.hash)
                        ? t('nova.yes')
                        : t('nova.no'),
                    })}
                  </p>
                  {origin !== undefined && (
                    <p className="text-[13px] text-muted">
                      {t('nova.origin', {
                        mission:
                          originMission === undefined
                            ? origin.missionId
                            : `${originMission.number} · ${originMission.title}`,
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-[14px] leading-relaxed text-muted">
                  {t('nova.detailHint')}
                </p>
              )}
            </div>
          </aside>
        </div>

        <details className="mt-4 bg-panel">
          <summary className="cursor-pointer px-4 py-3 text-[14px] font-medium text-text">
            git log --oneline --graph
          </summary>
          <pre className="scrollbar-thin max-h-72 overflow-auto whitespace-pre-wrap break-words bg-panel-2 px-4 py-3 text-[13px] leading-6 text-muted">
            {log}
          </pre>
        </details>
      </div>
    </div>
  );
}
