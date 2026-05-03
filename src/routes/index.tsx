import { createFileRoute } from "@tanstack/react-router";
import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Footer } from "../components/footer";
import { Invest } from "../components/invest";
import { Logo } from "../components/logo";
import { Manifesto } from "../components/manifesto";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Invest", href: "#invest" },
  { label: "Contact", href: "mailto:projects@boringordinary.com" },
];

function scrollToSection(href: string) {
  const el = document.querySelector(href);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - 24;
  animate(window.scrollY, top, {
    duration: 0.8,
    ease: [0.22, 1, 0.36, 1],
    onUpdate: (v) => window.scrollTo(0, v),
  });
}

function NavLinks({ compact = false }: { compact?: boolean }) {
  return (
    <nav
      aria-label={compact ? "Sticky navigation" : "Primary navigation"}
      className={compact ? "flex items-center gap-5 md:gap-7" : "flex gap-6"}
    >
      {NAV_LINKS.map(({ label, href }) => (
        <a
          key={label}
          href={href}
          onClick={(e) => {
            if (!href.startsWith("#")) return;
            e.preventDefault();
            scrollToSection(href);
          }}
          className={
            compact
              ? "font-sans text-sm font-medium text-ink/55 transition duration-300 hover:text-ink active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              : "font-sans text-sm font-medium text-ink/60 transition duration-300 hover:text-ink active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          }
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

function Navbar() {
  const [visible, setVisible] = useState(false);
  const lastScrollY = useRef(0);
  const masthead = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const mastheadBottom =
        masthead.current?.getBoundingClientRect().bottom ?? 0;
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
        className="relative isolate flex overflow-hidden bg-paper px-6 pt-7 pb-16 md:px-12 md:pt-10 md:pb-16 xl:min-h-[86svh] xl:pb-20 2xl:min-h-[92svh]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(255,255,255,0.34),transparent_62%)]"
        />
        <div className="mx-auto flex w-full max-w-7xl flex-col">
          <div className="flex flex-col items-start gap-5 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/"
              aria-label="Boring+Ordinary home"
              className="group inline-flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              <Logo className="h-10 w-10 transition-transform duration-300 group-hover:rotate-3 md:h-11 md:w-11" />
            </a>
            <NavLinks />
          </div>

          <div className="grid flex-1 gap-10 pt-12 sm:pt-16 md:pt-18 lg:pt-20 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,24rem)] xl:items-center xl:gap-20">
            <div className="max-w-6xl xl:max-w-5xl">
              <h1 className="max-w-6xl font-serif text-4xl leading-[1.02] text-ink text-balance sm:text-5xl sm:leading-[0.98] md:text-6xl md:leading-[0.96] lg:text-7xl lg:leading-[0.94]">
                Supporting companies the rest of the industry won't touch</h1>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="mailto:projects@boringordinary.com"
                  className="inline-flex min-h-12 items-center justify-center bg-ink px-5 py-3 font-sans text-sm font-semibold text-paper transition duration-300 hover:-translate-y-0.5 hover:bg-ink/90 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  Contact us
                </a>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection("#about");
                  }}
                  className="inline-flex min-h-12 items-center justify-center border-b border-ink/25 px-1 py-3 font-sans text-sm font-semibold text-ink/70 transition duration-300 hover:border-ink hover:text-ink active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  About the work
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className="fixed top-0 left-0 right-0 z-50 bg-paper/90 px-6 backdrop-blur-md transition-transform duration-300 md:px-12"
        style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between md:h-16">
          <a
            href="/"
            aria-label="Boring+Ordinary home"
            className="inline-flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <Logo className="h-8 w-8 md:h-9 md:w-9" />
          </a>
          <NavLinks compact />
        </div>
      </div>
    </>
  );
}

export const Route = createFileRoute("/")({
  component: () => (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only fixed left-4 top-4 z-[60] bg-ink px-4 py-3 font-sans text-sm font-semibold text-paper focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ink"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="content">
        <Manifesto />
        <Invest />
      </main>
      <Footer />
    </>
  ),
});
