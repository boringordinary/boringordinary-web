import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import { Logo } from "../components/logo";
import { Manifesto } from "../components/manifesto";
import { Invest } from "../components/invest";
import { Footer } from "../components/footer";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Invest", href: "#invest" },
  { label: "Contact", href: "mailto:projects@boringordinary.com" },
];

function Navbar() {
  const [visible, setVisible] = useState(false);
  const lastScrollY = useRef(0);
  const masthead = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const mastheadBottom = masthead.current?.getBoundingClientRect().bottom ?? 0;
      const pastMasthead = mastheadBottom < 0;
      const scrollingUp = y < lastScrollY.current;

      setVisible(pastMasthead && scrollingUp);
      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        ref={masthead}
        className="w-full bg-white flex items-center justify-center pt-12 pb-12 md:pt-16 md:pb-16"
      >
        <Logo className="w-16 h-16 md:w-20 md:h-20" />
      </header>

      <div
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/5 px-6 md:px-12 transition-transform duration-300"
        style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
      >
        <div className="mx-auto max-w-4xl flex items-center justify-between h-10 md:h-12">
          <Logo className="h-full w-auto" />
          <nav className="flex gap-6 md:gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={(e) => {
                  if (!href.startsWith("#")) return;
                  e.preventDefault();
                  const el = document.querySelector(href);
                  if (!el) return;
                  const top = el.getBoundingClientRect().top + window.scrollY;
                  animate(window.scrollY, top, {
                    duration: 0.8,
                    ease: [0.22, 1, 0.36, 1],
                    onUpdate: (v) => window.scrollTo(0, v),
                  });
                }}
                className="font-sans text-sm md:text-base font-normal text-black/40 hover:text-black transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}

export const Route = createFileRoute("/")({
  component: () => (
    <>
      <Navbar />
      <Manifesto />
      <Invest />
      <Footer />
    </>
  ),
});
