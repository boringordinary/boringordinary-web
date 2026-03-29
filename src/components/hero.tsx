import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTextScramble } from "../hooks/use-text-scramble";
import { Logo } from "./logo";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const [scrambleReady, setScrambleReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setScrambleReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const headword = useTextScramble("Boring+Ordinary", {
    characterPool: ["+", "-", "~", "!", "=", "*", "#"],
    duration: 1.2,
    trigger: prefersReducedMotion ? false : scrambleReady,
  });

  const fadeUp = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.6, delay, ease: EASE },
        };

  return (
    <section className="min-h-svh flex items-center justify-center bg-warm-bg px-6 md:px-12">
      <div className="max-w-4xl w-full">
        {/* Logo mark */}
        <motion.div {...fadeUp(0)} className="mb-12 md:mb-16">
          <Logo className="w-8 h-8 md:w-10 md:h-10" />
        </motion.div>

        {/* Headword — grid overlap prevents scramble jitter */}
        <h1 className="font-sans text-5xl md:text-7xl lg:text-8xl xl:text-9xl leading-none text-black mb-8 md:mb-12 grid">
          <span className="invisible col-start-1 row-start-1 select-none" aria-hidden="true">
            Boring+Ordinary
          </span>
          <span className="col-start-1 row-start-1">
            {prefersReducedMotion ? "Boring+Ordinary" : headword}
          </span>
        </h1>

        {/* Definition */}
        <motion.p
          {...fadeUp(0.8)}
          className="font-serif text-xl md:text-2xl lg:text-3xl text-black/50 leading-relaxed"
        >
          A studio and seed fund dedicated to building extraordinary
          things from the ordinary — sustainable products in service of beauty,
          body, and mind.
        </motion.p>
      </div>
    </section>
  );
}
