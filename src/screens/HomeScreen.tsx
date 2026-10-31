import { useMemo } from 'react';
import {
  chapters,
  commandLineLesson,
  estimatedLessonMinutes,
  isMissionUnlocked,
  missionSequence,
} from '../content';
import { briefingFor } from '../content/briefings';
import { scenario } from '../engine/scenario';
import { resumeContext, resumeTarget } from '../app/resume';
import { progressSummary } from '../app/xp';
import { ProgressPanel } from '../components/progress/ProgressPanel';
import { useProgressStore } from '../store/useProgressStore';
import { useMissionDraftStore } from '../store/useMissionDraftStore';
import { routePaths } from '../router/useHashRoute';
import { branchColor } from '../lib/colors';
import { Icon } from '../components/ui/Icon';
import { CommitGraph } from '../components/graph/CommitGraph';
import { cn } from '../lib/cn';

/** Trois repères pleins ou vides : la note se lit d'un coup d'œil. */
function StarDots({
  count,
  max = 3,
  className,
}: {
  readonly count: number;
  readonly max?: number;
  readonly className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-[3px]', className)}
      aria-label={`${count} étoile${count > 1 ? 's' : ''} sur ${max}`}
    >
      {Array.from({ length: max }, (_, index) => (
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

function LaneTick({ color }: { readonly color: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-3 w-[2px] shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

export function HomeScreen() {
  const completed = useProgressStore((store) => store.completed);
  const lessonSlides = useProgressStore((store) => store.lessonSlides);
  const progressHydrated = useProgressStore((store) => store.hydrated);
  const activeMission = useMissionDraftStore((store) => store.activeMission);
  const draftHydrated = useMissionDraftStore((store) => store.hydrated);
  const hydrated = progressHydrated && draftHydrated;
  const progress = useMemo(() => ({ completed, lessonSlides }), [completed, lessonSlides]);
  const target = useMemo(() => resumeTarget(progress, activeMission), [progress, activeMission]);
  const context = useMemo(() => resumeContext(progress, activeMission), [progress, activeMission]);
  const summary = useMemo(() => progressSummary(progress), [progress]);
  const totalMissions = chapters.reduce((sum, chapter) => sum + chapter.missions.length, 0);
  const totalStars = Object.values(completed).reduce((sum, item) => sum + item.stars, 0);
  const lastCompleted = [...missionSequence].reverse().find((mission) => completed[mission.id]);
  const lastBriefing = lastCompleted === undefined ? undefined : briefingFor(lastCompleted.id);
  const done = Object.keys(completed).length;
  const percent = totalMissions === 0 ? 0 : Math.round((done / totalMissions) * 100);
  const prologueRead =
    (lessonSlides[commandLineLesson.id] ?? 0) >= commandLineLesson.slides.length - 1;
  const preview = useMemo(
    () =>
      scenario()
        .init()
        .commit('docs: cadrage du projet', { 'README.md': '# Nova\n\nNotes partagées.' })
        .branch('feature/notes')
        .checkout('feature/notes')
        .commit('feat: notes partagées', { 'src/notes.ts': 'export const notes = [];' })
        .checkout('main')
        .commit('fix: cache hors-ligne', { 'src/cache.ts': 'export const cache = new Map();' })
        .run('git merge feature/notes')
        .build(),
    [],
  );
  const emptyBatch = useMemo(() => ({ id: 0, events: [] }), []);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-[1160px] px-5 py-9 sm:px-8 sm:py-12">
        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-12">
          <div>
            <p className="flex items-center gap-2 text-[11.5px] text-muted">
              <LaneTick color="var(--accent)" />
              Apprendre Git par la pratique
            </p>
            <h1 className="display mt-3 max-w-[20ch] text-[40px] leading-[1.04] text-text sm:text-[52px]">
              Apprends Git en voyant le graphe.
            </h1>
            <p className="mt-4 max-w-[48ch] text-[15px] leading-7 text-muted">
              Cinq chapitres, quinze missions réalistes. Chaque commande se rejoue sous tes
              yeux : le graphe, HEAD, l’index et les worktrees deviennent enfin lisibles.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2">
              {hydrated ? (
                <a
                  href={target.route}
                  className="btn btn-accent h-9 min-w-60 justify-between px-3.5 text-[13px]"
                >
                  {target.label}
                  <Icon name="arrow-right" size={15} />
                </a>
              ) : (
                <span
                  className="btn btn-accent invisible h-9 min-w-60 justify-between px-3.5 text-[13px]"
                  aria-hidden="true"
                >
                  Chargement
                </span>
              )}
              <a href={routePaths.sandbox} className="btn h-9 gap-2 px-3 text-[13px]">
                <Icon name="terminal" size={14} />
                Ouvrir le bac à sable
              </a>
            </div>
            <p className="mt-2.5 min-h-4 text-[11.5px] text-muted" aria-live="polite">
              {hydrated ? context : '\u00a0'}
            </p>
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border bg-panel lg:block">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <div className="flex items-center gap-2">
                <LaneTick color="var(--accent)" />
                <span className="font-mono text-[11.5px] text-text">nova</span>
                <span className="mono-meta">sur main</span>
              </div>
              <span className="mono-meta">4 commits · 2 branches</span>
            </div>
            <div className="h-[248px]">
              <CommitGraph state={preview} batch={emptyBatch} preview bare />
            </div>
            <div className="flex items-center gap-4 border-t border-border px-4 py-2">
              <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                main
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                feature/notes
              </span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[10.5px] text-muted">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--warning)' }} />
                merge
              </span>
            </div>
          </div>
        </section>

        <dl className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          <div className="bg-panel px-4 py-3.5">
            <dt className="mono-meta">Missions</dt>
            <dd className="mt-1 font-mono text-[22px] leading-none tabular-nums text-text">
              {done}
              <span className="text-[13px] text-muted"> / {totalMissions}</span>
            </dd>
          </div>
          <div className="bg-panel px-4 py-3.5">
            <dt className="mono-meta">Étoiles</dt>
            <dd className="mt-1 font-mono text-[22px] leading-none tabular-nums text-text">
              {totalStars}
              <span className="text-[13px] text-muted"> / {totalMissions * 3}</span>
            </dd>
          </div>
          <div className="col-span-2 bg-panel px-4 py-3.5 sm:col-span-1">
            <dt className="mono-meta">Parcours</dt>
            <dd className="mt-1.5 flex items-center gap-3">
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-panel-3">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${percent}%` }}
                />
              </span>
              <span className="font-mono text-[13px] tabular-nums text-text">{percent}%</span>
            </dd>
          </div>
        </dl>

        <ProgressPanel summary={summary} />

        <section className="mt-4" aria-label="Prologue">
          <a
            href={routePaths.prologue}
            className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-panel px-4 py-3 transition-colors hover:border-border-strong"
          >
            <span className="flex min-w-0 items-start gap-2.5">
              <span aria-hidden="true" className="mt-1 h-3.5 w-[2px] shrink-0 rounded-full bg-accent" />
              <span className="min-w-0">
                <span className="text-[13px] font-medium text-text">
                  Prologue · Lire une commande Git
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-muted">
                  Options, guillemets, placeholders : décoder n’importe quelle commande avant de
                  commencer. {estimatedLessonMinutes(commandLineLesson)} min.
                </span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-[12px] text-muted transition-colors group-hover:text-text">
              {prologueRead ? 'Relire' : 'Lire'}
              <Icon name="arrow-right" size={12} />
            </span>
          </a>
        </section>

        {lastCompleted !== undefined && lastBriefing?.outcome !== undefined && (
          <section
            className="mt-4 rounded-xl border border-border bg-panel px-4 py-3.5"
            aria-label="Dernier épisode"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="flex items-center gap-2 text-[11.5px] text-muted">
                <LaneTick color="var(--accent)" />
                Dernier épisode
              </p>
              <a href={routePaths.nova} className="text-[11.5px] text-muted hover:text-text">
                Ton arbre Nova
              </a>
            </div>
            <p className="mt-1.5 text-[13px] text-text">
              <span className="font-mono text-[11px] text-muted">{lastCompleted.number}</span>{' '}
              <span className="font-medium">{lastCompleted.title}</span>
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{lastBriefing.outcome}</p>
            {lastBriefing.teaser !== undefined && (
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted/85">
                <span className="text-text">À suivre · </span>
                {lastBriefing.teaser}
              </p>
            )}
          </section>
        )}

        <section className="mt-10" aria-label="Chapitres">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[15px] font-medium text-text">Ta carte de progression</h2>
            <span className="text-[11.5px] text-muted">Les missions se déverrouillent dans l’ordre.</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {chapters.map((chapter) => {
              const chapterDone = chapter.missions.filter(
                (mission) => completed[mission.id] !== undefined,
              ).length;
              const chapterStars = chapter.missions.reduce(
                (sum, mission) => sum + (completed[mission.id]?.stars ?? 0),
                0,
              );
              const color = branchColor(chapter.id);

              return (
                <article
                  key={chapter.id}
                  className="flex flex-col rounded-xl border border-border bg-panel p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <LaneTick color={color} />
                      <div className="min-w-0">
                        <span className="mono-meta">Chapitre {chapter.number}</span>
                        <h3 className="mt-0.5 truncate text-[14px] font-medium text-text">
                          {chapter.title}
                        </h3>
                      </div>
                    </div>
                    <span className="mono-meta shrink-0 tabular-nums">
                      {chapterStars} / {chapter.missions.length * 3}
                    </span>
                  </div>

                  <p className="mt-2 text-[12px] text-muted">{chapter.tagline}</p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                    {chapter.description}
                  </p>

                  <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-border pt-3">
                    <span className="mono-meta">
                      {chapterDone} / {chapter.missions.length} missions ·{' '}
                      {estimatedLessonMinutes(chapter.lesson)} min de cours
                    </span>
                    <a
                      href={routePaths.lesson(chapter.id)}
                      className="btn h-7 gap-1.5 px-2 text-[11.5px]"
                    >
                      <Icon name="book" size={12} />
                      Cours
                    </a>
                  </div>

                  <ul className="mt-2 space-y-0.5">
                    {chapter.missions.map((mission) => {
                      const unlocked = isMissionUnlocked(mission.id, completed);
                      const completion = completed[mission.id];

                      return (
                        <li key={mission.id}>
                          {unlocked ? (
                            <a
                              href={routePaths.mission(mission.id)}
                              className="group flex h-8 items-center justify-between gap-2 rounded-md px-1.5 transition-colors hover:bg-panel-2"
                            >
                              <span className="flex min-w-0 items-center gap-2.5">
                                <span className="font-mono text-[10.5px] text-muted">
                                  {mission.number}
                                </span>
                                <span className="truncate text-[12.5px] text-text">{mission.title}</span>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                {completion ? (
                                  <StarDots count={completion.stars} />
                                ) : (
                                  <span className="mono-meta">à faire</span>
                                )}
                                <Icon
                                  name="arrow-right"
                                  size={12}
                                  className="text-muted transition-transform group-hover:translate-x-0.5"
                                />
                              </span>
                            </a>
                          ) : (
                            <div className="flex h-8 items-center justify-between gap-2 px-1.5 opacity-55">
                              <span className="flex min-w-0 items-center gap-2.5">
                                <span className="font-mono text-[10.5px] text-muted">
                                  {mission.number}
                                </span>
                                <span className="truncate text-[12.5px] text-muted">{mission.title}</span>
                              </span>
                              <Icon name="lock" size={12} className="shrink-0 text-muted" />
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11.5px] text-muted">
          <span>GitQuest — progression enregistrée sur cet appareil.</span>
          <a href={routePaths.sandbox} className="inline-flex items-center gap-1 hover:text-text">
            Terminal libre <Icon name="arrow-right" size={12} />
          </a>
        </footer>
      </div>
    </div>
  );
}
