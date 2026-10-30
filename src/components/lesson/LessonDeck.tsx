import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatedSlide, DemoSlideView } from './MiniDemo';
import { Diagram } from './diagrams';
import { Icon } from '../ui/Icon';
import type { Lesson, LessonSlide } from '../../content/types';
import { estimatedLessonMinutes } from '../../content';
import { useProgressStore } from '../../store/useProgressStore';

function clampIndex(index: number, total: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(0, Math.trunc(index)), Math.max(0, total - 1));
}

function SlideView({ slide }: { readonly slide: LessonSlide }) {
  switch (slide.kind) {
    case 'text':
      return (
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">{slide.title}</h2>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
            {slide.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {slide.command && (
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-[#08090d] px-3 py-2.5 font-mono text-xs text-accent-2">
              <span className="text-muted">$ </span>
              {slide.command}
            </pre>
          )}
          {slide.note && (
            <p className="mt-3 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning">
              {slide.note}
            </p>
          )}
        </div>
      );
    case 'diagram':
      return (
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">{slide.title}</h2>
          <div className="mt-3 rounded-2xl border border-border bg-panel-2/40 p-3">
            <Diagram id={slide.diagram} />
          </div>
          {slide.caption && <p className="mt-2 text-center text-xs text-muted">{slide.caption}</p>}
        </div>
      );
    case 'demo':
      return <DemoSlideView slide={slide} />;
    case 'recap':
      return (
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">{slide.title}</h2>
          <ul className="mt-4 space-y-2">
            {slide.commands.map((item) => (
              <li
                key={item.command}
                className="flex flex-col gap-1 rounded-xl border border-border bg-panel-2/50 px-3 py-2 sm:flex-row sm:items-baseline sm:gap-3"
              >
                <code className="shrink-0 font-mono text-xs text-accent-2">{item.command}</code>
                <span className="text-xs leading-relaxed text-muted">{item.description}</span>
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
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-5 sm:px-6 sm:py-7">
        <div className="flex items-center justify-between gap-3">
          <a href={backHref} className="inline-flex items-center gap-1 text-xs text-muted hover:text-text">
            <Icon name="chevron" size={13} className="rotate-180" />
            {backLabel}
          </a>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span className="rounded-full border border-border bg-panel-2 px-2 py-0.5 font-mono">
              {badge}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="book" size={12} />
              {estimatedLessonMinutes(lesson)} min
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-3">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[10px] text-muted">
            {index + 1}/{total}
          </span>
        </div>

        <div className="mt-6 flex-1">
          <AnimatedSlide key={`${lesson.id}-${index}`}>
            {slide ? <SlideView slide={slide} /> : null}
          </AnimatedSlide>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            className="btn"
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
              className="btn btn-accent px-3 py-2 text-sm"
              onClick={() => setIndex((current) => Math.min(total - 1, current + 1))}
            >
              Suivant
              <Icon name="arrow-right" size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
