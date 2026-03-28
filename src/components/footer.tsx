import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-white px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-4xl flex flex-col gap-4 md:flex-row md:justify-between md:items-center font-sans text-sm font-light text-black/50">
        <Link to="/privacy" className="hover:text-black transition-colors">
          Privacy Policy
        </Link>
        <a
          href="mailto:office@boringordinary.com"
          className="hover:text-black transition-colors"
        >
          office@boringordinary.com
        </a>
      </div>
    </footer>
  );
}
