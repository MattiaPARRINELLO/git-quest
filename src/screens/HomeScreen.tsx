import { useMemo } from 'react';
import {
  chapters,
  commandLineLesson,
  estimatedLessonMinutes,
  missionSequence,
} from '../content';
import { briefingFor } from '../content/briefings';
import { resumeContext, resumeTarget } from '../app/resume';
import { progressSummary } from '../app/xp';
import { ProgressPanel } from '../components/progress/ProgressPanel';
import { useProgressStore } from '../store/useProgressStore';
import { useMissionDraftStore } from '../store/useMissionDraftStore';
import { routePaths } from '../router/useHashRoute';
import { Icon } from '../components/ui/Icon';
import { ProgressBackup } from '../components/layout/ProgressBackup';
import { ChapterField } from '../components/home/ChapterField';
import { Reveal } from '../components/home/Reveal';
import {
  GraphFragment,
  MissionFragment,
  PipelineFragment,
  PredictionFragment,
  TerminalFragment,
} from '../components/home/AppFragments';

const MISSION_ROUTE = '#/mission/';

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
  const headMissionId = target.route.startsWith(MISSION_ROUTE)
    ? target.route.slice(MISSION_ROUTE.length)
    : null;

  return (
    <div>
      <article>
        {/* OUVERTURE — ce que c'est, où tu en es, l'objet qui le prouve. */}
        <section className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:min-h-[78svh] lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16">
          <Reveal y={22}>
            <h1 className="display display-xl max-w-[17ch] text-balance">
              Apprends Git en voyant le graphe.
            </h1>
            <p className="mt-6 max-w-[44ch] text-[17px] leading-[1.55] text-text">
              Six chapitres, dix-neuf missions. Tu tapes une vraie commande, le dépôt se
              redessine : branches, HEAD, index et worktrees deviennent lisibles.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {hydrated ? (
                <a
                  href={target.route}
                  className="btn btn-accent h-12 gap-4 px-5 text-[15px]"
                >
                  {target.label}
                  <Icon name="arrow-right" size={16} />
                </a>
              ) : (
                <span
                  className="btn btn-accent invisible h-12 gap-4 px-5 text-[15px]"
                  aria-hidden="true"
                >
                  Chargement
                </span>
              )}
              <a href={routePaths.sandbox} className="btn btn-quiet h-12 px-4 text-[15px]">
                <Icon name="terminal" size={15} />
                Ouvrir le bac à sable
              </a>
            </div>
            <p className="mt-4 min-h-4 text-[13px] text-muted" aria-live="polite">
              {hydrated ? context : '\u00a0'}
            </p>
          </Reveal>

          <Reveal delay={0.12} className="min-w-0">
            <GraphFragment />
          </Reveal>
        </section>

        {/* PROLOGUE — chapitre zéro : décoder avant de taper. */}
        <section className="mx-auto max-w-[1180px] px-5 pb-16 sm:px-8" aria-labelledby="prologue">
          <Reveal className="bg-panel px-5 py-6 sm:px-7 sm:py-7">
            <h2 id="prologue" className="display text-[30px] leading-tight">
              Avant de taper
            </h2>
            <a
              href={routePaths.prologue}
              className="group mt-4 flex flex-wrap items-end justify-between gap-4"
            >
              <span className="min-w-0 max-w-[58ch]">
                <span className="block text-[17px] font-medium text-text">
                  Prologue · Lire une commande Git
                </span>
                <span className="mt-1.5 block text-[16px] leading-relaxed text-muted">
                  Options, guillemets, placeholders : décoder n’importe quelle commande avant de
                  commencer. {estimatedLessonMinutes(commandLineLesson)} min.
                </span>
              </span>
              <span className="inline-flex items-center gap-2 text-[15px] text-text">
                {prologueRead ? 'Relire' : 'Lire'}
                <Icon
                  name="arrow-right"
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </a>
          </Reveal>
        </section>

        {/* LE PARCOURS — six champs, six voies, la progression dessus. */}
        <section aria-labelledby="parcours">
          <div className="mx-auto max-w-[1180px] px-5 pb-10 sm:px-8">
            <h2 id="parcours" className="display text-[30px] leading-none">
              Le parcours
            </h2>
            <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-muted">
              Six voies, du premier commit aux conflits de pull. Une mission ne s’ouvre qu’une
              fois la précédente terminée.
            </p>
          </div>

          <ol className="list-none">
            {chapters.map((chapter, index) => (
              <ChapterField
                key={chapter.id}
                chapter={chapter}
                lane={index + 1}
                completed={completed}
                headMissionId={headMissionId}
              />
            ))}
          </ol>
        </section>

        {/* CE QUE TU REGARDES — trois écrans réels, pas des captures. */}
        <section
          className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8"
          aria-labelledby="dedans"
        >
          <h2 id="dedans" className="display text-[clamp(2rem,3.4vw,2.8rem)] leading-none">
            Ce que tu regardes
          </h2>
          <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-muted">
            Quatre panneaux, un seul dépôt. Le terminal écrit, le graphe répond, le pipeline
            montre le fichier qui traverse l’index, la prédiction te fait parier avant de voir.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Reveal>
              <TerminalFragment />
            </Reveal>
            <Reveal delay={0.08}>
              <MissionFragment />
            </Reveal>
            <Reveal delay={0.16}>
              <PipelineFragment />
            </Reveal>
            <Reveal delay={0.24}>
              <PredictionFragment />
            </Reveal>
          </div>
        </section>

        {/* OÙ TU EN ES — niveau, badges, dernier épisode, ton arbre. */}
        <section className="bg-panel" aria-labelledby="etat">
          <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-20">
            <h2 id="etat" className="display text-[30px] leading-none">
              Où tu en es
            </h2>

            <p className="mt-8 text-[15px] leading-none text-muted">
              <span className="mr-2 text-[32px] tabular-nums text-text">{done}</span>
              missions sur {totalMissions}
              <span className="mx-6 inline-block" aria-hidden="true" />
              <span className="mr-2 text-[32px] tabular-nums text-text">{totalStars}</span>
              étoiles sur {totalMissions * 3}
              <span className="mx-6 inline-block" aria-hidden="true" />
              <span className="mr-2 text-[32px] tabular-nums text-text">{percent}%</span>
              du parcours
            </p>
            <div className="mt-4 h-1 w-full max-w-[520px] bg-panel-3">
              <span className="block h-full bg-accent" style={{ width: `${percent}%` }} />
            </div>

            <Reveal>
              <ProgressPanel summary={summary} />
            </Reveal>

            <Reveal className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
              {lastCompleted !== undefined && lastBriefing?.outcome !== undefined && (
                <section className="bg-panel-2 p-6" aria-label="Dernier épisode">
                  <p className="text-[13px] text-muted">
                    Dernier épisode · {lastCompleted.number}
                  </p>
                  <p className="mt-1.5 text-[17px] font-medium text-text">{lastCompleted.title}</p>
                  <p className="mt-2 text-[16px] leading-relaxed text-muted">
                    {lastBriefing.outcome}
                  </p>
                  {lastBriefing.teaser !== undefined && (
                    <p className="mt-3 text-[13px] leading-relaxed text-muted">
                      <span className="text-text">À suivre · </span>
                      {lastBriefing.teaser}
                    </p>
                  )}
                </section>
              )}

              <section className="bg-panel-2 p-6" aria-label="Ton arbre Nova">
                <p className="text-[13px] text-muted">Le dépôt que tu construis</p>
                <p className="mt-1.5 text-[17px] font-medium text-text">L’arbre de Nova</p>
                <p className="mt-2 text-[16px] leading-relaxed text-muted">
                  Chaque mission laisse un commit. À la fin, tu ouvres l’arbre complet et tu le
                  lis comme une histoire.
                </p>
                <a
                  href={routePaths.nova}
                  className="mt-4 inline-flex items-center gap-2 text-[15px] text-text hover:text-accent-ink"
                >
                  Ton arbre Nova
                  <Icon name="arrow-right" size={14} />
                </a>
              </section>
            </Reveal>
          </div>
        </section>

        <footer className="mx-auto max-w-[1180px] px-5 pb-14 pt-16 sm:px-8">
          <p className="display text-[clamp(3rem,11vw,8rem)] leading-[0.8] text-text">GitQuest</p>
          <div className="mt-8 flex flex-wrap items-start justify-between gap-8">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
              <a href={routePaths.home} className="text-text hover:text-accent-ink">
                Chapitres
              </a>
              <a href={routePaths.prologue} className="text-text hover:text-accent-ink">
                Prologue
              </a>
              <a href={routePaths.sandbox} className="text-text hover:text-accent-ink">
                Bac à sable
              </a>
              <a href={routePaths.nova} className="text-text hover:text-accent-ink">
                Mon arbre
              </a>
            </div>
            <div className="flex flex-col gap-2 text-[13px] text-muted">
              <span>Progression enregistrée sur cet appareil. Hors ligne, sans compte.</span>
              <ProgressBackup />
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}
