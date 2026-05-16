import { useEffect, useRef, useState, type ReactNode } from "react";

// A tiny pinch-zoom + drag-to-pan container. We can't enable native page
// zoom (it's disabled globally to keep the iOS keyboard from shifting
// the document) so we handle two-finger gestures ourselves and apply a
// CSS transform to the inner element.

type Props = {
  children: ReactNode;
  minScale?: number;
  maxScale?: number;
};

export function ZoomableArea({ children, minScale = 1, maxScale = 4 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  // gesture state
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const lastTap = useRef<number>(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const dist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStart.current = { dist: dist(e.touches[0], e.touches[1]), scale };
        panStart.current = null;
        e.preventDefault();
      } else if (e.touches.length === 1 && scale > 1) {
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx, ty };
      } else if (e.touches.length === 1) {
        // detect double-tap
        const now = Date.now();
        if (now - lastTap.current < 280) {
          // toggle zoom: 1 ↔ 2
          if (scale > 1) {
            setScale(1);
            setTx(0);
            setTy(0);
          } else {
            setScale(2);
          }
          e.preventDefault();
        }
        lastTap.current = now;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStart.current) {
        const d = dist(e.touches[0], e.touches[1]);
        const ratio = d / pinchStart.current.dist;
        const next = Math.min(maxScale, Math.max(minScale, pinchStart.current.scale * ratio));
        setScale(next);
        if (next === 1) {
          setTx(0);
          setTy(0);
        }
        e.preventDefault();
      } else if (e.touches.length === 1 && panStart.current && scale > 1) {
        const dx = e.touches[0].clientX - panStart.current.x;
        const dy = e.touches[0].clientY - panStart.current.y;
        setTx(panStart.current.tx + dx);
        setTy(panStart.current.ty + dy);
        e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      pinchStart.current = null;
      panStart.current = null;
    };

    wrap.addEventListener("touchstart", onTouchStart, { passive: false });
    wrap.addEventListener("touchmove", onTouchMove, { passive: false });
    wrap.addEventListener("touchend", onTouchEnd);
    wrap.addEventListener("touchcancel", onTouchEnd);

    return () => {
      wrap.removeEventListener("touchstart", onTouchStart);
      wrap.removeEventListener("touchmove", onTouchMove);
      wrap.removeEventListener("touchend", onTouchEnd);
      wrap.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [scale, tx, ty, minScale, maxScale]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <div
        ref={innerRef}
        style={{
          transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
          transformOrigin: "center top",
          transition: pinchStart.current || panStart.current ? "none" : "transform 0.15s ease-out",
          willChange: "transform",
        }}
      >
        {children}
      </div>
      {scale > 1 && (
        <button
          type="button"
          onClick={() => {
            setScale(1);
            setTx(0);
            setTy(0);
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 5,
            background: "rgba(10,10,12,0.85)",
            color: "var(--color-violet)",
            border: "1px solid var(--color-violet-dim)",
            borderRadius: 4,
            padding: "4px 8px",
            fontSize: 10,
            fontFamily: "inherit",
          }}
        >
          reset zoom · {scale.toFixed(1)}x
        </button>
      )}
    </div>
  );
}
