import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { InvitationCard } from "@/components/marketing/invitation-card";
import { CeremonialButton } from "@/components/marketing/ceremonial-button";
import { RegisterPageHeader, RegistrationProgress } from "@/components/marketing/register-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useServerFn } from "@tanstack/react-start";
import { createRegistration, initPaystackPayment } from "@/lib/registrations.functions";
import { toast } from "sonner";
import { uploadPassport } from "@/lib/storage";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register/fyb")({ component: FybRegister });

function useSettings() {
  return useQuery({
    queryKey: ["event-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("event_settings").select("key,value");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: { key: string; value: string | null }) => {
        if (r.value != null) map[r.key] = r.value;
      });
      return map;
    },
  });
}

function FybRegister() {
  const navigate = useNavigate();
  const create = useServerFn(createRegistration);
  const initPay = useServerFn(initPaystackPayment);
  const { data: settings } = useSettings();
  const fybPrice = settings?.fyb_price_naira ?? "7000";
  const formattedFyb = Number(fybPrice.replace(/[^0-9]/g, "") || "7000").toLocaleString();
  const [step, setStep] = useState<"paid-check" | "form">("paid-check");
  const [alreadyPaid, setAlreadyPaid] = useState<"yes" | "no" | "">("");
  const [regId, setRegId] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    gender: "" as "male" | "female" | "",
    whatsapp: "",
    department: "",
    course: "",
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
          attendee_type: "fyb",
          full_name: form.full_name,
          email: form.email,
          gender: form.gender || null,
          whatsapp: form.whatsapp || null,
          department: form.department || null,
          course: form.course || null,
          fyb_registration_id: regId || null,
          passport_url,
          already_paid: alreadyPaid === "yes",
        },
      });

      if (res.status === "free" || res.status === "paid") {
        toast.success("Registration confirmed", { description: "Your ticket is ready." });
        navigate({ to: "/ticket/$code", params: { code: res.ticket_code } });
        return;
      }

      // pending → go to Paystack
      const callback_url = `${window.location.origin}/ticket/${res.ticket_code}?verify=1`;
      const pay = await initPay({ data: { ticket_code: res.ticket_code, callback_url } });
      if ("authorization_url" in pay && pay.authorization_url) {
        window.location.href = pay.authorization_url;
      } else {
        navigate({ to: "/ticket/$code", params: { code: res.ticket_code } });
      }
    } catch (err) {
      toast.error("Registration failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <RegisterPageHeader
          eyebrow="Finalist Registration"
          title="Complete your finalist registration"
          subtitle="For FYB students being sent forth at NIFES CUSTECH Osara."
        />
        <RegistrationProgress step={step === "paid-check" ? 1 : 2} total={2} />

        {step === "paid-check" && (
          <InvitationCard className="mt-8">
            <Label className="text-base">
              Have you already paid the ₦{formattedFyb} dinner fee at the fellowship office?
            </Label>
            <RadioGroup
              value={alreadyPaid}
              onValueChange={(v) => setAlreadyPaid(v as "yes" | "no")}
              className="mt-4 grid gap-3"
            >
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 p-4 hover:bg-accent/50">
                <RadioGroupItem value="yes" id="paid-yes" />
                <span>Yes, I have paid</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 p-4 hover:bg-accent/50">
                <RadioGroupItem value="no" id="paid-no" />
                <span>No, I want to pay online now</span>
              </label>
            </RadioGroup>

            {alreadyPaid === "yes" && (
              <div className="mt-5 grid gap-2">
                <Label htmlFor="regid">Registration ID</Label>
                <Input
                  id="regid"
                  placeholder="e.g. NIFES-FYB-1023"
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This was issued to you when you paid at the fellowship office.
                </p>
              </div>
            )}

            <CeremonialButton
              type="button"
              className="mt-6 w-full"
              disabled={!alreadyPaid || (alreadyPaid === "yes" && !regId.trim())}
              onClick={() => setStep("form")}
            >
              Continue
            </CeremonialButton>
          </InvitationCard>
        )}

        {step === "form" && (
          <InvitationCard className="mt-8">
            <form onSubmit={submit} className="space-y-5">
              <div className="grid gap-2">
                <Label>Full Name *</Label>
                <Input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Email *</Label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Gender *</Label>
                <RadioGroup
                  required
                  value={form.gender}
                  onValueChange={(v) => setForm({ ...form, gender: v as "male" | "female" })}
                  className="flex gap-4"
                >
                  <label className="flex cursor-pointer items-center gap-2">
                    <RadioGroupItem value="male" /> Male
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <RadioGroupItem value="female" /> Female
                  </label>
                </RadioGroup>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                  <Label>Department *</Label>
                  <Input
                    required
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Course of Study *</Label>
                  <Input
                    required
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>
                  WhatsApp Number <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+234..."
                />
              </div>
              <div className="grid gap-2">
                <Label>
                  Passport Photo <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPassport(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="rounded-xl border border-gold/30 bg-background/40 p-4 text-sm">
                {alreadyPaid === "yes" ? (
                  <>You'll be sent directly to your digital ticket after registration.</>
                ) : (
                  <>
                    You'll be redirected to Paystack to pay{" "}
                    <span className="font-semibold text-gold">₦{formattedFyb}</span>. Your ticket
                    unlocks once payment is confirmed.
                  </>
                )}
              </div>

              <CeremonialButton type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {alreadyPaid === "yes" ? "Complete Registration" : "Register & Pay"}
              </CeremonialButton>
            </form>
          </InvitationCard>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
