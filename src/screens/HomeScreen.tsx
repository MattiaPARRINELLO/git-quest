import { chapters, isMissionUnlocked } from '../content';
import { useProgressStore } from '../store/useProgressStore';
import { routePaths } from '../router/useHashRoute';
import { branchColor } from '../lib/colors';
import { Icon } from '../components/ui/Icon';

function Stars({ count, max = 3 }: { readonly count: number; readonly max?: number }) {
  return (
    <span className="font-mono text-[11px] tracking-tight text-warning" aria-label={`${count} étoile(s) sur ${max}`}>
      {'★'.repeat(count)}
      <span className="text-muted/40">{'★'.repeat(Math.max(0, max - count))}</span>
    </span>
  );
}

export function HomeScreen() {
  const completed = useProgressStore((store) => store.completed);
  const totalMissions = chapters.reduce((sum, chapter) => sum + chapter.missions.length, 0);
  const totalStars = Object.values(completed).reduce((sum, item) => sum + item.stars, 0);
  const done = Object.keys(completed).length;
  const percent = totalMissions === 0 ? 0 : Math.round((done / totalMissions) * 100);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-panel p-6 sm:p-9">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: 'var(--accent)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ background: 'var(--accent-2)' }}
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Apprendre Git par la pratique
          </p>
          <h1 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Maîtrise Git en le voyant.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Quatre chapitres, douze missions réalistes. Chaque commande se rejoue sous tes
            yeux : le graphe, HEAD, l’index et les worktrees deviennent enfin lisibles.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <a href={routePaths.lesson(chapters[0]?.id ?? '')} className="btn btn-accent px-3 py-2 text-sm">
              Commencer le chapitre 1
              <Icon name="arrow-right" size={15} />
            </a>
            <a href={routePaths.sandbox} className="btn px-3 py-2 text-sm">
              <Icon name="terminal" size={14} />
              Ouvrir le bac à sable
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/70 pt-4 text-xs text-muted">
            <span>
              <strong className="text-text">{done}</strong> / {totalMissions} missions
            </span>
            <span>
              <strong className="text-text">{totalStars}</strong> / {totalMissions * 3} étoiles
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-28 overflow-hidden rounded-full bg-panel-3">
                <span
                  className="block h-full rounded-full bg-accent transition-all"
                  style={{ width: `${percent}%` }}
                />
              </span>
              {percent}%
            </span>
          </div>
        </section>

        <section className="mt-8" aria-label="Chapitres">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-text">Ta carte de progression</h2>
            <span className="text-[11px] text-muted">Les missions se déverrouillent dans l’ordre.</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                  className="flex flex-col rounded-2xl border border-border bg-panel p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-xl border font-mono text-sm font-semibold"
                        style={{ borderColor: `${color}66`, color, background: `${color}14` }}
                      >
                        {chapter.number}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-text">{chapter.title}</h3>
                        <p className="text-[11px] text-muted">{chapter.tagline}</p>
                      </div>
                    </div>
                    <Stars count={chapterStars} max={chapter.missions.length * 3} />
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-muted">{chapter.description}</p>

                  <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-muted">
                    <span>
                      {chapterDone} / {chapter.missions.length} missions · {chapter.lesson.minutes} min de cours
                    </span>
                    <a
                      href={routePaths.lesson(chapter.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-text transition-colors hover:border-border-strong"
                    >
                      <Icon name="book" size={12} />
                      Cours
                    </a>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {chapter.missions.map((mission) => {
                      const unlocked = isMissionUnlocked(mission.id, completed);
                      const completion = completed[mission.id];

                      return (
                        <li key={mission.id}>
                          {unlocked ? (
                            <a
                              href={routePaths.mission(mission.id)}
                              className="group flex items-center justify-between gap-2 rounded-lg border border-transparent bg-panel-2/60 px-2.5 py-2 transition-colors hover:border-border-strong"
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="font-mono text-[10px] text-muted">{mission.number}</span>
                                <span className="truncate text-xs text-text">{mission.title}</span>
                              </span>
                              <span className="flex items-center gap-2">
                                {completion ? (
                                  <Stars count={completion.stars} />
                                ) : (
                                  <span className="font-mono text-[10px] text-muted">à faire</span>
                                )}
                                <Icon
                                  name="arrow-right"
                                  size={13}
                                  className="text-muted transition-transform group-hover:translate-x-0.5"
                                />
                              </span>
                            </a>
                          ) : (
                            <div
                              className="flex items-center justify-between gap-2 rounded-lg border border-transparent px-2.5 py-2 opacity-55"
                              aria-disabled="true"
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="font-mono text-[10px] text-muted">{mission.number}</span>
                                <span className="truncate text-xs text-muted">{mission.title}</span>
                              </span>
                              <Icon name="lock" size={13} className="shrink-0 text-muted" />
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

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted">
          <span>GitQuest — progress sauvegardée localement.</span>
          <a href={routePaths.sandbox} className="inline-flex items-center gap-1 hover:text-text">
            Terminal libre <Icon name="arrow-right" size={12} />
          </a>
        </footer>
      </div>
    </div>
  );
}
