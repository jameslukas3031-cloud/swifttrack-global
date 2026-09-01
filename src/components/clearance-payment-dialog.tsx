import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bitcoin, Building2, CreditCard, Gift, Coins, Upload, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export type PaymentMethod = {
  id: string; kind: string; label: string; instructions: string | null;
  account_details: string | null; sort_order: number;
};

const ICONS: Record<string, typeof Bitcoin> = {
  bitcoin: Bitcoin, usdt: Coins, paypal: CreditCard, bank_transfer: Building2, gift_card: Gift,
};

export function ClearancePaymentDialog({
  shipmentId, trackingNumber, amountDue, onClose,
}: { shipmentId: string; trackingNumber: string; amountDue: number; onClose: () => void }) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState(amountDue > 0 ? String(amountDue.toFixed(2)) : "");
  const [reference, setReference] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [note, setNote] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("payment_methods").select("id,kind,label,instructions,account_details,sort_order")
      .eq("enabled", true).order("sort_order")
      .then(({ data }) => setMethods((data ?? []) as PaymentMethod[]));
  }, []);

  async function submit() {
    if (!selected) return toast.error("Choose a payment method");
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter the amount you paid");
    if (payerEmail && !/^\S+@\S+\.\S+$/.test(payerEmail)) return toast.error("Enter a valid email");
    if (proof && proof.size > 5 * 1024 * 1024) return toast.error("Proof image must be under 5MB");
    setSubmitting(true);
    let proofPath: string | null = null;
    if (proof) {
      const ext = proof.name.split(".").pop()?.slice(0, 6) || "jpg";
      proofPath = `${shipmentId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("payment-proofs").upload(proofPath, proof, { contentType: proof.type });
      if (error) { setSubmitting(false); return toast.error("Proof upload failed: " + error.message); }
    }
    const { error } = await supabase.from("clearance_payments").insert({
      shipment_id: shipmentId,
      method_id: selected.id,
      method_label: selected.label,
      amount: amt,
      reference: reference.trim().slice(0, 200) || null,
      payer_name: payerName.trim().slice(0, 120) || null,
      payer_email: payerEmail.trim().slice(0, 200) || null,
      proof_url: proofPath,
      note: note.trim().slice(0, 1000) || null,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") return toast.error("This payment reference was already submitted.");
      return toast.error(error.message);
    }
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4" onClick={onClose}>
      <Card className="max-h-[92vh] w-full max-w-2xl overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Customs clearance payment</h3>
            <p className="mt-1 text-sm text-muted-foreground">Shipment <span className="font-mono">{trackingNumber}</span> · Amount due ${amountDue.toFixed(2)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        {done ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <h4 className="mt-3 font-display text-lg font-semibold">Payment submitted for review</h4>
            <p className="mt-2 text-sm text-muted-foreground">Our clearance team will verify your payment and update the shipment status. You can close this window.</p>
            <Button className="mt-6" onClick={onClose}>Close</Button>
          </div>
        ) : methods.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No payment methods are available yet. Please contact support.</p>
        ) : (
          <>
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold">Click on the payment option to view payment details</p>
              <Label>Payment method</Label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {methods.map((m) => {
                  const Icon = ICONS[m.kind] ?? CreditCard;
                  const active = selected?.id === m.id;
                  return (
                    <button key={m.id} type="button" onClick={() => setSelected(m)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selected && (
              <div className="mt-4 rounded-lg border border-border bg-muted/40 p-4 text-sm">
                {selected.instructions && <p className="whitespace-pre-wrap">{selected.instructions}</p>}
                {selected.account_details && (
                  <div className="mt-3">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Send to</div>
                    <div className="mt-1 flex items-start gap-2">
                      <code className="flex-1 break-all rounded bg-background px-2 py-1 font-mono text-xs">{selected.account_details}</code>
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(selected.account_details ?? ""); toast.success("Copied"); }}>Copy</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><Label>Amount paid ($)</Label><Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5" /></div>
              <div><Label>Transaction reference / hash</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={200} className="mt-1.5" /></div>
              <div><Label>Your name</Label><Input value={payerName} onChange={(e) => setPayerName(e.target.value)} maxLength={120} className="mt-1.5" /></div>
              <div><Label>Your email</Label><Input type="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} maxLength={200} className="mt-1.5" /></div>
              <div className="sm:col-span-2"><Label>Note (optional)</Label><Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={2} className="mt-1.5" /></div>
              <div className="sm:col-span-2">
                <Label>Proof of payment</Label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
                <div className="mt-1.5 flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Upload screenshot</Button>
                  {proof && <span className="truncate text-xs text-muted-foreground">{proof.name}</span>}
                </div>
              </div>
            </div>

            <Button className="mt-6 w-full gradient-brand text-white" disabled={submitting} onClick={submit}>
              {submitting ? "Submitting…" : "Submit payment for review"}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Payments are verified manually. Never share account passwords.</p>
          </>
        )}
      </Card>
    </div>
  );
}
