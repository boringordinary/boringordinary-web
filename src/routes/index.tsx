import { createFileRoute } from "@tanstack/react-router";
import { ConcentricIllusion } from "../components/ConcentricIllusion";

export const Route = createFileRoute("/")({
  component: () => <ConcentricIllusion />,
});
