import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "../components/logo";

export const Route = createFileRoute("/")({
  component: () => (
    <div className="h-dvh w-full bg-white flex items-center justify-center">
      <Logo className="w-40 h-40" />
    </div>
  ),
});
