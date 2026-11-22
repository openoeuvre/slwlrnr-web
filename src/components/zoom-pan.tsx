"use client";

/**
 * ZoomPan — drag-to-explore surface detail.
 *
 * Three things here are less obvious than they look:
 *
 * 1. The wheel listener is attached natively with `{ passive: false }`.
 *    React registers its own wheel handlers as passive, so calling
 *    preventDefault() inside an `onWheel` prop silently fails and the page
 *    scrolls underneath the zoom.
 *
 * 2. Child images are `pointer-events-none`. An <img> is natively draggable,
 *    and that native drag hijacks the pointer before pointermove ever fires —
 *    which looks like "the image gets selected but won't move".
 *
 * 3. Panning is clamped so the content can never be dragged off its own edges:
 *    at scale s the content overhangs the viewport by (s−1)/2 on each side,
 *    which is exactly the maximum offset.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

const MIN_SCALE = 1.6;
const MAX_SCALE = 6;
const START_SCALE = 2.6;

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export function ZoomPan({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(START_SCALE);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  // Mirrors for the native wheel listener, which closes over its own scope.
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  scaleRef.current = scale;
  offsetRef.current = offset;

  const clampOffset = useCallback((x: number, y: number, s: number) => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (!rect) return { x, y };
    const maxX = ((s - 1) * rect.width) / 2;
    const maxY = ((s - 1) * rect.height) / 2;
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }, []);

  // Native, non-passive — the only way preventDefault() takes effect.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const next = clamp(
        scaleRef.current * (1 - e.deltaY * 0.0015),
        MIN_SCALE,
        MAX_SCALE,
      );
      setScale(next);
      setOffset(clampOffset(offsetRef.current.x, offsetRef.current.y, next));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clampOffset]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setOffset(
      clampOffset(
        drag.current.ox + (e.clientX - drag.current.x),
        drag.current.oy + (e.clientY - drag.current.y),
        scale,
      ),
    );
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    drag.current = null;
    setDragging(false);
  };

  const reset = () => {
    setScale(START_SCALE);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={boxRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={reset}
      // [&_img]:pointer-events-none disables the browser's native image drag,
      // which otherwise swallows the gesture entirely.
      className={`relative touch-none select-none overflow-hidden bg-wash [&_img]:pointer-events-none [&_img]:select-none ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
    >
      <div
        className="h-full w-full"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "center",
          transition: dragging ? "none" : "transform 120ms ease-out",
        }}
      >
        {children}
      </div>

      {/* Sits below the carousel arrows (z-10) so it never blocks them. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex items-end justify-between p-3">
        <span className="label bg-paper px-2 py-1 text-faint">
          Drag to explore · scroll to zoom
        </span>
        <button
          onClick={reset}
          onPointerDown={(e) => e.stopPropagation()}
          className="label pointer-events-auto border border-rule bg-paper px-2 py-1 text-muted hover:border-ink hover:text-ink"
        >
          Reset · {scale.toFixed(1)}×
        </button>
      </div>
    </div>
  );
}
