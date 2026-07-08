import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Meridian Global Logistics" },
      { name: "description", content: "Answers to the most common questions about tracking, rates, customs, insurance and delivery." },
    ],
  }),
  component: FaqPage,
});

const faqs = [
  { q: "How do I track my shipment?", a: "Enter your tracking number on the Track page — no account needed. You'll see real-time GPS location, timeline history, and estimated delivery time." },
  { q: "What countries do you deliver to?", a: "We serve 220 countries and territories through our own network of 1,400 facilities and 12,000 partner locations." },
  { q: "How is the shipping cost calculated?", a: "Rate is based on origin/destination, weight, volumetric weight, service mode (air/sea/road) and optional insurance. Use our calculator for an instant estimate." },
  { q: "Do you offer cargo insurance?", a: "Yes — up to $50k cover is included by default, and additional insurance (0.8% of declared value) can be added at booking." },
  { q: "What happens during customs clearance?", a: "Our licensed brokers in 80+ jurisdictions handle documentation, HS classification, and duty/tax payment. Average clearance is under 4 hours." },
  { q: "Can I schedule a specific delivery window?", a: "Yes. Customers on business accounts can book 2-hour delivery slots in supported metros." },
  { q: "What if my package is delayed or damaged?", a: "Every shipment is scanned at 14 checkpoints. If we detect a delay or exception, you're notified proactively and can file a claim in-app." },
  { q: "Do you support returns and reverse logistics?", a: "Yes — full pick-up, refurbishment and re-stock workflows across warehousing and last-mile." },
];

function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">Help center</p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Frequently asked questions</h1>
      <Accordion type="single" collapsible className="mt-10">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left font-display text-lg">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
