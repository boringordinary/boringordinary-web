import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-warm-bg px-6 pt-0 pb-12 md:px-12 md:pb-16">
      <div className="mx-auto max-w-4xl">
        <div className="h-px bg-black/8 mb-12 md:mb-16" />
        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center font-sans text-xs tracking-wide font-normal text-black/30">
          <span>&copy; {new Date().getFullYear()} Boring+Ordinary</span>
          <Link
            to="/privacy"
            className="hover:text-black/55 transition-colors duration-300"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
