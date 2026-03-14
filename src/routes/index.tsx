import { createFileRoute } from "@tanstack/react-router";
import { ConcentricIllusion } from "../components/concentric-illusion";

export const Route = createFileRoute("/")({
  component: () => <ConcentricIllusion />,
});
