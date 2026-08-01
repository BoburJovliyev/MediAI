import { useCallback, useEffect, useRef, useState } from "react";
import { useCompanionStore } from "@/stores/useCompanionStore";

/* ------------------------------------------------------------------ */
/*  Drag the global companion anywhere on screen (mouse + touch)       */
/*  Position is persisted through the companion store (localStorage)   */
/* ------------------------------------------------------------------ */

const WIDTH = 260;
const HEIGHT = 340;

function clampToViewport(x: number, y: number) {
  const maxX = Math.max(8, window.innerWidth - WIDTH - 8);
  const maxY = Math.max(8, window.innerHeight - HEIGHT - 8);
  return {
    x: Math.min(Math.max(x, 8), maxX),
    y: Math.min(Math.max(y, 8), maxY),
  };
}

export function useCompanionDrag() {
  const { position, setPosition } = useCompanionStore();
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  /* keep companion inside viewport on resize */
  useEffect(() => {
    const onResize = () => setPosition(clampToViewport(position.x, position.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [position.x, position.y, setPosition]);

  const start = useCallback(
    (clientX: number, clientY: number) => {
      offset.current = { x: clientX - position.x, y: clientY - position.y };
      moved.current = false;
      setIsDragging(true);
    },
    [position.x, position.y],
  );

  useEffect(() => {
    if (!isDragging) return;

    const move = (clientX: number, clientY: number) => {
      moved.current = true;
      setPosition(
        clampToViewport(clientX - offset.current.x, clientY - offset.current.y),
      );
    };

    const onMouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) move(t.clientX, t.clientY);
    };
    const onUp = () => setIsDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging, setPosition]);

  const dragHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      start(e.clientX, e.clientY);
    },
  };

  return { position, isDragging, dragHandlers, didMove: moved };
}

export default useCompanionDrag;
