import { useEffect, useState } from 'react';
import { AnimatedSlide, DemoSlideView } from '../components/lesson/MiniDemo';
import { Diagram } from '../components/lesson/diagrams';
import { Icon } from '../components/ui/Icon';
import {
  estimatedLessonMinutes,
  firstMissionOfChapter,
  findChapter,
  isMissionUnlocked,
} from '../content';
import type { LessonSlide } from '../content/types';
import { routePaths } from '../router/useHashRoute';
import { useProgressStore } from '../store/useProgressStore';
import { cn } from '../lib/cn';
import { branchColor } from '../lib/colors';

function clampIndex(index: number, total: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(0, Math.trunc(index)), Math.max(0, total - 1));
}

const KIND_LABEL: Record<LessonSlide['kind'], string> = {
  text: 'Texte',
  diagram: 'Schéma',
  demo: 'Démo',
  recap: 'Récapitulatif',
};

function SlideView({ slide }: { readonly slide: LessonSlide }) {
  switch (slide.kind) {
    case 'text':
      return (
        <div>
          <h2 className="display text-[30px] leading-[1.12] text-text">{slide.title}</h2>
          <div className="mt-4 max-w-[62ch] space-y-3.5">
            {slide.paragraphs.map((paragraph) => (
              <p key={paragraph} className="display text-[17px] leading-[1.7] text-text/85">
                {paragraph}
              </p>
            ))}
          </div>
          {slide.command && (
            <pre className="mt-5 max-w-[62ch] overflow-x-auto rounded-lg border border-border bg-panel-2 px-3.5 py-2.5 font-mono text-[12.5px] leading-6 text-text">
              <span className="select-none text-muted/70">$ </span>
              {slide.command}
            </pre>
          )}
          {slide.note && (
            <p className="mt-4 max-w-[62ch] border-l-2 border-warning/60 pl-3 text-[13px] leading-6 text-muted">
              <span className="text-warning">À noter · </span>
              {slide.note}
            </p>
          )}
        </div>
      );
    case 'diagram':
      return (
        <div>
          <h2 className="display text-[30px] leading-[1.12] text-text">{slide.title}</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-panel">
            <div className="p-4">
              <Diagram id={slide.diagram} />
            </div>
            {slide.caption && (
              <p className="border-t border-border px-4 py-2 text-center text-[11.5px] text-muted">
                {slide.caption}
              </p>
            )}
          </div>
        </div>
      );
    case 'demo':
      return <DemoSlideView slide={slide} />;
    case 'recap':
      return (
        <div>
          <h2 className="display text-[30px] leading-[1.12] text-text">{slide.title}</h2>
          <ul className="mt-4 max-w-[62ch] divide-y divide-border border-y border-border">
            {slide.commands.map((item) => (
              <li key={item.command} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:gap-4">
                <code className="shrink-0 font-mono text-[12.5px] leading-6 text-accent-2 sm:w-56">
                  {item.command}
                </code>
                <span className="text-[13px] leading-6 text-muted">{item.description}</span>
              </li>
            ))}
          </ul>
        </div>
      );
  }
}

export function LessonScreen({ chapterId }: { readonly chapterId: string }) {
  const chapter = findChapter(chapterId);
  const setLessonSlide = useProgressStore((store) => store.setLessonSlide);
  const completed = useProgressStore((store) => store.completed);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!chapter) return;
    const saved = useProgressStore.getState().lessonSlides[chapter.id] ?? 0;
    setIndex(clampIndex(saved, chapter.lesson.slides.length));
  }, [chapter]);

  useEffect(() => {
    if (!chapter) return;
    setLessonSlide(chapter.id, index);
  }, [chapter, index, setLessonSlide]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (!chapter) return;
      if (event.key === 'ArrowRight') {
        setIndex((current) => Math.min(chapter.lesson.slides.length - 1, current + 1));
      }
      if (event.key === 'ArrowLeft') {
        setIndex((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [chapter]);

  if (!chapter) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted">
        <p>Chapitre introuvable.</p>
        <a href={routePaths.home} className="btn">
          Retour aux chapitres
        </a>
      </div>
    );
  }

  const slide = chapter.lesson.slides[index];
  const total = chapter.lesson.slides.length;
  const isLast = index >= total - 1;
  const firstMission = firstMissionOfChapter(chapter.id);
  const missionUnlocked = firstMission
    ? isMissionUnlocked(firstMission.id, completed)
    : false;
  const color = branchColor(chapter.id);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between gap-3">
          <a
            href={routePaths.home}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-text"
          >
            <Icon name="chevron" size={12} className="rotate-180" />
            Chapitres
          </a>
          <div className="flex items-center gap-3 text-[11.5px] text-muted">
            <span className="font-mono text-[11px] lg:hidden">Chapitre {chapter.number}</span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="book" size={12} />
              {estimatedLessonMinutes(chapter.lesson)} min de lecture
            </span>
          </div>
        </div>

        <div className="mt-7 grid gap-10 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3.5 w-[2px] rounded-full"
                style={{ background: color }}
              />
              <span className="mono-meta">Chapitre {chapter.number}</span>
            </div>
            <h1 className="display mt-2 text-[26px] leading-[1.15] text-text">{chapter.title}</h1>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{chapter.tagline}</p>

            <ol className="mt-6 space-y-px">
              {chapter.lesson.slides.map((item, position) => (
                <li key={`${item.kind}-${position}`}>
                  <button
                    type="button"
                    onClick={() => setIndex(position)}
                    aria-current={position === index ? 'step' : undefined}
                    aria-label={`Diapositive ${position + 1} sur ${total}`}
                    className={cn(
                      'flex w-full items-baseline gap-2.5 rounded-md px-1.5 py-1.5 text-left text-[12px] transition-colors',
                      position === index
                        ? 'bg-panel-2 text-text'
                        : 'text-muted hover:bg-panel-2/60 hover:text-text',
                    )}
                  >
                    <span className="font-mono text-[10px] tabular-nums text-muted">
                      {String(position + 1).padStart(2, '0')}
                    </span>
                    {KIND_LABEL[item.kind]}
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          <div className="flex min-h-[calc(100dvh-12rem)] flex-col">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border">
                <div
                  className="h-px bg-accent transition-[width] duration-300"
                  style={{ width: `${((index + 1) / total) * 100}%` }}
                />
              </div>
              <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted">
                {index + 1} / {total}
              </span>
            </div>

            <div className="mt-7 flex-1">
              <AnimatedSlide key={`${chapter.id}-${index}`}>
                {slide ? <SlideView slide={slide} /> : null}
              </AnimatedSlide>
            </div>

            <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-4">
              <button
                type="button"
                className="btn"
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                disabled={index === 0}
              >
                Précédent
              </button>

              {isLast ? (
                missionUnlocked && firstMission ? (
                  <a
                    href={routePaths.mission(firstMission.id)}
                    className="btn btn-accent h-9 px-3.5 text-[13px]"
                  >
                    Passer aux missions
                    <Icon name="arrow-right" size={15} />
                  </a>
                ) : (
                  <span className="max-w-[34ch] text-right text-[11.5px] leading-relaxed text-muted">
                    Termine les missions précédentes pour déverrouiller celles de ce chapitre.
                  </span>
                )
              ) : (
                <button
                  type="button"
                  className="btn btn-accent h-9 px-3.5 text-[13px]"
                  onClick={() => setIndex((current) => Math.min(total - 1, current + 1))}
                >
                  Suivant
                  <Icon name="arrow-right" size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
