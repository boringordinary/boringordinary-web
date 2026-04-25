import { Link } from "@tanstack/react-router";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-paper-wash px-6 pb-12 md:px-12 md:pb-16">
      <div className="mx-auto max-w-6xl border-t border-ink/15 pt-10 md:pt-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-9" />
            <div>
              <p className="font-sans text-sm font-semibold text-ink">
                Boring+Ordinary
              </p>
              <p className="mt-1 font-sans text-sm text-ink/45">
                &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 font-sans text-sm font-medium text-ink/50">
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
