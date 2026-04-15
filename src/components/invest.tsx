"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function Invest() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      id="invest"
      className="bg-white px-6 pt-0 pb-24 md:px-12 md:pb-36 scroll-mt-8"
    >
      <div className="mx-auto max-w-4xl">
        {/* Divider */}
        <div
          className="flex items-center justify-center gap-4 mb-20 md:mb-32"
          aria-hidden="true"
        >
          <span className="block h-px w-12 bg-black/12" />
          <span className="block h-1 w-1 rounded-full bg-black/20" />
          <span className="block h-px w-12 bg-black/12" />
        </div>

        {/* Eyebrow */}
        <motion.p
          className="font-sans text-xs tracking-[0.22em] uppercase text-black/40 mb-6 md:mb-8"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0 }}
        >
          <span aria-hidden="true">—&nbsp;&nbsp;</span>Invest
        </motion.p>

        {/* Heading */}
        <motion.h2
          className="font-serif text-3xl leading-[1.15] md:text-4xl md:leading-[1.15] lg:text-6xl lg:leading-[1.05] tracking-[-0.015em] text-balance text-black mb-10 md:mb-14"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
        >
          We invest differently.
        </motion.h2>

        {/* Body */}
        <motion.p
          className="font-serif text-lg leading-[1.7] md:text-xl md:leading-[1.65] text-black/55 max-w-[38rem] mb-12 md:mb-16 text-pretty"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
        >
          We back seed-stage projects with more than just capital. We bring
          generational expertise in building and scaling products that actually
          ship and define people on an existential level. If this journey
          resonates with you, let's build the future together.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.36 }}
        >
          <a
            href="mailto:projects@boringordinary.com"
            className="group inline-flex items-baseline gap-3 font-serif text-xl md:text-2xl text-black border-b border-black/25 pb-1 hover:border-black transition-colors duration-300"
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
