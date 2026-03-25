import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "../components/logo";
import { Manifesto } from "../components/manifesto";

export const Route = createFileRoute("/")({
  component: () => (
    <>
      <header className="w-full bg-white flex items-center justify-center pt-32 pb-16 md:pt-48 md:pb-24">
        <Logo className="w-20 h-20" />
      </header>
      <Manifesto />
      <footer className="bg-white px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto max-w-4xl flex flex-col gap-4 md:flex-row md:justify-between md:items-center text-sm text-black/50">
          <a href="/privacy" className="hover:text-black transition-colors">Privacy Policy</a>
          <a href="mailto:office@boringordinary.com" className="hover:text-black transition-colors">office@boringordinary.com</a>
        </div>
      </footer>
    </>
  ),
});
