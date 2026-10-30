import { useMemo, useRef, useState } from 'react';
import { execute } from '../engine/execute';
import type { RepoState } from '../engine/types';
import { CommitGraph } from '../components/graph/CommitGraph';
import { missionSequence } from '../content';
import { routePaths } from '../router/useHashRoute';
import { useProgressStore } from '../store/useProgressStore';
import { unreferencedHashes } from '../story/display';
import { downloadSvgAsPng } from '../lib/export-graph';

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
        <p className="text-sm text-muted">
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

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Ton histoire
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">
              Ton arbre Nova
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn px-3 py-1.5 text-xs" onClick={exportPng}>
              Exporter en PNG
            </button>
            <button type="button" className="btn px-3 py-1.5 text-xs" onClick={() => void copyLog()}>
              {copied ? 'Copié' : 'Copier git log'}
            </button>
            <a href={routePaths.home} className="btn px-3 py-1.5 text-xs">
              Carte
            </a>
          </div>
        </header>

        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['Commits', numbers.commits],
            ['Branches', numbers.branches],
            ['Merges', numbers.merges],
            ['Étoiles', stars],
            ['Worktrees créés', numbers.worktreesCreated],
            ['Worktrees actifs', numbers.worktreesActive],
            ['Abandonnés', numbers.orphans],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-panel px-3 py-2">
              <dt className="text-[10px] uppercase tracking-wider text-muted">{label}</dt>
              <dd className="font-mono text-lg text-text">{value}</dd>
            </div>
          ))}
        </dl>

        {timeline.length > 0 && (
          <section className="mt-5" aria-label="Fil de l’histoire">
            <h2 className="text-sm font-semibold text-text">Le fil de l’histoire</h2>
            <ol className="mt-2 space-y-1.5">
              {timeline.map(({ mission, stars, messages }) => (
                <li
                  key={mission.id}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg border border-border bg-panel px-2.5 py-1.5"
                >
                  <span className="font-mono text-[10px] text-accent">{mission.number}</span>
                  <span className="text-xs font-medium text-text">{mission.title}</span>
                  <span className="text-[10px] text-warning" aria-label={`${stars} étoile(s)`}>
                    {'★'.repeat(stars)}
                  </span>
                  <span className="w-full truncate font-mono text-[10px] text-muted">
                    {messages.length > 0 ? messages.join(' · ') : 'Aucun message personnel'}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div
            ref={graphRef}
            className="min-h-[22rem] overflow-hidden rounded-2xl border border-border bg-panel"
          >
            <CommitGraph
              state={nova}
              batch={{ id: 0, events: [] }}
              onSelectCommit={(hash) => setSelected(hash)}
            />
          </div>

          <aside className="rounded-2xl border border-border bg-panel p-3">
            {commit ? (
              <div className="space-y-1.5 text-xs">
                <p className="font-mono text-[11px] text-accent-2">{commit.hash.slice(0, 7)}</p>
                <p className="font-medium text-text">{commit.message}</p>
                <p className="text-muted">
                  {commit.author.name} · {commit.parents.length} parent(s)
                </p>
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
                  <p className="text-[11px] text-muted">Mission d’origine : {origin.missionId}</p>
                )}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-muted">
                Clique sur un commit du graphe pour voir son message, son auteur et son
                contenu. Les commits abandonnés restent visibles, plus pâles.
              </p>
            )}
          </aside>
        </div>

        <details className="mt-4 rounded-2xl border border-border bg-panel p-3">
          <summary className="cursor-pointer text-xs font-semibold text-text">
            git log --oneline --graph
          </summary>
          <pre className="scrollbar-thin mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-muted">
            {log}
          </pre>
        </details>
      </div>
    </div>
  );
}
