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

export const Route = createFileRoute("/register/guest")({ component: GuestRegister });

function GuestRegister() {
  const navigate = useNavigate();
  const create = useServerFn(createRegistration);
  const initPay = useServerFn(initPaystackPayment);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    gender: "" as "male" | "female" | "",
    whatsapp: "",
  });
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
      <section className="mx-auto max-w-2xl px-4 py-14">
        <div className="text-xs uppercase tracking-widest text-gold">Guest Registration</div>
        <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Register as a Guest</h1>
        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-border/60 bg-card p-6">
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

          <div className="rounded-xl border border-gold/30 bg-background/40 p-4 text-sm">
            You'll be redirected to Paystack to pay <span className="font-semibold text-gold">₦5,000</span>. Your ticket unlocks once payment is confirmed.
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
