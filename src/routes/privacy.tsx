import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Meridian" }] }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-14 prose prose-neutral">
      <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">Last updated: July 2026</p>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Meridian Global Logistics respects your privacy. This policy describes how we collect, use and protect data related to shipments, accounts and website use.</p>
        <p>We collect only the information required to move your goods, bill your account, and comply with customs regulations. Data is encrypted in transit and at rest.</p>
        <p>You may request export or deletion of your personal data at any time by contacting privacy@meridian.co.</p>
      </div>
    </div>
  ),
});
