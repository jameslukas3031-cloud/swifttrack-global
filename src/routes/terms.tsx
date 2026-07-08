import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Meridian" }] }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="font-display text-4xl font-bold">Terms & Conditions</h1>
      <p className="mt-4 text-muted-foreground">Last updated: July 2026</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>By using the Meridian platform you agree to our standard freight-forwarding terms, including limitations of liability defined by the Warsaw and Montreal Conventions (air), Hague-Visby Rules (sea), and CMR (road).</p>
        <p>Full commercial terms are provided at booking. For dedicated contract logistics, a Master Service Agreement supersedes these standard terms.</p>
      </div>
    </div>
  ),
});
