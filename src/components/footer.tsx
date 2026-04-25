import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-paper-wash px-6 pb-12 md:px-12 md:pb-16">
      <div className="mx-auto max-w-7xl pt-10 md:pt-12">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <Logo className="h-9 w-9" />
              <div>
                <p className="font-sans text-sm text-ink/45">
                  &copy; {new Date().getFullYear()} Boring+Ordinary
                </p>
              </div>
            </div>
            <p className="mt-6 font-serif text-2xl leading-[1.2] text-ink/55 text-pretty md:text-3xl">
            It's an ordinary operation.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 font-sans text-sm font-medium text-ink/50 md:justify-end">
            <Link
              to="/"
              className="transition duration-300 hover:text-ink active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              Home
            </Link>
            <a
              href="mailto:projects@boringordinary.com"
              className="transition duration-300 hover:text-ink active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              Contact
            </a>
            <Link
              to="/privacy"
              className="transition duration-300 hover:text-ink active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              Privacy policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
