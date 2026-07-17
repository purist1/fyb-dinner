import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { createRegistration, initPaystackPayment } from "@/lib/registrations.functions";
import { toast } from "sonner";
import { uploadPassport } from "@/lib/storage";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register/guest")({ component: GuestRegister });

function useSettings() {
  return useQuery({
    queryKey: ["event-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("event_settings").select("key,value");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: { key: string; value: string | null }) => { if (r.value != null) map[r.key] = r.value; });
      return map;
    },
  });
}

function GuestRegister() {
  const navigate = useNavigate();
  const create = useServerFn(createRegistration);
  const initPay = useServerFn(initPaystackPayment);
  const { data: settings } = useSettings();
  const guestPrice = settings?.guest_price_naira ?? "5000";
  const formattedGuest = Number(guestPrice.replace(/[^0-9]/g, "") || "5000").toLocaleString();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    gender: "" as "male" | "female" | "",
    whatsapp: "",
  });
  const [ticketAmount, setTicketAmount] = useState<number>(1500);
  const [passport, setPassport] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let passport_url: string | undefined;
      if (passport) passport_url = await uploadPassport(passport);
      const res = await create({
        data: {
          attendee_type: "guest",
          full_name: form.full_name,
          email: form.email,
          gender: form.gender || null,
          whatsapp: form.whatsapp || null,
          passport_url,
          ticket_amount: ticketAmount,
        },
      });
      const callback_url = `${window.location.origin}/ticket/${res.ticket_code}?verify=1`;
      const pay = await initPay({ data: { ticket_code: res.ticket_code, callback_url } });
      if ("authorization_url" in pay && pay.authorization_url) {
        window.location.href = pay.authorization_url;
      } else {
        navigate({ to: "/ticket/$code", params: { code: res.ticket_code } });
      }
    } catch (err) {
      toast.error("Registration failed", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="text-xs uppercase tracking-widest text-gold">Guest Registration</div>
        <h1 className="mt-2 font-serif text-2xl font-bold sm:text-3xl md:text-4xl">Register as a Guest</h1>
        <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border border-border/60 bg-card p-5 sm:mt-8 sm:p-6">
          <div className="grid gap-2">
            <Label>Full Name *</Label>
            <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Email *</Label>
            <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Gender *</Label>
            <RadioGroup required value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as "male" | "female" })} className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2"><RadioGroupItem value="male" /> Male</label>
              <label className="flex cursor-pointer items-center gap-2"><RadioGroupItem value="female" /> Female</label>
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label>WhatsApp Number <span className="text-muted-foreground">(optional)</span></Label>
            <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+234..." />
          </div>
          <div className="grid gap-2">
            <Label>Passport Photo <span className="text-muted-foreground">(optional)</span></Label>
            <Input type="file" accept="image/*" onChange={(e) => setPassport(e.target.files?.[0] ?? null)} />
          </div>

          <div className="grid gap-2">
            <Label>Choose Ticket Tier *</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { amount: 1500, title: "Standard", desc: "Access to venue & dinner" },
                { amount: 3000, title: "VIP", desc: "Priority seating & premium dinner" },
                { amount: 5000, title: "Executive", desc: "Front row seating & special recognition" }
              ].map((tier) => (
                <div
                  key={tier.amount}
                  onClick={() => setTicketAmount(tier.amount)}
                  className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${
                    ticketAmount === tier.amount
                      ? "border-gold bg-gold/10 shadow-gold/20"
                      : "border-border/60 hover:border-gold/50 bg-background/50"
                  }`}
                >
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">{tier.title}</div>
                  <div className="mt-2 text-2xl font-black text-gradient-gold">₦{tier.amount.toLocaleString()}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground leading-normal">{tier.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gold/30 bg-background/40 p-4 text-sm">
            You'll be redirected to Paystack to pay <span className="font-semibold text-gold">₦{ticketAmount.toLocaleString()}</span>. Your ticket unlocks once payment is confirmed.
          </div>

          <Button type="submit" disabled={busy} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register & Pay
          </Button>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}
