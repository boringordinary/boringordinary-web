import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useRef, useCallback } from "react";

const TARGET = "Boring+Ordinary";
const CHAR_POOL = ["+", "-", "•", "~", "!", "=", "*", "#"];
const DURATION_MS = 800;
const FRAME_SKIP_THRESHOLD = 16;

function useScrambleTitle() {
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const bufferRef = useRef<string[]>(new Array(TARGET.length));
  const targetArray = Array.from(TARGET);

  const precomputeRandomIndices = useCallback((length: number) => {
    const indices = new Array(length);
    for (let i = 0; i < length; i++) {
      indices[i] = Math.floor(Math.random() * CHAR_POOL.length);
    }
    return indices;
  }, []);

  useEffect(() => {
    startTimeRef.current = performance.now();
    lastFrameTimeRef.current = 0;
    const randomIndices = precomputeRandomIndices(targetArray.length * 20);
    let randomCounter = 0;

    const animate = (currentTime: number) => {
      if (currentTime - lastFrameTimeRef.current < FRAME_SKIP_THRESHOLD) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTimeRef.current = currentTime;

      const startTime = startTimeRef.current ?? currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);
      const revealedCount = Math.floor(progress * targetArray.length);
      const result = bufferRef.current;

      for (let i = 0; i < targetArray.length; i++) {
        if (targetArray[i] === " ") {
          result[i] = " ";
        } else if (i < revealedCount) {
          result[i] = targetArray[i];
        } else {
          result[i] = CHAR_POOL[randomIndices[randomCounter++ % randomIndices.length]];
        }
      }

      document.title = result.join("");

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        document.title = TARGET;
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [precomputeRandomIndices, targetArray]);
}

function RootComponent() {
  useScrambleTitle();
  return <Outlet />;
}

export const Route = createRootRoute({
  component: RootComponent,
});
