import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTextScramble } from "../hooks/use-text-scramble";

function useScrambleTitle() {
  const title = useTextScramble("Boring+Ordinary", {
    characterPool: ["+", "-", "•", "~", "!", "=", "*", "#"],
    duration: 0.8,
  });
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function RootComponent() {
  useScrambleTitle();
  return <Outlet />;
}

export const Route = createRootRoute({
  component: RootComponent,
});
