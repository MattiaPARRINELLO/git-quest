import { useMemo } from 'react';
import { chapters } from '../content';
import { createDemoState } from '../content/sandbox';
import { CommitGraph } from '../components/graph/CommitGraph';
import { Icon } from '../components/ui/Icon';
import { routePaths } from '../router/useHashRoute';
import { useProgressStore } from '../store/useProgressStore';

/**
 * Écran final minimal : une dernière vue de l'arbre de Nova, les statistiques
 * du parcours et les sorties vers la carte des chapitres ou le bac à sable.
 */
export function FinalScreen() {
  const completed = useProgressStore((store) => store.completed);
  const state = useMemo(() => createDemoState(), []);
  const batch = useMemo(() => ({ id: 0, events: [] }), []);

  const totalMissions = chapters.reduce((sum, chapter) => sum + chapter.missions.length, 0);
  const totalStars = Object.values(completed).reduce((sum, item) => sum + item.stars, 0);
  const done = Object.keys(completed).length;

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-3xl border border-border bg-panel p-6 sm:p-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
            Parcours terminé
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Ton arbre Nova
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Quinze missions plus tard, tu lis un dépôt Git comme une histoire : des commits,
            des branches qui pointent, un HEAD qui avance et des worktrees qui travaillent en
            parallèle. Voici l’arbre de Nova, avec un merge et un worktree de plus.
          </p>

          <div className="mt-6 h-[380px] overflow-hidden rounded-2xl border border-border bg-bg">
            <CommitGraph state={state} batch={batch} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/70 pt-4 text-xs text-muted">
            <span>
              <strong className="text-text">{done}</strong> / {totalMissions} missions
            </span>
            <span>
              <strong className="text-text">{totalStars}</strong> / {totalMissions * 3} étoiles
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <a href={routePaths.home} className="btn px-3 py-2 text-sm">
              Revoir la carte des chapitres
            </a>
            <a href={routePaths.sandbox} className="btn btn-accent px-3 py-2 text-sm">
              <Icon name="terminal" size={14} />
              Continuer dans le bac à sable
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
