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
        className="relative isolate overflow-hidden bg-paper px-6 pt-7 pb-20 md:px-12 md:pt-10 md:pb-28"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(159,112,67,0.14),transparent_34%),linear-gradient(0deg,rgba(255,255,255,0.34),transparent_58%)]"
        />
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-start gap-5 border-b border-ink/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/"
              aria-label="Boring+Ordinary home"
              className="group flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              <Logo className="h-10 w-10 transition-transform duration-300 group-hover:rotate-3 md:h-11 md:w-11" />
              <span className="font-sans text-sm font-semibold text-ink">
                Boring+Ordinary
              </span>
            </a>
            <NavLinks />
          </div>

          <div className="grid gap-12 pt-16 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end md:pt-24 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div>
              <p className="mb-5 max-w-xl font-sans text-sm font-medium leading-6 text-ink/55 md:text-base">
                Seed-stage capital and product craft for useful work that most
                teams overlook.
              </p>
              <h1 className="max-w-5xl font-serif text-4xl leading-[1.02] text-ink text-balance sm:text-5xl sm:leading-[0.98] md:text-7xl md:leading-[0.96] lg:text-8xl">
                We build and back the useful, unfashionable work.
              </h1>
            </div>

            <aside className="relative border-l border-ink/15 pl-6 md:pb-2">
              <Logo className="mb-8 h-16 w-16 text-ink md:h-20 md:w-20" />
              <p className="font-sans text-sm leading-6 text-ink/60">
                Digital platforms, medtech, regtech, gaming, and consumer
                products for beauty, body, and mind.
              </p>
            </aside>
          </div>
        </div>
      </header>

      <div
        className="fixed top-0 left-0 right-0 z-50 border-b border-ink/10 bg-paper/90 px-6 backdrop-blur-md transition-transform duration-300 md:px-12"
        style={{ transform: visible ? "translateY(0)" : "translateY(-100%)" }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between md:h-16">
          <a
            href="/"
            aria-label="Boring+Ordinary home"
            className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            <Logo className="h-8 w-8 md:h-9 md:w-9" />
            <span className="hidden font-sans text-sm font-semibold text-ink sm:inline">
              Boring+Ordinary
            </span>
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
