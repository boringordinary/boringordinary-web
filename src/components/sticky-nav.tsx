import { useRef, useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { Logo } from "./logo";

export function StickyNav() {
  const { scrollY } = useScroll();
  const lastY = useRef(0);
  const [visible, setVisible] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  // Only show after scrolling past the hero header area
  useEffect(() => {
    const check = () => setPastHero(window.scrollY > 200);
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  useMotionValueEvent(scrollY, "change", (y) => {
    const delta = y - lastY.current;
    lastY.current = y;

    if (y < 200) {
      setVisible(false);
    } else if (delta < -5) {
      setVisible(true);
    } else if (delta > 5) {
      setVisible(false);
    }
  });

  if (!pastHero) return null;

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-black/5"
      initial={{ y: "-100%" }}
      animate={{ y: visible ? "0%" : "-100%" }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-12 flex items-center justify-between">
        {/* Left spacer for centering */}
        <div className="w-24 md:w-32" />

        {/* Center logo */}
        <a href="/" className="flex items-center justify-center">
          <Logo className="w-10 h-10" />
        </a>

        {/* Right contact button */}
        <div className="w-24 md:w-32 flex justify-end">
          <a
            href="mailto:projects@boringordinary.com"
            className="font-sans text-sm font-bold text-black/60 hover:text-black transition-colors duration-200"
          >
            Contact
          </a>
        </div>
      </div>
    </motion.nav>
  );
}
