import type { Chapter } from '../../content/types';
import { estimatedLessonMinutes, isMissionUnlocked } from '../../content';
import { routePaths } from '../../router/useHashRoute';
import { cn } from '../../lib/cn';
import { Icon } from '../ui/Icon';
import { Reveal } from './Reveal';

export interface ChapterFieldProps {
  readonly chapter: Chapter;
  /** Rang du champ dans la palette des six voies (1 à 6). */
  readonly lane: number;
  readonly completed: Readonly<Record<string, { readonly stars: number } | undefined>>;
  /** Mission du point de reprise : c'est là que HEAD se pose. */
  readonly headMissionId: string | null;
}

function Stars({ count }: { readonly count: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-label={`${count} étoile(s) sur 3`}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn('h-[6px] w-[6px]', index < count ? 'bg-current' : 'bg-current/25')}
        />
      ))}
    </span>
  );
}

/** La première commande du cours du chapitre : l'objet que la voie enseigne. */
function courseCommand(chapter: Chapter): string | null {
  for (const slide of chapter.lesson.slides) {
    if (slide.kind === 'text' && slide.command) return slide.command;
    if (slide.kind === 'recap' && slide.commands[0]) return slide.commands[0].command;
  }
  return null;
}

/**
 * Un chapitre, un champ. La couleur du champ est la couleur de la voie dans le
 * graphe ; les missions sont les nœuds posés dessus.
 */
export function ChapterField({ chapter, lane, completed, headMissionId }: ChapterFieldProps) {
  const done = chapter.missions.filter((mission) => completed[mission.id] !== undefined).length;
  const command = courseCommand(chapter);
  const headingId = `chapitre-${chapter.id}`;

  return (
    <li>
      <section
        aria-labelledby={headingId}
        className={cn('field', `field-${lane}`)}
      >
        <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-20">
          <div>
            <Reveal>
              <h2 id={headingId} className="display display-xl max-w-[18ch] text-balance">
                {chapter.title}
              </h2>
            </Reveal>
            <Reveal delay={0.06}>
              <p className="mt-5 max-w-[40ch] text-[17px] leading-[1.45]">{chapter.tagline}</p>
              <p className="mt-3 max-w-[52ch] text-[16px] leading-[1.65] opacity-85">
                {chapter.description}
              </p>
            </Reveal>

            {command !== null && (
              <Reveal delay={0.12}>
                <pre className="mt-7 inline-block max-w-full overflow-x-auto bg-black/15 px-4 py-3 text-[13px] leading-6">
                  <code>{command}</code>
                </pre>
              </Reveal>
            )}

            <Reveal delay={0.18}>
              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
                <a
                  href={routePaths.lesson(chapter.id)}
                  className="ink-btn inline-flex h-10 items-center gap-2 px-4 text-[13.5px] font-medium"
                >
                  <Icon name="book" size={14} />
                  Lire le cours
                </a>
                <span className="max-w-full text-[13px] tabular-nums opacity-80">
                  Chapitre {chapter.number} · {done}/{chapter.missions.length} missions ·{' '}
                  {estimatedLessonMinutes(chapter.lesson)} min de cours
                </span>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="lg:pt-2">
            <p className="text-[13px] opacity-70">
              {chapter.missions.length} missions sur cette voie
            </p>
            <ol className="relative mt-4">
              <span
                aria-hidden="true"
                className="absolute bottom-4 left-[5px] top-4 w-[2px] bg-current opacity-25"
              />
              {chapter.missions.map((mission) => {
                const unlocked = isMissionUnlocked(mission.id, completed);
                const completion = completed[mission.id];
                const isHead = mission.id === headMissionId;

                return (
                  <li key={mission.id}>
                    {unlocked ? (
                      <a
                        href={routePaths.mission(mission.id)}
                        className="group relative flex min-h-11 items-start gap-4 py-2.5 transition-opacity hover:opacity-100"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'relative z-10 mt-[7px] h-3 w-3 shrink-0',
                            completion ? 'bg-current' : 'bg-current/30',
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2.5">
                            <span className="text-[13px] tabular-nums opacity-60">
                              {mission.number}
                            </span>
                            <span className="text-[15px] font-medium leading-snug">
                              {mission.title}
                            </span>
                            {isHead && (
                              <span className="bg-current px-1.5 py-px text-[13px] font-semibold tracking-[0.06em] text-bg">
                                HEAD
                              </span>
                            )}
                          </span>
                          <span className="mt-1 flex items-center gap-3 text-[13px] opacity-75">
                            {completion ? (
                              <>
                                <Stars count={completion.stars} />
                                <span>terminée</span>
                              </>
                            ) : (
                              <span>à faire</span>
                            )}
                          </span>
                        </span>
                        <Icon
                          name="arrow-right"
                          size={14}
                          className="mt-1.5 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5"
                        />
                      </a>
                    ) : (
                      <div className="relative flex min-h-11 items-start gap-4 py-2.5 opacity-55">
                        <span
                          aria-hidden="true"
                          className="relative z-10 mt-[7px] h-3 w-3 shrink-0 bg-current/30"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline gap-x-2.5">
                            <span className="text-[13px] tabular-nums opacity-60">
                              {mission.number}
                            </span>
                            <span className="text-[15px] leading-snug">{mission.title}</span>
                          </span>
                          <span className="mt-1 flex items-center gap-1.5 text-[13px]">
                            <Icon name="lock" size={11} />
                            verrouillée
                          </span>
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </Reveal>
        </div>
      </section>
    </li>
  );
}
