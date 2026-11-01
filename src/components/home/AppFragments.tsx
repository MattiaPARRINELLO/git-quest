import type { ReactNode } from 'react';
import { chapters } from '../../content';
import { scenario } from '../../engine/scenario';
import { execute } from '../../engine';
import { CommitGraph } from '../graph/CommitGraph';
import { missionText } from '../../app/mission';
import { Icon } from '../ui/Icon';

/**
 * Le dépôt d'exemple : quatre commits, une branche fusionnée. Construit par le
 * moteur, pas dessiné à la main.
 */
export const previewState = scenario()
  .init()
  .commit('docs: cadrage du projet', { 'README.md': '# Nova\n\nNotes partagées.' })
  .branch('feature/notes')
  .checkout('feature/notes')
  .commit('feat: notes partagées', { 'src/notes.ts': 'export const notes = [];' })
  .checkout('main')
  .commit('fix: cache hors-ligne', { 'src/cache.ts': 'export const cache = new Map();' })
  .run('git merge feature/notes')
  .build();

export const emptyBatch = { id: 0, events: [] } as const;

/** Sortie réelle de `git log --oneline` sur ce dépôt. */
const logLines = execute(previewState, 'git log --oneline').output;

const firstMission = chapters[0]?.missions[0];

function Frame({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div data-ui className="bg-panel p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3 text-[13px] text-muted">
        <span className="text-text">{label}</span>
        <span>GitQuest</span>
      </div>
      {children}
    </div>
  );
}

/** Le graphe, à sa taille d'usage. */
export function GraphFragment() {
  return (
    <div data-ui className="bg-panel p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3 text-[13px]">
        <span className="text-text">nova · main</span>
        <span className="text-muted">4 commits · 2 branches</span>
      </div>
      <div className="mt-2 h-[248px]">
        <CommitGraph state={previewState} batch={emptyBatch} preview bare />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2" style={{ background: 'var(--accent)' }} />
          main
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2" style={{ background: 'var(--success)' }} />
          feature/notes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2" style={{ background: 'var(--warning)' }} />
          commit de fusion
        </span>
      </div>
    </div>
  );
}

/** Le terminal : sortie réelle du moteur, pas une capture. */
export function TerminalFragment() {
  return (
    <Frame label="git log --oneline">
      <pre className="mt-3 overflow-x-auto bg-panel-2 px-3.5 py-3 text-[13px] leading-7">
        <code>
          <span className="select-none text-muted">$ </span>
          git log --oneline{'\n'}
          {logLines.map((line) => line.text).join('\n')}
        </code>
      </pre>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        Une ligne par commit, du plus récent au plus ancien. Chaque empreinte pointe vers un
        snapshot complet.
      </p>
    </Frame>
  );
}

/** Le panneau de mission : objectif, étapes, coût en commandes. */
export function MissionFragment() {
  if (firstMission === undefined) return null;
  const texts = missionText(firstMission, firstMission.initialState);

  return (
    <Frame label={`Mission ${firstMission.number} · ${firstMission.title}`}>
      <p className="mt-3 text-[15px] font-medium leading-snug">{texts.objective}</p>
      <ol className="mt-3 space-y-2">
        {firstMission.steps.map((step) => (
          <li key={step.label} className="flex items-start gap-2.5 text-[13.5px] text-muted">
            <span className="mt-[6px] h-2 w-2 shrink-0 bg-border-strong" aria-hidden="true" />
            {step.label}
          </li>
        ))}
      </ol>
      <p className="mt-4 flex items-center gap-2 text-[13px] text-muted">
        <Icon name="target" size={13} />
        {firstMission.par} commandes pour 3 étoiles
      </p>
    </Frame>
  );
}

/** La prédiction : HEAD suspendu, on parie avant de voir. */
export function PredictionFragment() {
  const prediction = chapters[1]?.missions[1]?.predictions?.[0];
  if (prediction === undefined) return null;

  return (
    <Frame label="Avant d’exécuter">
      <p className="mt-3 text-[15px] font-medium leading-snug">{prediction.question}</p>
      <ul className="mt-3 space-y-2">
        {prediction.options.map((option) => (
          <li
            key={option.id}
            className="flex items-center justify-between gap-3 bg-panel-2 px-3 py-2 text-[13.5px] text-text"
          >
            {option.label}
            <span className="h-3 w-3 shrink-0 bg-border-strong" aria-hidden="true" />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        L’exécution attend ta réponse. Tu peux passer : rien ne bloque.
      </p>
    </Frame>
  );
}

/** Les trois zones : le geste que le chapitre 1 enseigne. */
export function PipelineFragment() {
  const zones = [
    { title: 'Working dir', note: 'a.txt modifié' },
    { title: 'Staging', note: 'a.txt indexé' },
    { title: 'Graphe', note: 'commit 4f2a1c' },
  ];

  return (
    <Frame label="Pipeline">
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {zones.map((zone, index) => (
          <div key={zone.title} className="flex flex-1 items-center gap-2">
            <div className="min-w-0 flex-1 bg-panel-2 px-3 py-2.5">
              <p className="text-[13px] text-text">{zone.title}</p>
              <p className="mt-1 truncate text-[13px] text-muted">{zone.note}</p>
            </div>
            {index < zones.length - 1 && (
              <Icon name="arrow-right" size={13} className="shrink-0 text-muted" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        Un fichier ne rejoint le graphe qu’en traversant les deux premières zones.
      </p>
    </Frame>
  );
}
