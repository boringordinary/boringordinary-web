import { useRef, useMemo, useEffect } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";

type SegmentDef = {
  text: string;
  type?: "normal" | "rainbow" | "quote" | "slide" | "underline";
};
type ParagraphDef = { segments: SegmentDef[]; quote?: boolean | "cite" };

const paragraphs: ParagraphDef[] = [
  {
    segments: [
      {
        text: "Since 2019, we\u2019ve been running digital platforms that serve millions, solving problems in ways that should be ordinary but the rest of the industry won\u2019t touch.",
      },
    ],
  },
  {
    segments: [
      {
        text: "We invest in game-changing medtech, consumer products, and the industries where it matters most: beauty, body, and mind. The problems that ",
      },
      { text: "define everyday life", type: "underline" },
      { text: "." },
    ],
  },
  {
    segments: [
      { text: "We are misfits" },
      {
        text: "\u2014engineers, designers, artists, and communicators\u2014",
        type: "slide",
      },
      {
        text: "the kind that don\u2019t fit neatly anywhere, so we built our own place. Our approach is boring in the ways it matters. Sustainable products in service of humanity, and ultimately, ",
      },
      { text: "God\u2019s Kingdom", type: "rainbow" },
      { text: "." },
    ],
  },
  {
    segments: [
      {
        text: "\u201CBe wise as serpents and innocent as doves.\u201D",
        type: "quote",
      },
    ],
    quote: true,
  },
  {
    segments: [{ text: "Matthew 10:16", type: "quote" }],
    quote: "cite" as const,
  },
];

