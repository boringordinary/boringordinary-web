import { createFileRoute } from "@tanstack/react-router";
import { ImpossibleScene } from "../components/impossible-scene";

export const Route = createFileRoute("/")({
  component: () => <ImpossibleScene />,
});
