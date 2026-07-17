import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import QRCode from "qrcode";
import { useServerFn } from "@tanstack/react-start";
import { verifyPaystackPayment } from "@/lib/registrations.functions";
import { EVENT } from "@/lib/event";
import { Calendar, Clock, MapPin, CheckCircle2, Loader2, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const search = z.object({ verify: z.string().optional(), reference: z.string().optional(), trxref: z.string().optional() });

export const Route = createFileRoute("/ticket/$code")({
  component: TicketPage,
  validateSearch: (s) => search.parse(s),
});

type Registration = {
  ticket_code: string;
  attendee_type: string;
  full_name: string;
  email: string;
  department: string | null;
  course: string | null;
  passport_url: string | null;
  payment_status: string;
  payment_amount: number | null;
  checked_in: boolean;
};

function TicketPage() {
  const { code } = Route.useParams();
  const s = useSearch({ from: "/ticket/$code" });
  const verify = useServerFn(verifyPaystackPayment);
  const [reg, setReg] = useState<Registration | null>(null);
  const [qr, setQr] = useState<string>("");
  const [venue, setVenue] = useState("To Be Announced");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("registrations")
      .select("ticket_code, attendee_type, full_name, email, department, course, passport_url, payment_status, payment_amount, checked_in")
      .eq("ticket_code", code)
      .maybeSingle();
    setReg(data);
    if (data) {
      const png = await QRCode.toDataURL(data.ticket_code, { errorCorrectionLevel: "H", margin: 1, width: 320, color: { dark: "#1a0b2e", light: "#f7e6b6" } });
      setQr(png);
    }
    const { data: v } = await supabase.from("event_settings").select("value").eq("key", "venue").maybeSingle();
    if (v?.value) setVenue(v.value);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      if (s.verify || s.reference || s.trxref) {
        setVerifying(true);
        const ref = s.reference || s.trxref;
        try {
          if (ref) {
            const r = await verify({ data: { reference: ref } });
            if (r.paid) toast.success("Payment confirmed");
          }
        } catch (err) {
          toast.error("Could not verify payment", { description: err instanceof Error ? err.message : String(err) });
        }
        setVerifying(false);
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const paid = reg?.payment_status === "paid" || reg?.payment_status === "free";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your ticket…</div>
        ) : !reg ? (
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
            <h2 className="font-serif text-2xl">Ticket not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">This ticket code doesn't exist.</p>
            <Link to="/register" className="mt-6 inline-flex rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-semibold text-gold-foreground">Register</Link>
          </div>
        ) : (
          <div>
            {verifying && <div className="mb-4 rounded-lg border border-gold/40 bg-card p-3 text-sm text-gold flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying payment…</div>}

            {!paid ? (
              <div className="rounded-2xl border border-destructive/60 bg-card p-6 text-center">
                <h2 className="font-serif text-2xl">Payment Pending</h2>
                <p className="mt-2 text-sm text-muted-foreground">Your ticket will unlock once your payment is confirmed. If you just paid, refresh in a moment.</p>
              </div>
            ) : (
              <div id="ticket" className="overflow-hidden rounded-3xl border border-gold/40 bg-gradient-royal shadow-elegant">
                <div className="border-b border-gold/30 bg-background/30 p-6 text-center backdrop-blur">
                  <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
                    <Sparkles className="h-3.5 w-3.5" /> {EVENT.orgShort} · {EVENT.chapter}
                  </div>
                  <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">FYB Dinner & Awards Night</h2>
                  <div className="mt-1 text-sm text-muted-foreground">{EVENT.year}</div>
                </div>

                <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:gap-8 sm:p-8">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-gold">Attendee</div>
                    <div className="mt-1 font-serif text-2xl">{reg.full_name}</div>
                    <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                      {reg.attendee_type === "fyb" ? "Finalist (FYB)" : "Guest"}
                      {reg.attendee_type === "fyb" && reg.department && ` · ${reg.department}`}
                    </div>

                    <div className="mt-6 space-y-3 text-sm">
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" /> {EVENT.dateHuman}</div>
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gold" /> {EVENT.timeHuman}</div>
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> {venue}</div>
                    </div>

                    <div className="mt-6 flex items-center gap-2 rounded-lg border border-gold/30 bg-background/40 p-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-gold" />
                      <span className="text-muted-foreground">{reg.payment_status === "free" ? "Paid offline · Confirmed" : "Payment confirmed"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-2xl bg-background/30 p-4">
                    {qr && <img src={qr} alt="QR ticket" width={220} height={220} className="rounded-lg" />}
                    <div className="mt-3 font-mono text-xs tracking-widest text-gold">{reg.ticket_code}</div>
                  </div>
                </div>

                <div className="border-t border-gold/30 bg-background/30 p-4 text-center text-xs text-muted-foreground">
                  Present this ticket (screen or printed) at the venue for check-in.
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card px-5 py-2.5 text-sm hover:bg-card/60">
                <Download className="h-4 w-4 text-gold" /> Save / Print
              </button>
              <Link to="/" className="inline-flex items-center rounded-full bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-gold-foreground">Home</Link>
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