export function Manifesto() {
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const kingdomRef = useRef<HTMLSpanElement>(null);
  const slideWordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const underlinePathRef = useRef<SVGPathElement>(null);
  const underlinePathLen = useRef(0);
  const prefersReducedMotion = useRef(false);

  const layoutData = useMemo(() => {
    let globalIndex = 0;
    let refIndex = 0;
    const meta: { globalIndex: number; type: "normal" | "quote" }[] = [];
    let kingdomRange: { start: number; end: number } | null = null;
    let slideRange: { start: number; end: number } | null = null;
    let underlineRange: { start: number; end: number } | null = null;

    type CharInfo = { char: string; refIdx: number };
    type SegInfo =
      | { type: "rainbow"; text: string }
      | { type: "slide"; words: string[] }
      | {
          type: "normal" | "quote" | "underline";
          chars: CharInfo[];
        };

    const paras: { quote?: boolean | "cite"; segs: SegInfo[] }[] = [];

    for (const { segments, quote } of paragraphs) {
      const segs: SegInfo[] = [];
      for (const { text, type } of segments) {
        const t = type || "normal";
        const chars = [...text];
        const startGlobal = globalIndex;
        globalIndex += chars.length;

        if (t === "rainbow") {
          kingdomRange = {
            start: startGlobal,
            end: startGlobal + chars.length,
          };
          segs.push({ type: "rainbow", text });
        } else if (t === "slide") {
          slideRange = {
            start: startGlobal,
            end: startGlobal + chars.length,
          };
          const words = text.split(" ").filter((w) => w.length > 0);
          segs.push({ type: "slide", words });
        } else {
          if (t === "underline") {
            underlineRange = {
              start: startGlobal,
              end: startGlobal + chars.length,
            };
          }
          const charInfos: CharInfo[] = chars.map((char, i) => {
            const ri = refIndex++;
            meta.push({
              globalIndex: startGlobal + i,
              type: t === "underline" ? "normal" : (t as "normal" | "quote"),
            });
            return { char, refIdx: ri };
          });
          segs.push({
            type: t as "normal" | "quote" | "underline",
            chars: charInfos,
          });
        }
      }
      paras.push({ quote, segs });
    }

    return {
      paras,
      totalChars: globalIndex,
      charMeta: meta,
      kingdomRange,
      slideRange,
      underlineRange,
    };
  }, []);

  const { totalChars, charMeta, kingdomRange, slideRange, underlineRange } =
    layoutData;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.5", "end end"],
  });

  useEffect(() => {
    if (underlinePathRef.current) {
      underlinePathLen.current =
        underlinePathRef.current.getTotalLength();
      underlinePathRef.current.style.strokeDasharray = String(
        underlinePathLen.current,
      );
      underlinePathRef.current.style.strokeDashoffset = String(
        underlinePathLen.current,
      );
    }

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mq.matches;

    const apply = () => {
      charRefs.current.forEach((el) => {
        if (el) {
          el.style.opacity = "1";
          el.style.filter = "none";
          el.style.transform = "none";
        }
      });
      if (kingdomRef.current) {
        kingdomRef.current.style.opacity = "1";
        kingdomRef.current.style.filter = "none";
        kingdomRef.current.style.transform = "none";
      }
      slideWordRefs.current.forEach((el) => {
        if (el) {
          el.style.transform = "none";
          el.style.clipPath = "none";
        }
      });
      if (underlinePathRef.current) {
        underlinePathRef.current.style.strokeDashoffset = "0";
      }
    };

    if (mq.matches) apply();

    const onChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
      if (e.matches) apply();
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (prefersReducedMotion.current) return;

    const windowSize = 0.12;
    const refs = charRefs.current;
    const meta = charMeta;

    // Animate individual chars (normal + quote + underline)
    for (let i = 0; i < meta.length; i++) {
      const el = refs[i];
      if (!el) continue;

      const { globalIndex: gi, type } = meta[i];
      const charStart = (gi / totalChars) * (1 - windowSize);
      const charEnd = charStart + windowSize;

      if (progress <= charStart) {
        if (el.dataset.s !== "h") {
          el.style.opacity = "0";
          if (type === "quote") {
            el.style.filter = "none";
            el.style.transform = "translateY(14px)";
          } else {
            el.style.filter = "blur(8px)";
            el.style.transform = "none";
          }
          el.dataset.s = "h";
        }
      } else if (progress >= charEnd) {
        if (el.dataset.s !== "v") {
          el.style.opacity = "1";
          el.style.filter = "none";
          el.style.transform = "none";
          el.dataset.s = "v";
        }
      } else {
        const t = (progress - charStart) / (charEnd - charStart);
        el.style.opacity = String(t);
        if (type === "quote") {
          el.style.filter = "none";
          el.style.transform = `translateY(${((1 - t) * 14).toFixed(1)}px)`;
        } else {
          el.style.filter = `blur(${((1 - t) * 8).toFixed(1)}px)`;
          el.style.transform = "none";
        }
        el.dataset.s = "t";
      }
    }

    // Animate kingdom phrase as a single unit
    if (kingdomRange && kingdomRef.current) {
      const el = kingdomRef.current;
      const kStart = (kingdomRange.start / totalChars) * (1 - windowSize);
      const kEnd =
        ((kingdomRange.end - 1) / totalChars) * (1 - windowSize) + windowSize;

      if (progress <= kStart) {
        if (el.dataset.s !== "h") {
          el.style.opacity = "0";
          el.style.filter = "blur(12px)";
          el.style.transform = "translateY(16px) scale(0.92)";
          el.dataset.s = "h";
        }
      } else if (progress >= kEnd) {
        if (el.dataset.s !== "v") {
          el.style.opacity = "1";
          el.style.filter = "none";
          el.style.transform = "none";
          el.dataset.s = "v";
        }
      } else {
        const t = (progress - kStart) / (kEnd - kStart);
        const ease = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        el.style.opacity = String(ease);
        el.style.filter = `blur(${((1 - ease) * 12).toFixed(1)}px)`;
        const scale = 0.92 + ease * 0.08;
        el.style.transform = `translateY(${((1 - ease) * 16).toFixed(1)}px) scale(${scale.toFixed(3)})`;
        el.dataset.s = "t";
      }
    }

    // Animate slide words (staggered clip-path reveal + translateX)
    if (slideRange) {
      const words = slideWordRefs.current;
      const wordCount = words.filter(Boolean).length;
      if (wordCount > 0) {
        const sStart = (slideRange.start / totalChars) * (1 - windowSize);
        const sEnd =
          ((slideRange.end - 1) / totalChars) * (1 - windowSize) + windowSize;
        const totalDur = sEnd - sStart;
        const wordDur = totalDur * 0.4;
        const staggerSpan = totalDur - wordDur;
        const stagger = staggerSpan / (wordCount - 1 || 1);

        for (let i = 0; i < wordCount; i++) {
          const el = words[i];
          if (!el) continue;
          const wStart = sStart + i * stagger;
          const wEnd = wStart + wordDur;

          if (progress <= wStart) {
            if (el.dataset.s !== "h") {
              el.style.clipPath = "inset(0 100% 0 0)";
              el.style.transform = "translateX(-0.5em)";
              el.dataset.s = "h";
            }
          } else if (progress >= wEnd) {
            if (el.dataset.s !== "v") {
              el.style.clipPath = "none";
              el.style.transform = "none";
              el.dataset.s = "v";
            }
          } else {
            const t = (progress - wStart) / (wEnd - wStart);
            const ease = 1 - (1 - t) * (1 - t) * (1 - t); // ease-out cubic
            el.style.clipPath = `inset(0 ${((1 - ease) * 100).toFixed(1)}% 0 0)`;
            el.style.transform = `translateX(${((1 - ease) * -0.5).toFixed(3)}em)`;
            el.dataset.s = "t";
          }
        }
      }
    }

    // Animate doodle underline (stroke draw-in)
    if (
      underlineRange &&
      underlinePathRef.current &&
      underlinePathLen.current
    ) {
      const pathEl = underlinePathRef.current;
      const uStart =
        (underlineRange.start / totalChars) * (1 - windowSize) +
        windowSize * 0.5;
      const uEnd =
        ((underlineRange.end - 1) / totalChars) * (1 - windowSize) +
        windowSize +
        0.05;

      if (progress <= uStart) {
        if (pathEl.dataset.s !== "h") {
          pathEl.style.strokeDashoffset = String(underlinePathLen.current);
          pathEl.dataset.s = "h";
        }
      } else if (progress >= uEnd) {
        if (pathEl.dataset.s !== "v") {
          pathEl.style.strokeDashoffset = "0";
          pathEl.dataset.s = "v";
        }
      } else {
        const t = (progress - uStart) / (uEnd - uStart);
        const eased = 1 - (1 - t) * (1 - t); // ease-out quad
        pathEl.style.strokeDashoffset = String(
          underlinePathLen.current * (1 - eased),
        );
        pathEl.dataset.s = "t";
      }
    }
  });

  return (
    <section
      ref={containerRef}
      className="bg-white px-6 pb-32 md:px-12 md:pb-48"
    >
      <div className="mx-auto max-w-4xl">
        {layoutData.paras.map((para, pIndex) => (
          <p
            key={pIndex}
            className={
              para.quote === "cite"
                ? "font-serif text-sm md:text-base tracking-wide uppercase text-black/30 mt-4 pl-6 md:pl-8 border-l-2 border-black/10"
                : para.quote
                  ? "font-serif text-xl leading-relaxed md:text-2xl md:leading-relaxed lg:text-3xl lg:leading-relaxed text-black/40 italic mt-8 md:mt-16 border-l-2 border-black/10 pl-6 md:pl-8"
                  : "font-serif text-3xl leading-snug md:text-5xl md:leading-snug lg:text-6xl lg:leading-tight text-black mb-16 md:mb-24 last:mb-0"
            }
          >
            {para.segs.map((seg, sIndex) =>
              seg.type === "rainbow" ? (
                <span
                  key={sIndex}
                  ref={kingdomRef}
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #0ea5e9, #8b5cf6, #ec4899, #ef4444, #f97316, #eab308, #22c55e, #0ea5e9, #8b5cf6, #ec4899, #ef4444)",
                    backgroundSize: "200% 100%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    animation: "gradient-flow 4s linear infinite",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    opacity: 0,
                    filter: "blur(12px)",
                    transform: "translateY(16px) scale(0.92)",
                  }}
                >
                  {seg.text}
                </span>
              ) : seg.type === "slide" ? (
                seg.words.map((word, wIndex) => (
                  <span key={`${sIndex}-${wIndex}`}>
                    <span
                      ref={(el) => {
                        slideWordRefs.current[wIndex] = el;
                      }}
                      style={{
                        display: "inline-block",
                        clipPath: "inset(0 100% 0 0)",
                        transform: "translateX(-0.5em)",
                      }}
                    >
                      {word}
                    </span>
                    {wIndex < seg.words.length - 1 ? " " : null}
                  </span>
                ))
              ) : seg.type === "underline" ? (
                <span key={sIndex} style={{ position: "relative" }}>
                  {seg.chars.map(({ char, refIdx }) => (
                    <span
                      key={refIdx}
                      ref={(el) => {
                        charRefs.current[refIdx] = el;
                      }}
                      style={{ opacity: 0, filter: "blur(8px)" }}
                    >
                      {char}
                    </span>
                  ))}
                  <svg
                    style={{
                      position: "absolute",
                      bottom: "-0.1em",
                      left: "-1%",
                      width: "102%",
                      height: "0.25em",
                      overflow: "visible",
                    }}
                    viewBox="0 0 200 10"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      ref={underlinePathRef}
                      d="M2 6 C15 2, 30 9, 48 5 C65 1, 78 8, 98 4 C118 1, 135 9, 155 5 C172 2, 188 7, 198 4"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      opacity="0.5"
                    />
                  </svg>
                </span>
              ) : seg.type === "quote" ? (
                seg.chars.map(({ char, refIdx }) => (
                  <span
                    key={refIdx}
                    ref={(el) => {
                      charRefs.current[refIdx] = el;
                    }}
                    style={{
                      opacity: 0,
                      transform: "translateY(14px)",
                      display: "inline-block",
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))
              ) : (
                seg.chars.map(({ char, refIdx }) => (
                  <span
                    key={refIdx}
                    ref={(el) => {
                      charRefs.current[refIdx] = el;
                    }}
                    style={{ opacity: 0, filter: "blur(8px)" }}
                  >
                    {char}
                  </span>
                ))
              ),
            )}
          </p>
        ))}
      </div>
    </section>
  );
}
