import { Icon } from '../components/ui/Icon';
import { LessonDeck } from '../components/lesson/LessonDeck';
import { firstMissionOfChapter, findChapter, isMissionUnlocked } from '../content';
import { routePaths } from '../router/useHashRoute';
import { useProgressStore } from '../store/useProgressStore';
import { useTranslation } from '../i18n/useTranslation';

export function LessonScreen({ chapterId }: { readonly chapterId: string }) {
  const { t } = useTranslation();
  const chapter = findChapter(chapterId);
  const completed = useProgressStore((store) => store.completed);

  if (!chapter) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted">
        <p>{t('lesson.notFound')}</p>
        <a href={routePaths.home} className="btn">
          {t('app.backToChapters')}
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
        {t('lesson.startMissions')}
        <Icon name="arrow-right" size={15} />
      </a>
    ) : (
      <span className="text-right text-[11px] text-muted">{t('lesson.lockedHint')}</span>
    );

  return (
    <LessonDeck
      lesson={chapter.lesson}
      storageId={chapter.id}
      badge={t('lesson.chapterBadge', { number: chapter.number })}
      backHref={routePaths.home}
      backLabel={t('nav.chapters')}
      lastAction={lastAction}
    />
  );
}
