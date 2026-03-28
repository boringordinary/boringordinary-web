import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "../components/logo";
import { Manifesto } from "../components/manifesto";
import { Invest } from "../components/invest";
import { Footer } from "../components/footer";

export const Route = createFileRoute("/")({
  component: () => (
    <>
      <header className="w-full bg-white flex items-center justify-center pt-32 pb-16 md:pt-48 md:pb-24">
        <Logo className="w-20 h-20" />
      </header>
      <Manifesto />
      <Invest />
      <Footer />
    </>
  ),
});
