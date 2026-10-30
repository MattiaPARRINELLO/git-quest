import { chapters, chapterMissions, findChapter } from '../content';
import { briefingFor } from '../content/briefings';
import { routePaths } from '../router/useHashRoute';
import { useProgressStore } from '../store/useProgressStore';
import { Icon } from '../components/ui/Icon';
import { cn } from '../lib/cn';

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
      <div className="mx-auto max-w-[820px] px-5 py-12 sm:px-8 sm:py-16">
        <p className="flex items-center gap-2 text-[11.5px] text-muted">
          <span aria-hidden="true" className="h-3 w-[2px] rounded-full bg-accent" />
          Chapitre {previous.number} terminé
        </p>
        <h1 className="display mt-2 text-[38px] leading-[1.08] text-text">{previous.title}</h1>
        <p className="mt-3 max-w-[54ch] text-[14px] leading-7 text-muted">{previous.description}</p>

        <div className="mt-6 flex flex-wrap items-center gap-5 border-y border-border py-3">
          <span className="font-mono text-[11.5px] tabular-nums text-muted">
            <span className="text-text">{missions.length}</span> missions
          </span>
          <span className="font-mono text-[11.5px] tabular-nums text-muted">
            <span className="text-text">{stars}</span> / {missions.length * 3} étoiles
          </span>
        </div>

        <ol className="mt-5 divide-y divide-border">
          {missions.map((mission) => {
            const messages = [
              ...new Set(
                Object.values(slots)
                  .filter((record) => record.missionId === mission.id)
                  .map((record) => record.message),
              ),
            ];
            const missionStars = completed[mission.id]?.stars ?? 0;
            return (
              <li key={mission.id} className="py-2.5">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-mono text-[10.5px] text-muted">{mission.number}</span>
                  <span className="text-[13px] font-medium text-text">{mission.title}</span>
                  <span className="inline-flex items-center gap-[3px]" aria-label="étoiles">
                    {[0, 1, 2].map((position) => (
                      <span
                        key={position}
                        className={cn(
                          'h-[5px] w-[5px] rounded-full',
                          position < missionStars ? 'bg-warning' : 'bg-border-strong/60',
                        )}
                      />
                    ))}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted">
                  {messages.length > 0 ? messages.join(' · ') : 'Aucun message personnel'}
                </p>
              </li>
            );
          })}
        </ol>

        {teaser !== undefined && (
          <p className="mt-6 border-l-2 border-accent pl-3 text-[14px] leading-7 text-muted">
            <span className="text-text">À suivre · </span>
            {teaser}
          </p>
        )}

        <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <a href={routePaths.home} className="btn h-9 justify-center px-3 text-[13px]">
            Carte des chapitres
          </a>
          <a
            href={routePaths.lesson(chapter.id)}
            className="btn btn-accent h-9 justify-center px-3.5 text-[13px]"
          >
            Commencer le chapitre {chapter.number}
            <Icon name="arrow-right" size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}
