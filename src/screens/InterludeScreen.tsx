import { chapters, chapterMissions, findChapter } from '../content';
import { briefingFor } from '../content/briefings';
import { routePaths } from '../router/useHashRoute';
import { useProgressStore } from '../store/useProgressStore';
import { Icon } from '../components/ui/Icon';

/**
 * Transition entre deux chapitres : bilan de celui qui vient d'être terminé,
 * avec les étoiles et les messages du joueur, puis entrée dans le suivant.
 */
export function InterludeScreen({ chapterId }: { readonly chapterId: string }) {
  const completed = useProgressStore((store) => store.completed);
  const slots = useProgressStore((store) => store.story.slots);
  const chapter = findChapter(chapterId);
  const index = chapters.findIndex((candidate) => candidate.id === chapterId);
  const previous = index > 0 ? chapters[index - 1] : undefined;

  if (chapter === undefined || previous === undefined) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-muted">Transition introuvable.</p>
        <a href={routePaths.home} className="btn">
          Retour aux chapitres
        </a>
      </div>
    );
  }

  const missions = chapterMissions(previous.id);
  const lastMission = missions[missions.length - 1];
  const teaser = lastMission === undefined ? undefined : briefingFor(lastMission.id)?.teaser;
  const stars = missions.reduce((sum, mission) => sum + (completed[mission.id]?.stars ?? 0), 0);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
          Chapitre {previous.number} terminé
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">{previous.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{previous.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted">
          <span>
            <strong className="text-text">{missions.length}</strong> missions
          </span>
          <span>
            <strong className="text-text">{stars}</strong> / {missions.length * 3} étoiles
          </span>
        </div>

        <ol className="mt-5 space-y-1.5">
          {missions.map((mission) => {
            const messages = [
              ...new Set(
                Object.values(slots)
                  .filter((record) => record.missionId === mission.id)
                  .map((record) => record.message),
              ),
            ];
            return (
              <li
                key={mission.id}
                className="rounded-xl border border-border bg-panel px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-[10px] text-accent">{mission.number}</span>
                  <span className="text-sm font-medium text-text">{mission.title}</span>
                  <span className="text-[10px] text-warning" aria-label="étoiles">
                    {'★'.repeat(completed[mission.id]?.stars ?? 0)}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[10px] text-muted">
                  {messages.length > 0 ? messages.join(' · ') : 'Aucun message personnel'}
                </p>
              </li>
            );
          })}
        </ol>

        {teaser !== undefined && (
          <p className="mt-5 border-l-2 border-accent/50 pl-3 text-sm leading-relaxed text-muted">
            <span className="font-semibold uppercase tracking-wider text-accent">À suivre · </span>
            {teaser}
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <a href={routePaths.home} className="btn justify-center px-3 py-2 text-sm">
            Carte des chapitres
          </a>
          <a
            href={routePaths.lesson(chapter.id)}
            className="btn btn-accent justify-center px-3 py-2 text-sm"
          >
            Commencer le chapitre {chapter.number}
            <Icon name="arrow-right" size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}
