"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

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
        <div className="h-px bg-black/8 mb-24 md:mb-36" />
        {/* Heading */}
        <motion.h2
          className="font-serif text-3xl leading-snug md:text-4xl md:leading-snug lg:text-6xl lg:leading-tight text-black mb-8 md:mb-12"
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          We invest differently.
        </motion.h2>

        {/* Body */}
        <motion.p
          className="font-serif text-lg leading-relaxed md:text-xl md:leading-relaxed text-black/60 max-w-2xl mb-10 md:mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          We back seed-stage projects with more than just capital. We bring
          generational expertise in building and scaling products that
          actually ship and define people on an existential level. If this journey resonates with you,
          let's build the future together.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <a
            href="mailto:projects@boringordinary.com"
            className="inline-flex items-center justify-center bg-black text-white font-sans font-bold text-sm md:text-base tracking-wider px-10 py-4 hover:bg-black/85 transition-colors duration-300"
          >
            Get in touch
          </a>
        </motion.div>
      </div>
    </section>
  );
}
