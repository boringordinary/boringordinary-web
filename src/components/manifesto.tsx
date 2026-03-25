import { useRef, useMemo, useEffect } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";

const paragraphs: { text: string; quote?: boolean | "cite" }[] = [
  { text: "Since 2019, we\u2019ve been building digital platforms that serve millions\u2014solving problems in ways that should be ordinary but for odd reasons isn\u2019t." },
  { text: "We invest in game-changing medtech, consumer products, and the industries where it matters most\u2014the quiet struggles of beauty, body, and mind that shape everyday life." },
  { text: "We are misfits\u2014engineers, designers, artists\u2014the kind that\u2019s hard to place, even among misfits. Our approach is boring in the ways it matters\u2014sustainable products in service of humanity, and ultimately, God\u2019s kingdom." },
  { text: "\u201CBe wise as serpents and innocent as doves.\u201D", quote: true },
  { text: "Matthew 10:16", quote: "cite" as const },
];

export function Manifesto() {
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const prefersReducedMotion = useRef(false);

  const charData = useMemo(() => {
    let index = 0;
    return paragraphs.map(({ text, quote }) => ({
      text,
      quote,
      chars: [...text].map((char) => ({ char, index: index++ })),
    }));
  }, []);

  const totalChars = charData.reduce((sum, p) => sum + p.chars.length, 0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.9", "end end"],
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.current = mq.matches;

    if (mq.matches) {
      charRefs.current.forEach((el) => {
        if (el) {
          el.style.opacity = "1";
          el.style.filter = "none";
        }
      });
    }

    const onChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
      if (e.matches) {
        charRefs.current.forEach((el) => {
          if (el) {
            el.style.opacity = "1";
            el.style.filter = "none";
          }
        });
      }
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (prefersReducedMotion.current) return;

    const windowSize = 0.12;
    const refs = charRefs.current;

    for (let i = 0; i < refs.length; i++) {
      const el = refs[i];
      if (!el) continue;

      const charStart = (i / totalChars) * (1 - windowSize);
      const charEnd = charStart + windowSize;

      if (progress <= charStart) {
        if (el.dataset.s !== "h") {
          el.style.opacity = "0";
          el.style.filter = "blur(8px)";
          el.dataset.s = "h";
        }
      } else if (progress >= charEnd) {
        if (el.dataset.s !== "v") {
          el.style.opacity = "1";
          el.style.filter = "none";
          el.dataset.s = "v";
        }
      } else {
        const t = (progress - charStart) / (charEnd - charStart);
        el.style.opacity = String(t);
        el.style.filter = `blur(${((1 - t) * 8).toFixed(1)}px)`;
        el.dataset.s = "t";
      }
    }
  });

  return (
    <section ref={containerRef} className="bg-white px-6 pb-32 md:px-12 md:pb-48">
      <div className="mx-auto max-w-4xl">
        {charData.map((para, pIndex) => (
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
            {para.chars.map(({ char, index }) => (
              <span
                key={index}
                ref={(el) => {
                  charRefs.current[index] = el;
                }}
                style={{ opacity: 0, filter: "blur(8px)" }}
              >
                {char}
              </span>
            ))}
          </p>
        ))}
      </div>
    </section>
  );
}
