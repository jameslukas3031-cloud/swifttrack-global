import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calculator, Plane, Ship, Truck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Shipping calculator — Meridian" },
      { name: "description", content: "Instant shipping rates for air, sea and road freight worldwide. No account required." },
    ],
  }),
  component: CalcPage,
});

type Mode = "air" | "sea" | "road";
const rates: Record<Mode, { base: number; perKg: number; days: string; icon: typeof Plane; label: string }> = {
  air: { base: 45, perKg: 6.2, days: "2–4 days", icon: Plane, label: "Air Express" },
  sea: { base: 120, perKg: 0.85, days: "18–35 days", icon: Ship, label: "Sea Freight" },
  road: { base: 25, perKg: 1.6, days: "3–7 days", icon: Truck, label: "Road Transport" },
};

function CalcPage() {
  const [origin, setOrigin] = useState("Singapore");
  const [dest, setDest] = useState("New York");
  const [weight, setWeight] = useState("18");
  const [dims, setDims] = useState("60x42x35");
  const [mode, setMode] = useState<Mode>("air");
  const [insurance, setInsurance] = useState(true);
  const [declared, setDeclared] = useState("2500");
  const [result, setResult] = useState<{ subtotal: number; insurance: number; total: number; days: string } | null>(null);

  function compute(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(weight) || 0;
    const d = parseFloat(declared) || 0;
    const r = rates[mode];
    const distanceFactor = origin && dest ? 1 + (Math.abs(origin.length - dest.length) % 5) * 0.08 : 1;
    const subtotal = (r.base + r.perKg * w) * distanceFactor;
    const ins = insurance ? Math.max(6, d * 0.008) : 0;
    setResult({ subtotal, insurance: ins, total: subtotal + ins, days: r.days });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">Instant rate</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Shipping calculator</h1>
        <p className="mt-3 text-muted-foreground">Get an indicative rate in seconds. Final quote confirmed on booking.</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <form onSubmit={compute} className="rounded-2xl border border-border bg-card p-6 shadow-elevated lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <Label htmlFor="origin">Origin</Label>
              <Input id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} className="mt-1.5" placeholder="City or postcode" />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="dest">Destination</Label>
              <Input id="dest" value={dest} onChange={(e) => setDest(e.target.value)} className="mt-1.5" placeholder="City or postcode" />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="dims">Dimensions (L×W×H cm)</Label>
              <Input id="dims" value={dims} onChange={(e) => setDims(e.target.value)} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label>Shipping mode</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(Object.keys(rates) as Mode[]).map((m) => {
                  const Icon = rates[m].icon;
                  const active = mode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition ${
                        active ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground/40"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{rates[m].label}</span>
                      <span className="text-xs">{rates[m].days}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="declared">Declared value (USD)</Label>
              <Input id="declared" type="number" value={declared} onChange={(e) => setDeclared(e.target.value)} className="mt-1.5" />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Checkbox id="ins" checked={insurance} onCheckedChange={(v) => setInsurance(!!v)} />
              <Label htmlFor="ins" className="flex items-center gap-2 font-normal">
                <ShieldCheck className="h-4 w-4 text-accent" /> Add cargo insurance (0.8% of declared value)
              </Label>
            </div>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full gradient-brand text-white hover:opacity-90">
            <Calculator className="mr-2 h-4 w-4" /> Calculate rate
          </Button>
        </form>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">Estimated cost</h3>
          {!result ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Fill in the form to see your rate.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Freight ({rates[mode].label})</span>
                <span className="font-mono">${result.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Insurance</span>
                <span className="font-mono">${result.insurance.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
                <div className="mt-1 font-display text-4xl font-bold text-gradient-brand">${result.total.toFixed(2)}</div>
                <div className="mt-1 text-sm text-muted-foreground">Estimated transit: {result.days}</div>
              </div>
              <Button className="mt-4 w-full" variant="outline">Book this shipment</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
