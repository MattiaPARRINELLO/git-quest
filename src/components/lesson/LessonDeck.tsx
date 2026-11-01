import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatedSlide, DemoSlideView } from './MiniDemo';
import { Diagram } from './diagrams';
import { Icon } from '../ui/Icon';
import type { Lesson, LessonSlide } from '../../content/types';
import { estimatedLessonMinutes } from '../../content';
import { useProgressStore } from '../../store/useProgressStore';
import { cn } from '../../lib/cn';

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
          <h2 className="display text-[clamp(1.9rem,3vw,2.6rem)] leading-[1.1] text-text">
            {slide.title}
          </h2>
          <div className="mt-5 max-w-[62ch] space-y-4">
            {slide.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-[18px] leading-[1.65] text-text">
                {paragraph}
              </p>
            ))}
          </div>
          {slide.command && (
            <pre className="mt-6 max-w-[62ch] overflow-x-auto bg-panel-2 px-4 py-3 text-[14px] leading-7 text-text">
              <code>
                <span className="select-none text-muted">$ </span>
                {slide.command}
              </code>
            </pre>
          )}
          {slide.note && (
            <p className="mt-5 max-w-[62ch] bg-warning/10 px-4 py-3 text-[15px] leading-6 text-text">
              <span className="text-warning">À noter · </span>
              {slide.note}
            </p>
          )}
        </div>
      );
    case 'diagram':
      return (
        <div>
          <h2 className="display text-[clamp(1.9rem,3vw,2.6rem)] leading-[1.1] text-text">
            {slide.title}
          </h2>
          <div className="mt-5 bg-panel">
            <div className="p-5">
              <Diagram id={slide.diagram} />
            </div>
            {slide.caption && (
              <p className="px-5 py-3 text-[14px] text-muted">{slide.caption}</p>
            )}
          </div>
        </div>
      );
    case 'demo':
      return <DemoSlideView slide={slide} />;
    case 'recap':
      return (
        <div>
          <h2 className="display text-[clamp(1.9rem,3vw,2.6rem)] leading-[1.1] text-text">
            {slide.title}
          </h2>
          <ul className="mt-5 max-w-[62ch] space-y-4">
            {slide.commands.map((item) => (
              <li key={item.command}>
                <code className="block bg-panel-2 px-3 py-2 text-[14px] leading-6 text-text">
                  {item.command}
                </code>
                <span className="mt-1.5 block text-[15px] leading-6 text-muted">
                  {item.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
  }
}

export interface LessonDeckProps {
  readonly lesson: Lesson;
  /** Clé de reprise dans useProgressStore (`chapter.id` ou identifiant de prologue). */
  readonly storageId: string;
  /** Étiquette affichée en haut à droite, ex. « Chapitre 1 » ou « Prologue ». */
  readonly badge: string;
  readonly backHref: string;
  readonly backLabel: string;
  /** Contenu affiché à la place de « Suivant » sur la dernière slide. */
  readonly lastAction?: ReactNode;
}

/** Lecteur de slides partagé par les cours de chapitre et le prologue. */
export function LessonDeck({
  lesson,
  storageId,
  badge,
  backHref,
  backLabel,
  lastAction,
}: LessonDeckProps) {
  const setLessonSlide = useProgressStore((store) => store.setLessonSlide);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const saved = useProgressStore.getState().lessonSlides[storageId] ?? 0;
    setIndex(clampIndex(saved, lesson.slides.length));
  }, [lesson, storageId]);

  useEffect(() => {
    setLessonSlide(storageId, index);
  }, [index, setLessonSlide, storageId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const total = lesson.slides.length;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        setIndex((current) => Math.min(total - 1, current + 1));
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        setIndex((current) => Math.max(0, current - 1));
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        setIndex(0);
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        setIndex(total - 1);
        return;
      }
      // Entrée valide le slide quand le focus n'est pas sur un contrôle.
      if (event.key === 'Enter' || event.key === ' ') {
        const focused = event.target instanceof Element ? event.target : null;
        if (
          focused !== null &&
          focused.closest('a[href], button, input, select, textarea, summary') !== null
        ) {
          return;
        }
        event.preventDefault();
        setIndex((current) => Math.min(total - 1, current + 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lesson]);

  const slide = lesson.slides[index];
  const total = lesson.slides.length;
  const isLast = index >= total - 1;

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-[1180px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href={backHref}
            className="inline-flex items-center gap-2 text-[14px] text-muted transition-colors hover:text-text"
          >
            <Icon name="chevron" size={13} className="rotate-180" />
            {backLabel}
          </a>
          <div className="flex items-center gap-5 text-[13.5px] text-muted">
            <span className="text-text">{badge}</span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="book" size={13} />
              {estimatedLessonMinutes(lesson)} min de lecture
            </span>
          </div>
        </div>

        <h1 className="display mt-6 text-[28px] leading-[1.1] text-text sm:text-[32px]">{lesson.title}</h1>

        <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <p className="text-[13px] text-muted">Sommaire</p>

            <ol className="mt-3 space-y-1">
              {lesson.slides.map((item, position) => (
                <li key={`${item.kind}-${position}`}>
                  <button
                    type="button"
                    onClick={() => setIndex(position)}
                    aria-current={position === index ? 'step' : undefined}
                    aria-label={`Diapositive ${position + 1} sur ${total}`}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-[13.5px] transition-colors',
                      position === index
                        ? 'bg-text text-bg'
                        : 'text-muted hover:bg-panel-2 hover:text-text',
                    )}
                  >
                    <span className="tabular-nums opacity-70">{position + 1}</span>
                    {KIND_LABEL[item.kind]}
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          <div className="flex min-h-[calc(100dvh-12rem)] flex-col">
            <div className="flex items-center gap-4">
              <div className="h-1 flex-1 bg-panel-3">
                <div
                  className="h-1 bg-accent transition-[width] duration-300"
                  style={{ width: `${((index + 1) / total) * 100}%` }}
                />
              </div>
              <span className="shrink-0 text-[13px] tabular-nums text-muted">
                {index + 1} sur {total}
              </span>
            </div>

            <div className="mt-8 flex-1">
              <AnimatedSlide key={`${lesson.id}-${index}`}>
                {slide ? <SlideView slide={slide} /> : null}
              </AnimatedSlide>
            </div>

            <div className="mt-10 flex items-center justify-between gap-3">
              <button
                type="button"
                className="btn btn-quiet h-11 px-4"
                onClick={() => setIndex((current) => Math.max(0, current - 1))}
                disabled={index === 0}
              >
                Précédent
              </button>

              {isLast ? (
                (lastAction ?? null)
              ) : (
                <button
                  type="button"
                  className="btn btn-accent h-11 px-5 text-[14px]"
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
