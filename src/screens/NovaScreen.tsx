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
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`${count} étoile(s)`}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn(
            'h-[5px] w-[5px] rounded-full',
            index < count ? 'bg-warning' : 'bg-border-strong/60',
          )}
        />
      ))}
    </span>
  );
}

export function NovaScreen() {
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
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="max-w-sm text-[13px] leading-relaxed text-muted">
          Ton arbre Nova apparaîtra ici une fois ta première mission terminée.
        </p>
        <a href={routePaths.home} className="btn">
          Retour aux chapitres
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
    ['Missions', Object.keys(completed).length],
    ['Commits', numbers.commits],
    ['Branches', numbers.branches],
    ['Merges', numbers.merges],
    ['Étoiles', stars],
    ['Worktrees créés', numbers.worktreesCreated],
    ['Worktrees actifs', numbers.worktreesActive],
    ['Abandonnés', numbers.orphans],
  ];

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-[1160px] px-5 py-8 sm:px-8 sm:py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11.5px] text-muted">
              <span aria-hidden="true" className="h-3 w-[2px] rounded-full bg-accent" />
              Ton histoire
            </p>
            <h1 className="display mt-1.5 text-[34px] leading-[1.1] text-text">Ton arbre Nova</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn h-8 px-2.5 text-[12px]" onClick={exportPng}>
              Exporter en PNG
            </button>
            <button
              type="button"
              className="btn h-8 px-2.5 text-[12px]"
              onClick={() => void copyLog()}
            >
              {copied ? 'Copié' : 'Copier git log'}
            </button>
            <a href={routePaths.home} className="btn h-8 px-2.5 text-[12px]">
              Carte
            </a>
          </div>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
          {summary.map(([label, value]) => (
            <div key={label} className="bg-panel px-3.5 py-3">
              <dt className="mono-meta">{label}</dt>
              <dd className="mt-1 font-mono text-[19px] leading-none tabular-nums text-text">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {timeline.length > 0 && (
          <section className="mt-7" aria-label="Fil de l’histoire">
            <h2 className="text-[14px] font-medium text-text">Le fil de l’histoire</h2>
            <ol className="mt-2 divide-y divide-border border-y border-border">
              {timeline.map(({ mission, stars: missionStars, messages }) => (
                <li
                  key={mission.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2"
                >
                  <span className="font-mono text-[10.5px] text-muted">{mission.number}</span>
                  <span className="text-[12.5px] font-medium text-text">{mission.title}</span>
                  <Stars count={missionStars} />
                  <span className="w-full truncate font-mono text-[10.5px] text-muted">
                    {messages.length > 0 ? messages.join(' · ') : 'Aucun message personnel'}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div
            ref={graphRef}
            className="min-h-[24rem] overflow-hidden rounded-xl border border-border bg-panel"
          >
            <CommitGraph
              state={nova}
              batch={{ id: 0, events: [] }}
              onSelectCommit={(hash) => setSelected(hash)}
            />
          </div>

          <aside className="rounded-xl border border-border bg-panel">
            <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
              <span aria-hidden="true" className="h-3 w-[2px] rounded-full bg-accent" />
              <h2 className="text-[12px] font-medium text-text">
                {commit ? 'Commit sélectionné' : 'Détail'}
              </h2>
            </div>
            <div className="px-3.5 py-3">
              {commit ? (
                <div className="space-y-1.5 text-[12px]">
                  <p className="font-mono text-[11px] text-accent-2">{commit.hash.slice(0, 7)}</p>
                  <p className="font-medium leading-snug text-text">{commit.message}</p>
                  <p className="text-muted">
                    {author === undefined
                      ? 'Toi · commit de ton parcours'
                      : `${author.name} · ${author.role}`}
                  </p>
                  <p className="text-muted">{commit.parents.length} parent(s)</p>
                  <p className="text-muted">
                    Branche : {commit.branch ?? 'HEAD détaché'}
                  </p>
                  <p className="text-muted">
                    {Object.keys(commit.snapshot).length} fichier(s) dans la photo
                  </p>
                  <p className="text-[11px] text-muted">
                    Orphelin : {unreferencedHashes(nova).includes(commit.hash) ? 'oui' : 'non'}
                  </p>
                  {origin !== undefined && (
                    <p className="text-[11px] text-muted">
                      Mission d’origine :{' '}
                      {originMission === undefined
                        ? origin.missionId
                        : `${originMission.number} — ${originMission.title}`}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[12px] leading-relaxed text-muted">
                  Clique sur un commit du graphe pour voir son message, son auteur et son
                  contenu. Les commits abandonnés restent visibles, plus pâles.
                </p>
              )}
            </div>
          </aside>
        </div>

        <details className="mt-4 rounded-xl border border-border bg-panel">
          <summary className="cursor-pointer px-3.5 py-2.5 text-[12px] font-medium text-text">
            git log --oneline --graph
          </summary>
          <pre className="scrollbar-thin max-h-72 overflow-auto whitespace-pre-wrap break-words border-t border-border px-3.5 py-3 font-mono text-[11px] leading-5 text-muted">
            {log}
          </pre>
        </details>
      </div>
    </div>
  );
}
