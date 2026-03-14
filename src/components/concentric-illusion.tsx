import { useEffect, useRef } from "react";

// ── Sacred geometry optical illusion ─────────────────────────────
// Hexagonal grid of morphing shapes organized in concentric rings.
// Counter-rotating adjacent rings + radial morph wave + breathing
// creates a Pinna-Brelstaff vortex illusion — peripheral shapes
// appear to spiral when you fixate on the center.

export function ConcentricIllusion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animationId: number;
    let resizeTimeout: number;

    // ── Config ──────────────────────────────────────────────────────
    const spacing = 72;
    const shapeR = 34;
    const morphSpeed = 0.06;
    const VERTS = 60;

    // Precompute trig tables
    const ang = new Float64Array(VERTS + 1);
    const cosT = new Float64Array(VERTS + 1);
    const sinT = new Float64Array(VERTS + 1);
    for (let i = 0; i <= VERTS; i++) {
      ang[i] = (i / VERTS) * Math.PI * 2;
      cosT[i] = Math.cos(ang[i]);
      sinT[i] = Math.sin(ang[i]);
    }

    // Morph keyframes: circle → flat-top hex → triangle → pointy-top hex
    const KF = [
      { n: 64, rot: 0 },
      { n: 6, rot: 0 },
      { n: 3, rot: Math.PI / 2 },
      { n: 6, rot: Math.PI / 6 },
    ];
    const KN = KF.length;

    // Precompute polygon radius at each vertex angle per keyframe
    const kfR: Float64Array[] = KF.map(({ n, rot }) => {
      const out = new Float64Array(VERTS + 1);
      if (n > 32) {
        out.fill(1);
      } else {
        const sec = (2 * Math.PI) / n;
        const half = sec / 2;
        const cosHalf = Math.cos(half);
        for (let i = 0; i <= VERTS; i++) {
          const a = (((ang[i] - rot) % sec) + sec) % sec;
          out[i] = cosHalf / Math.cos(a - half);
        }
      }
      return out;
    });

    // ── Grid state ──────────────────────────────────────────────────
    let cellX: Float64Array;
    let cellY: Float64Array;
    let cellDist: Float64Array; // distance from viewport center
    let cellRing: Int32Array; // concentric ring index
    let cellCount = 0;
    let edges: Uint32Array;
    let edgeCount = 0;

    function buildGrid(w: number, h: number) {
      const rowH = spacing * 0.866;
      const margin = spacing * 3;
      const nRows = Math.ceil((h + margin * 2) / rowH) + 1;
      const nCols = Math.ceil((w + margin * 2) / spacing) + 1;
      cellCount = nRows * nCols;

      cellX = new Float64Array(cellCount);
      cellY = new Float64Array(cellCount);
      cellDist = new Float64Array(cellCount);
      cellRing = new Int32Array(cellCount);

      const halfW = w * 0.5;
      const halfH = h * 0.5;
      const cellRow = new Int32Array(cellCount);
      const cellCol = new Int32Array(cellCount);
      const idx = new Map<number, number>();

      let i = 0;
      for (let r = 0; r < nRows; r++) {
        for (let c = 0; c < nCols; c++) {
          const x = -margin + c * spacing + (r & 1) * spacing * 0.5;
          const y = -margin + r * rowH;
          cellX[i] = x;
          cellY[i] = y;
          cellRow[i] = r;
          cellCol[i] = c;
          const dx = x - halfW;
          const dy = y - halfH;
          cellDist[i] = Math.sqrt(dx * dx + dy * dy);
          cellRing[i] = Math.round(cellDist[i] / spacing);
          idx.set(r * 10000 + c, i);
          i++;
        }
      }

      // Precompute edges
      const tmp: number[] = [];
      for (let j = 0; j < cellCount; j++) {
        const r = cellRow[j],
          c = cellCol[j],
          odd = r & 1;
        const right = idx.get(r * 10000 + c + 1);
        if (right !== undefined) tmp.push(j, right);
        const lr = idx.get((r + 1) * 10000 + (odd ? c + 1 : c));
        if (lr !== undefined) tmp.push(j, lr);
        const ll = idx.get((r + 1) * 10000 + (odd ? c : c - 1));
        if (ll !== undefined) tmp.push(j, ll);
      }
      edges = new Uint32Array(tmp);
      edgeCount = tmp.length >> 1;
    }

    // ── Resize ──────────────────────────────────────────────────────
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid(w, h);
    }

    // ── Draw ────────────────────────────────────────────────────────
    function draw(t: number) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const halfW = w * 0.5;
      const halfH = h * 0.5;
      const maxD = Math.sqrt(halfW * halfW + halfH * halfH);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const time = t * morphSpeed;

      ctx!.clearRect(0, 0, w, h);
      ctx!.fillStyle = "#000";
      ctx!.fillRect(0, 0, w, h);

      // ── Connection lines (batched) ──
      ctx!.lineWidth = 0.5;
      ctx!.strokeStyle = "rgba(255,255,255,0.035)";
      ctx!.beginPath();
      for (let e = 0; e < edgeCount; e++) {
        const a = edges[e << 1],
          b = edges[(e << 1) | 1];
        ctx!.moveTo(cellX[a], cellY[a]);
        ctx!.lineTo(cellX[b], cellY[b]);
      }
      ctx!.stroke();

      // Mouse-proximate connections
      if (mx > -999) {
        ctx!.strokeStyle = "rgba(255,255,255,0.1)";
        ctx!.beginPath();
        let any = false;
        for (let e = 0; e < edgeCount; e++) {
          const a = edges[e << 1],
            b = edges[(e << 1) | 1];
          const midX = (cellX[a] + cellX[b]) * 0.5;
          const midY = (cellY[a] + cellY[b]) * 0.5;
          const dx = midX - mx,
            dy = midY - my;
          if (dx * dx + dy * dy < 40000) {
            ctx!.moveTo(cellX[a], cellY[a]);
            ctx!.lineTo(cellX[b], cellY[b]);
            any = true;
          }
        }
        if (any) ctx!.stroke();
      }

      // ── Morphing shapes with optical illusion ──
      ctx!.lineWidth = 1;
      ctx!.strokeStyle = "#fff";

      for (let i = 0; i < cellCount; i++) {
        const x = cellX[i];
        const y = cellY[i];
        const dist = cellDist[i];
        const ring = cellRing[i];

        // Morph phase radiates outward from center
        const phase = time + dist * 0.003;
        const p = ((phase % 1) + 1) % 1;
        const scaled = p * KN;
        const ki = ~~scaled;
        const st = scaled - ki;
        const smooth = st * st * (3 - 2 * st);
        const r1 = kfR[ki % KN];
        const r2 = kfR[(ki + 1) % KN];

        // Counter-rotating rings (Pinna-Brelstaff illusion)
        // Even rings rotate CW, odd rings rotate CCW
        const ringRot = (ring & 1 ? 1 : -1) * t * 0.25;
        const cosRot = Math.cos(ringRot);
        const sinRot = Math.sin(ringRot);

        // Radial breathing: shapes pulse in/out from center
        const breathe = Math.sin(dist * 0.02 - t * 1.2) * 3.5;
        const invDist = dist > 1 ? 1 / dist : 0;
        const drawX = x + (x - halfW) * invDist * breathe;
        const drawY = y + (y - halfH) * invDist * breathe;

        // Opacity: center-bright + alternating ring brightness
        const centerFade = 0.08 + 0.18 * (1 - Math.min(dist / maxD, 1));
        const ringBright = 0.65 + 0.35 * Math.sin(ring * 1.2 + t * 0.4);
        const mdx = drawX - mx,
          mdy = drawY - my;
        const mDsq = mdx * mdx + mdy * mdy;
        const mBoost = mDsq < 32400 ? (1 - Math.sqrt(mDsq) / 180) * 0.25 : 0;
        const alpha = Math.min(0.4, centerFade * ringBright + mBoost);

        if (alpha < 0.015) continue;

        ctx!.globalAlpha = alpha;
        ctx!.beginPath();
        for (let v = 0; v <= VERTS; v++) {
          const r = (r1[v] + (r2[v] - r1[v]) * smooth) * shapeR;
          // Rotate vertex using precomputed trig tables + rotation matrix
          const px = drawX + r * (cosT[v] * cosRot - sinT[v] * sinRot);
          const py = drawY + r * (sinT[v] * cosRot + cosT[v] * sinRot);
          v === 0 ? ctx!.moveTo(px, py) : ctx!.lineTo(px, py);
        }
        ctx!.stroke();
      }

      ctx!.globalAlpha = 1;
    }

    // ── Animation loop ──────────────────────────────────────────────
    resize();

    if (prefersReducedMotion) {
      draw(5);
    } else {
      (function loop() {
        draw(performance.now() * 0.001);
        animationId = requestAnimationFrame(loop);
      })();
    }

    function onResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        resize();
        if (prefersReducedMotion) draw(5);
      }, 100);
    }

    function onMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    function onLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <div className="h-dvh w-full overflow-hidden bg-black relative">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <span
          className="text-7xl tracking-tight text-white select-none"
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            WebkitTextStroke: "1.5px black",
            paintOrder: "stroke fill",
          }}
        >
          B+O
        </span>
      </div>
    </div>
  );
}
