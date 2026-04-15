import { useRef, useMemo, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "motion/react";

type SegmentDef = {
  text: string;
  type?: "normal" | "rainbow" | "quote" | "slide" | "underline";
};
type ParagraphDef = { segments: SegmentDef[]; quote?: boolean | "cite" };

const WINDOW_SIZE = 0.12;

const paragraphs: ParagraphDef[] = [
  {
    segments: [
      {
        text: "Since 2019, we\u2019ve been running digital platforms that serve millions of users, solving problems in ways that should be ordinary but the rest of the industry won\u2019t touch.",
      },
    ],
  },
  {
    segments: [
      {
        text: "We invest in game-changing medtech, regtech, gaming, and consumer products, and the industries where it matters most: beauty, body, and mind. The problems that ",
      },
      { text: "define everyday life", type: "underline" },
      { text: "." },
    ],
  },
  {
    segments: [
      {
        text: "If you\u2019re building a project rooted in ",
      },
      { text: "fostering freedom, community, and innovation", type: "slide" },
      {
        text: " for people\u2014we fund seed stage projects that align with these values.",
      },
    ],
  },
  {
    segments: [
      { text: "We are misfits, " },
      {
        text: "engineers, designers, artists, and communicators\u2014",
        type: "slide",
      },
      {
        text: "the kind that don\u2019t fit neatly anywhere, so we built our own place. Our approach is boring in the ways that matter. Sustainable products in service of ",
      },
      { text: "your spirit", type: "rainbow" },
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
];

function SlideChar({
  char,
  progress,
  start,
  end,
}: {
  char: string;
  progress: MotionValue<number>;
  start: number;
  end: number;
}) {
  const shouldReduce = useReducedMotion();
  const opacity = useTransform(
    progress,
    [start, end],
    shouldReduce ? [1, 1] : [0, 1],
  );
  const x = useTransform(
    progress,
    [start, end],
    shouldReduce ? [0, 0] : [-6, 0],
  );

  return (
    <motion.span style={{ opacity, x, display: "inline-block" }}>
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
}

export function Manifesto() {
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const kingdomRef = useRef<HTMLSpanElement>(null);
  const underlinePathRef = useRef<SVGPathElement>(null);
  const underlinePathLen = useRef(0);
  const prefersReducedMotion = useRef(false);

  const layoutData = useMemo(() => {
    let globalIndex = 0;
    let refIndex = 0;
    const meta: { globalIndex: number; type: "normal" | "quote" }[] = [];
    let kingdomRange: { start: number; end: number } | null = null;
    let underlineRange: { start: number; end: number } | null = null;

    type CharInfo = { char: string; refIdx: number };
    type SlideCharInfo = { char: string; gi: number };
    type SlideWord = { chars: SlideCharInfo[] };
    type SegInfo =
      | { type: "rainbow"; text: string }
      | { type: "slide"; slideWords: SlideWord[] }
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
          const wordTexts = text.split(" ");
          const slideWords: SlideWord[] = [];
          let pos = startGlobal;
          for (const w of wordTexts) {
            slideWords.push({
              chars: [...w].map((char, i) => ({ char, gi: pos + i })),
            });
            pos += w.length + 1; // +1 for space
          }
          segs.push({ type: "slide", slideWords });
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
      underlineRange,
    };
  }, []);

  const { totalChars, charMeta, kingdomRange, underlineRange } = layoutData;

  const mousePos = useRef({ x: 50, y: 50 });
  const animFrame = useRef<number>(0);
  const currentPos = useRef({ x: 50, y: 50 });

  const updateGradientPosition = useCallback(() => {
    const el = kingdomRef.current;
    if (!el || prefersReducedMotion.current) return;

    currentPos.current.x += (mousePos.current.x - currentPos.current.x) * 0.08;
    currentPos.current.y += (mousePos.current.y - currentPos.current.y) * 0.08;

    el.style.backgroundPosition = `${currentPos.current.x.toFixed(1)}% ${currentPos.current.y.toFixed(1)}%`;

    animFrame.current = requestAnimationFrame(updateGradientPosition);
  }, []);

  useEffect(() => {
    const hasPointer = window.matchMedia("(hover: hover)").matches;

    if (hasPointer) {
      const onMouseMove = (e: MouseEvent) => {
        mousePos.current.x = (e.clientX / window.innerWidth) * 100;
        mousePos.current.y = (e.clientY / window.innerHeight) * 100;
      };

      window.addEventListener("mousemove", onMouseMove);
      animFrame.current = requestAnimationFrame(updateGradientPosition);

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        cancelAnimationFrame(animFrame.current);
      };
    } else {
      // Touch/no-hover devices: use CSS animation fallback
      if (kingdomRef.current) {
        kingdomRef.current.style.animation =
          "gradient-flow 12s ease-in-out infinite";
      }
    }
  }, [updateGradientPosition]);

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

    const windowSize = WINDOW_SIZE;
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
            el.style.transform = "translateY(14px)";
          }
          el.dataset.s = "h";
        }
      } else if (progress >= charEnd) {
        if (el.dataset.s !== "v") {
          el.style.opacity = "1";
          if (type === "quote") {
            el.style.transform = "none";
          }
          el.dataset.s = "v";
        }
      } else {
        const t = (progress - charStart) / (charEnd - charStart);
        el.style.opacity = String(t);
        if (type === "quote") {
          el.style.transform = `translateY(${((1 - t) * 14).toFixed(1)}px)`;
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
          el.style.transform = "scale(0.92)";
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
        el.style.transform = `scale(${scale.toFixed(3)})`;
        el.dataset.s = "t";
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
      id="about"
      className="bg-white px-6 pt-4 pb-24 md:px-12 md:pt-8 md:pb-36 scroll-mt-8"
    >
      <div className="mx-auto max-w-4xl">
        {layoutData.paras.map((para, pIndex) => (
          <p
            key={pIndex}
            className={
              para.quote === "cite"
                ? "font-serif text-sm md:text-base tracking-wide uppercase text-black/30 mt-4 pl-6 md:pl-8 border-l-2 border-black/10"
                : para.quote
                  ? "font-serif text-xl leading-relaxed md:text-2xl md:leading-relaxed lg:text-3xl lg:leading-relaxed text-black/35 italic mt-10 md:mt-20 border-l-2 border-black/8 pl-6 md:pl-8"
                  : "font-serif text-3xl leading-snug md:text-4xl md:leading-snug lg:text-6xl lg:leading-tight text-black mb-14 md:mb-28 last:mb-0"
            }
          >
            {para.segs.map((seg, sIndex) =>
              seg.type === "rainbow" ? (
                <span
                  key={sIndex}
                  ref={kingdomRef}
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #06b6d4, #22d3ee, #0ea5e9, #8b5cf6, #a78bfa, #06b6d4)",
                    backgroundSize: "300% 300%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundPosition: "50% 50%",
                    whiteSpace: "nowrap",
                    display: "inline-block",
                    opacity: 0,
                    filter: "blur(12px)",
                    transform: "scale(0.92)",
                  }}
                >
                  {seg.text}
                </span>
              ) : seg.type === "slide" ? (
                seg.slideWords.map((word, wIdx) => (
                  <span key={wIdx}>
                    <span style={{ display: "inline-block" }}>
                      {word.chars.map(({ char, gi }, i) => (
                        <SlideChar
                          key={i}
                          char={char}
                          progress={scrollYProgress}
                          start={(gi / totalChars) * (1 - WINDOW_SIZE)}
                          end={
                            (gi / totalChars) * (1 - WINDOW_SIZE) +
                            WINDOW_SIZE
                          }
                        />
                      ))}
                    </span>
                    {wIdx < seg.slideWords.length - 1 ? " " : null}
                  </span>
                ))
              ) : seg.type === "underline" ? (
                <span
                  key={sIndex}
                  style={{
                    position: "relative",
                    whiteSpace: "nowrap",
                  }}
                >
                  {seg.chars.map(({ char, refIdx }) => (
                    <span
                      key={refIdx}
                      ref={(el) => {
                        charRefs.current[refIdx] = el;
                      }}
                      style={{ opacity: 0 }}
                    >
                      {char}
                    </span>
                  ))}
                  <svg
                    style={{
                      position: "absolute",
                      bottom: "-0.2em",
                      left: "-1%",
                      width: "102%",
                      height: "0.35em",
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
                      strokeWidth="3"
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
                    style={{ opacity: 0 }}
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
