"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function Invest() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      id="invest"
      className="relative isolate overflow-hidden bg-paper-wash px-6 py-24 scroll-mt-20 md:px-12 md:py-36"
    >
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 -z-10 h-full w-1/3 bg-[linear-gradient(90deg,rgba(244,239,231,0.72),transparent)]"
      />
      <div className="mx-auto grid max-w-7xl gap-14 border-t border-ink/15 pt-16 md:grid-cols-[0.8fr_1.2fr] md:gap-24 md:pt-24">
        <div className="md:sticky md:top-24 md:self-start">
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
          <motion.p
            className="mt-7 max-w-sm font-sans text-sm leading-6 text-ink/52"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.14,
            }}
          >
            Operator-led capital for teams making useful things before they look
            obvious.
          </motion.p>
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
          <p className="mb-12 max-w-2xl font-serif text-xl leading-[1.62] text-ink/70 text-pretty md:mb-14 md:text-2xl md:leading-[1.58]">
            We back seed-stage projects with capital, product judgment, and
            experience shipping platforms that people return to. We care about
            teams working on problems with real daily weight.
          </p>

          <div className="grid gap-6 border-l border-ink/15 pl-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <p className="max-w-md font-sans text-sm leading-6 text-ink/58">
              Send a concise note with what you are building, why now, and what
              you need from us.
            </p>
            <a
              href="mailto:projects@boringordinary.com"
              className="group inline-flex min-h-12 items-center justify-center gap-3 bg-ink px-5 py-3 font-sans text-sm font-semibold text-paper transition duration-300 hover:-translate-y-0.5 hover:bg-ink/90 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              <span>Get in touch</span>
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
