import { useMemo } from 'react';
import { chapters } from '../content';
import { createDemoState } from '../content/sandbox';
import { CommitGraph } from '../components/graph/CommitGraph';
import { Icon } from '../components/ui/Icon';
import { progressSummary } from '../app/xp';
import { ProgressPanel } from '../components/progress/ProgressPanel';
import { routePaths } from '../router/useHashRoute';
import { useProgressStore } from '../store/useProgressStore';

/**
 * Écran final minimal : une dernière vue de l'arbre de Nova, les statistiques
 * du parcours et les sorties vers la carte des chapitres ou le bac à sable.
 */
export function FinalScreen() {
  const completed = useProgressStore((store) => store.completed);
  const lessonSlides = useProgressStore((store) => store.lessonSlides);
  const state = useMemo(() => createDemoState(), []);
  const batch = useMemo(() => ({ id: 0, events: [] }), []);
  const summary = useMemo(
    () => progressSummary({ completed, lessonSlides }),
    [completed, lessonSlides],
  );

  const totalMissions = chapters.reduce((sum, chapter) => sum + chapter.missions.length, 0);
  const totalStars = Object.values(completed).reduce((sum, item) => sum + item.stars, 0);
  const done = Object.keys(completed).length;

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-[1000px] px-5 py-10 sm:px-8 sm:py-14">
        <p className="flex items-center gap-2 text-[11.5px] text-muted">
          <span aria-hidden="true" className="h-3 w-[2px] rounded-full bg-accent" />
          Parcours terminé
        </p>
        <h1 className="display mt-2 text-[42px] leading-[1.04] text-text">Ton arbre Nova</h1>
        <p className="mt-3 max-w-[56ch] text-[14.5px] leading-7 text-muted">
          Dix-neuf missions plus tard, tu lis un dépôt Git comme une histoire : des commits,
          des branches qui pointent, un HEAD qui avance et des worktrees qui travaillent en
          parallèle. Voici l’arbre de Nova, avec un merge et un worktree de plus.
        </p>

        <div className="mt-7 overflow-hidden rounded-xl border border-border bg-panel">
          <div className="h-[380px]">
            <CommitGraph state={state} batch={batch} />
          </div>
        </div>

        <dl className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-border pt-4">
          <div className="flex items-baseline gap-2">
            <dt className="mono-meta">Missions</dt>
            <dd className="font-mono text-[15px] tabular-nums text-text">
              {done} <span className="text-[12px] text-muted">/ {totalMissions}</span>
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="mono-meta">Étoiles</dt>
            <dd className="font-mono text-[15px] tabular-nums text-text">
              {totalStars} <span className="text-[12px] text-muted">/ {totalMissions * 3}</span>
            </dd>
          </div>
        </dl>

        <ProgressPanel summary={summary} compact />

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <a href={routePaths.home} className="btn h-9 px-3 text-[13px]">
            Revoir la carte des chapitres
          </a>
          <a href={routePaths.sandbox} className="btn btn-accent h-9 gap-2 px-3.5 text-[13px]">
            <Icon name="terminal" size={14} />
            Continuer dans le bac à sable
          </a>
        </div>
      </div>
    </div>
  );
}
