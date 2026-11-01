import { chapters, chapterMissions, findChapter } from '../content';
import { briefingFor } from '../content/briefings';
import { routePaths } from '../router/useHashRoute';
import { useProgressStore } from '../store/useProgressStore';
import { Icon } from '../components/ui/Icon';
import { cn } from '../lib/cn';

/**
 * Transition entre deux chapitres : bilan de celui qui vient d'être terminé,
 * avec les étoiles et les messages du joueur, puis entrée dans le suivant.
 * Le champ prend la couleur de la voie qui s'ouvre.
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
        <p className="text-[15px] text-muted">Transition introuvable.</p>
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
      <section className={cn('field', `field-${index + 1}`)}>
        <div className="mx-auto max-w-[820px] px-5 py-14 sm:px-8 sm:py-20">
          <h1 className="display display-xl text-balance">{previous.title}</h1>
          <p className="mt-5 text-[17px] leading-relaxed">
            Chapitre {previous.number} terminé · {missions.length} missions · {stars} /{' '}
            {missions.length * 3} étoiles
          </p>
          <p className="mt-3 max-w-[54ch] text-[16px] leading-relaxed opacity-85">
            {previous.description}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[820px] px-5 py-12 sm:px-8 sm:py-16">
        <h2 className="display text-[30px] leading-none text-text">Ce que tu as laissé</h2>

        <ol className="mt-6 space-y-5">
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
              <li key={mission.id}>
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="text-[13px] tabular-nums text-muted">{mission.number}</span>
                  <span className="text-[16px] font-medium text-text">{mission.title}</span>
                  <span className="inline-flex items-center gap-[3px]" aria-label="étoiles">
                    {[0, 1, 2].map((position) => (
                      <span
                        key={position}
                        className={cn(
                          'h-[7px] w-[7px]',
                          position < missionStars ? 'bg-warning' : 'bg-border-strong/50',
                        )}
                      />
                    ))}
                  </span>
                </div>
                <p className="mt-1 text-[14px] leading-relaxed text-muted">
                  {messages.length > 0 ? messages.join(' · ') : 'Aucun message personnel'}
                </p>
              </li>
            );
          })}
        </ol>

        {teaser !== undefined && (
          <p className="mt-8 max-w-[56ch] text-[16px] leading-relaxed text-muted">
            <span className="text-text">À suivre · </span>
            {teaser}
          </p>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <a href={routePaths.home} className="btn btn-quiet h-11 justify-center px-4">
            Carte des chapitres
          </a>
          <a
            href={routePaths.lesson(chapter.id)}
            className="btn btn-accent h-11 justify-center px-5 text-[14px]"
          >
            Commencer le chapitre {chapter.number}
            <Icon name="arrow-right" size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}
