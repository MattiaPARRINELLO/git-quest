import { Icon } from '../components/ui/Icon';
import { LessonDeck } from '../components/lesson/LessonDeck';
import { firstMissionOfChapter, findChapter, isMissionUnlocked } from '../content';
import { routePaths } from '../router/useHashRoute';
import { useProgressStore } from '../store/useProgressStore';

export function LessonScreen({ chapterId }: { readonly chapterId: string }) {
  const chapter = findChapter(chapterId);
  const completed = useProgressStore((store) => store.completed);

  if (!chapter) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted">
        <p>Chapitre introuvable.</p>
        <a href={routePaths.home} className="btn">
          Retour aux chapitres
        </a>
      </div>
    );
  }

  const firstMission = firstMissionOfChapter(chapter.id);
  const missionUnlocked = firstMission
    ? isMissionUnlocked(firstMission.id, completed)
    : false;

  const lastAction =
    missionUnlocked && firstMission ? (
      <a href={routePaths.mission(firstMission.id)} className="btn btn-accent px-3 py-2 text-sm">
        Passer aux missions
        <Icon name="arrow-right" size={15} />
      </a>
    ) : (
      <span className="text-right text-[11px] text-muted">
        Termine les missions précédentes pour déverrouiller celles de ce chapitre.
      </span>
    );

  return (
    <LessonDeck
      lesson={chapter.lesson}
      storageId={chapter.id}
      badge={`Chapitre ${chapter.number}`}
      backHref={routePaths.home}
      backLabel="Chapitres"
      lastAction={lastAction}
    />
  );
}
