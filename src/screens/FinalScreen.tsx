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
 * Écran final : une dernière vue de l'arbre de Nova, les statistiques du
 * parcours et les sorties vers la carte des chapitres ou le bac à sable.
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
      <div className="mx-auto max-w-[1060px] px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="display text-balance text-[28px] leading-[1.1] sm:text-[32px]">Ton arbre Nova</h1>
        <p className="mt-5 max-w-[60ch] text-[17px] leading-[1.6] text-text">
          Dix-neuf missions plus tard, tu lis un dépôt Git comme une histoire : des commits, des
          branches qui pointent, un HEAD qui avance et des worktrees qui travaillent en parallèle.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Parcours terminé.
        </p>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-10 gap-y-3 text-[15px] text-muted">
          <span className="inline-flex items-baseline gap-2">
            <span className="text-[28px] leading-none tabular-nums text-text">{done}</span>
            missions sur {totalMissions}
          </span>
          <span className="inline-flex items-baseline gap-2">
            <span className="text-[28px] leading-none tabular-nums text-text">{totalStars}</span>
            étoiles sur {totalMissions * 3}
          </span>
        </p>

        <div className="mt-8 bg-panel">
          <div className="h-[400px]">
            <CommitGraph state={state} batch={batch} />
          </div>
        </div>

        <ProgressPanel summary={summary} compact />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href={routePaths.home} className="btn btn-quiet h-11 px-4">
            Revoir la carte des chapitres
          </a>
          <a href={routePaths.sandbox} className="btn btn-accent h-11 gap-2 px-5 text-[14px]">
            <Icon name="terminal" size={15} />
            Continuer dans le bac à sable
          </a>
        </div>
      </div>
    </div>
  );
}
