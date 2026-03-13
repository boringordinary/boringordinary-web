import { useRef, useEffect, useState } from "react";

const BOX_COUNT = 20;
const ZOOM_DURATION = 8;
const MIN_SCALE = 0.05;
const MAX_SCALE = 1.1;
const SCALE_RANGE = MAX_SCALE - MIN_SCALE;

export function ConcentricIllusion() {
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced) return;

    let start: number | null = null;

    function animate(now: number) {
      if (start === null) start = now;
      const t = (now - start) / 1000;

      for (let i = 0; i < BOX_COUNT; i++) {
        const el = boxRefs.current[i];
        if (!el) continue;

        // Zoom: each box scales from MIN to MAX, staggered so box 0 starts largest
        const phase = (BOX_COUNT - 1 - i) / BOX_COUNT;
        const norm = (t / ZOOM_DURATION + phase) % 1;
        const zoomScale = MIN_SCALE + norm * SCALE_RANGE;

        // Wiggle: intensity scales with zoomScale (outer = more, inner = calm)
        const intensity = zoomScale / MAX_SCALE; // 0 at center, ~1 at edges
        const wDur = 3 + (i % 3) * 0.3;
        const wt = ((t + i * 0.15) * Math.PI * 2) / wDur;
        const rot = Math.sin(wt) * 3 * intensity;
        const tx = Math.cos(wt * 0.7) * 3 * intensity;
        const ty = Math.sin(wt * 0.7 + 1) * 3 * intensity;
        const ws = 1 + Math.sin(wt * 1.3) * 0.03 * intensity;

        const s = zoomScale * ws;
        el.style.transform = `scale(${s}) rotate(${rot}deg) translate(${tx}px,${ty}px)`;
        el.style.zIndex = String(Math.round((MAX_SCALE - zoomScale) * 1000));
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [reduced]);

  return (
    <div className="h-dvh w-full overflow-hidden bg-black relative">
      {Array.from({ length: BOX_COUNT }, (_, i) => (
        <div
          key={i}
          ref={(el) => {
            boxRefs.current[i] = el;
          }}
          className="absolute inset-0"
          style={{
            backgroundColor: i % 2 === 0 ? "#000" : "#fff",
            willChange: "transform",
          }}
        />
      ))}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 1100 }}
      >
        <div className="bg-black px-8 py-4">
          <span
            className="text-white text-7xl font-bold tracking-tight"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            B+O
          </span>
        </div>
      </div>
    </div>
  );
}
