import { useCallback, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

interface SplitPaneProps {
  readonly left: ReactNode;
  readonly right: ReactNode;
  readonly initialLeftPercent?: number;
}

export function SplitPane({ left, right, initialLeftPercent = 40 }: SplitPaneProps) {
  const [leftPercent, setLeftPercent] = useState(initialLeftPercent);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !containerRef.current) return;
    const bounds = containerRef.current.getBoundingClientRect();
    const percent = ((event.clientX - bounds.left) / bounds.width) * 100;
    setLeftPercent(Math.min(62, Math.max(28, percent)));
  }, []);

  const stopDragging = useCallback(() => {
    draggingRef.current = false;
  }, []);

  return (
    <div ref={containerRef} className="flex h-full min-h-0 w-full">
      <section
        className="flex min-h-0 min-w-0 flex-col"
        style={{ width: `${leftPercent}%` }}
        aria-label="Terminal"
      >
        {left}
      </section>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionner les panneaux"
        aria-valuenow={Math.round(leftPercent)}
        aria-valuemin={28}
        aria-valuemax={62}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setLeftPercent((value) => Math.max(28, value - 2));
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            setLeftPercent((value) => Math.min(62, value + 2));
          }
          if (event.key === 'Home') {
            event.preventDefault();
            setLeftPercent(28);
          }
          if (event.key === 'End') {
            event.preventDefault();
            setLeftPercent(62);
          }
        }}
        className="group relative z-10 w-2 shrink-0 cursor-col-resize bg-transparent"
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-accent group-focus-visible:bg-accent" />
      </div>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col" aria-label="Visualisation">
        {right}
      </section>
    </div>
  );
}
