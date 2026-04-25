"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

const FOCUS_AREAS = [
  "Medtech and regtech",
  "Games with durable communities",
  "Consumer products for beauty, body, and mind",
];

export function Invest() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      id="invest"
      className="bg-paper-wash px-6 py-24 scroll-mt-20 md:px-12 md:py-36"
    >
      <div className="mx-auto grid max-w-6xl gap-14 border-t border-ink/15 pt-16 md:grid-cols-[0.85fr_1.15fr] md:gap-20 md:pt-24">
        <div>
          <motion.p
            className="mb-6 font-sans text-sm font-medium text-ink/45"
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0 }}
          >
            Invest
          </motion.p>

          <motion.h2
            className="max-w-xl font-serif text-4xl leading-[1.04] text-ink text-balance md:text-6xl md:leading-[1.02]"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.08,
            }}
          >
            We invest differently.
          </motion.h2>
        </div>

        <motion.div
          className="md:pt-14"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.18,
          }}
        >
          <p className="mb-12 max-w-2xl font-serif text-xl leading-[1.62] text-ink/70 text-pretty md:text-2xl md:leading-[1.58]">
            We back seed-stage projects with capital, product judgment, and
            experience shipping platforms that people return to. We care about
            teams working on problems with real daily weight.
          </p>

          <div className="mb-12 divide-y divide-ink/15 border-y border-ink/15">
            {FOCUS_AREAS.map((area) => (
              <div
                key={area}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-4 py-4"
              >
                <span aria-hidden="true" className="h-2 w-2 bg-accent/70" />
                <span className="font-sans text-sm font-medium leading-6 text-ink/65 md:text-base">
                  {area}
                </span>
              </div>
            ))}
          </div>

          <a
            href="mailto:projects@boringordinary.com"
            className="group inline-flex min-h-12 items-center gap-3 bg-ink px-5 py-3 font-sans text-sm font-semibold text-paper transition duration-300 hover:-translate-y-0.5 hover:bg-ink/90 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <span>Get in touch</span>
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
