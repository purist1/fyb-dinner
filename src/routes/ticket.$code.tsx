import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import QRCode from "qrcode";
import { useServerFn } from "@tanstack/react-start";
import { verifyPaystackPayment } from "@/lib/registrations.functions";
import { EVENT } from "@/lib/event";
import { Calendar, Clock, MapPin, CheckCircle2, Loader2, Sparkles, Download, User, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ticket/$code")({
  component: TicketPage,
  validateSearch: (s: Record<string, unknown>) => ({
    verify: typeof s.verify === "string" ? s.verify : undefined,
    reference: typeof s.reference === "string" ? s.reference : undefined,
    trxref: typeof s.trxref === "string" ? s.trxref : undefined,
  }),
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

function formatEventDate(isoString: string) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: "To Be Announced", time: "", shortDate: "To Be Announced" };
    const dateStr = d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const shortDateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return { date: dateStr, time: timeStr, shortDate: shortDateStr };
  } catch {
    return { date: "To Be Announced", time: "", shortDate: "To Be Announced" };
  }
}

function TicketPage() {
  const { code } = Route.useParams();
  const s = useSearch({ from: "/ticket/$code" });
  const verify = useServerFn(verifyPaystackPayment);
  const [reg, setReg] = useState<Registration | null>(null);
  const [qr, setQr] = useState<string>("");
  const [venue, setVenue] = useState("To Be Announced");
  const [eventDate, setEventDate] = useState(EVENT.dateISO);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  async function load() {
    const { data } = await supabase
      .rpc("get_ticket_by_code", { p_ticket_code: code });
    
    const ticket = Array.isArray(data) ? (data[0] || null) : (data || null);
    setReg(ticket as any);
    if (ticket) {
      const png = await QRCode.toDataURL(ticket.ticket_code, { errorCorrectionLevel: "H", margin: 1, width: 320, color: { dark: "#1a0b2e", light: "#f7e6b6" } });
      setQr(png);
    }
    const { data: settings } = await supabase.from("event_settings").select("key, value");
    if (settings) {
      const venueVal = settings.find(r => r.key === "venue")?.value;
      const dateVal = settings.find(r => r.key === "event_date")?.value;
      if (venueVal) setVenue(venueVal);
      if (dateVal) setEventDate(dateVal);
    }
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      console.log("[TicketPage] useEffect fired. search params:", s);
      if (s.verify || s.reference || s.trxref) {
        setVerifying(true);
        const ref = s.reference || s.trxref;
        console.log("[TicketPage] Verifying payment with reference:", ref);
        try {
          if (ref) {
            const r = await verify({ data: { reference: ref } });
            console.log("[TicketPage] verifyPaystackPayment result:", r);
            if (r.paid) toast.success("Payment confirmed! Loading your ticket…");
            else toast.error("Payment verification returned unpaid status.");
          }
        } catch (err) {
          console.error("[TicketPage] verify() threw:", err);
          toast.error("Could not verify payment", { description: err instanceof Error ? err.message : String(err) });
        }
        setVerifying(false);
      }
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, s.reference, s.trxref]);


  const paid = reg?.payment_status === "paid" || reg?.payment_status === "free";
  const formatted = formatEventDate(eventDate);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your ticket…</div>
        ) : !reg ? (
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
            <h2 className="font-serif text-2xl">Ticket not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">This ticket code doesn't exist.</p>
            <Link to="/register" className="mt-6 inline-flex rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-semibold text-gold-foreground">Register</Link>
          </div>
        ) : (
          <div className="relative">
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body {
                  background: #0d0614 !important;
                  color: #ffffff !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                header, footer, nav, button, a, .no-print {
                  display: none !important;
                }
                section {
                  padding: 0 !important;
                  margin: 0 !important;
                }
                #ticket {
                  box-shadow: none !important;
                  border: 4px double #dfc380 !important;
                  background: linear-gradient(135deg, #17072a, #2b0e45) !important;
                  color: #ffffff !important;
                  margin: 40px auto !important;
                  page-break-inside: avoid;
                  width: 440px !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .ticket-notch {
                  background: #0d0614 !important;
                  border-color: #dfc380 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}} />

            {verifying && (
              <div className="mb-4 rounded-lg border border-gold/40 bg-card p-3 text-sm text-gold flex items-center gap-2 no-print">
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying payment…
              </div>
            )}

            {!paid ? (
              <div className="rounded-2xl border border-destructive/60 bg-card p-8 text-center no-print">
                <h2 className="font-serif text-2xl text-destructive">Payment Pending</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your ticket will unlock once your payment is confirmed. If you just paid, refresh in a moment.
                </p>
              </div>
            ) : (
              <div 
                id="ticket" 
                className="mx-auto max-w-md overflow-hidden rounded-[2.5rem] border-4 border-double border-gold/45 bg-gradient-royal shadow-elegant p-6 sm:p-8 relative"
              >
                {/* Visual glow accents */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

                {/* Card border framing */}
                <div className="absolute inset-2 border border-gold/25 rounded-[2rem] pointer-events-none" />

                {/* HEADER SECTION */}
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-gold/60 bg-white shadow-gold mb-3 flex-shrink-0">
                    <img src="/nifes.jpeg" alt="NIFES Logo" className="h-full w-full object-cover" />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-gold font-bold">
                    {EVENT.orgShort} · {EVENT.chapter}
                  </div>
                  <h2 className="mt-1 font-serif text-2xl font-black tracking-wider text-gradient-gold uppercase">
                    FYB DINNER & AWARDS
                  </h2>
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
                    Finalist Sent Forth · {EVENT.year}
                  </div>
                </div>

                {/* classic ticket cutouts (notches) */}
                <div className="w-full flex items-center my-6 relative">
                  <div className="ticket-notch absolute left-[-33px] sm:left-[-41px] h-8 w-8 rounded-full bg-background border-r border-gold/30 z-10" />
                  <div className="border-t-2 border-dashed border-gold/30 flex-grow" />
                  <div className="ticket-notch absolute right-[-33px] sm:right-[-41px] h-8 w-8 rounded-full bg-background border-l border-gold/30 z-10" />
                </div>

                {/* ATTENDEE DETAIL SECTION */}
                <div className="flex flex-col items-center relative z-10">
                  <div className="relative mb-5 flex justify-center">
                    <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-gold bg-background/50 flex items-center justify-center shadow-gold">
                      {reg.passport_url ? (
                        <img src={reg.passport_url} alt={reg.full_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-background/40">
                          {reg.attendee_type === "fyb" ? (
                            <GraduationCap className="h-12 w-12 text-gold/80" />
                          ) : (
                            <User className="h-12 w-12 text-gold/80" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-[-10px] bg-gradient-gold text-gold-foreground text-[9px] font-black uppercase tracking-[0.15em] px-4 py-1 rounded-full shadow-md border border-gold/20">
                      {reg.attendee_type === "fyb" ? "Finalist (FYB)" : "Guest"}
                    </div>
                  </div>

                  <div className="text-center mt-3">
                    <div className="font-serif text-3xl font-extrabold tracking-wide text-foreground leading-tight">
                      {reg.full_name}
                    </div>
                    {reg.attendee_type === "fyb" && reg.department && (
                      <div className="mt-2 text-xs uppercase tracking-wider text-gold font-medium">
                        {reg.department}
                        {reg.course ? ` · ${reg.course}` : ""}
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground mt-1 font-mono tracking-wide">
                      {reg.email}
                    </div>
                  </div>
                </div>

                {/* EVENT SCHEDULER INFOGRAPHIC */}
                <div className="mt-6 border border-gold/25 bg-background/30 p-4 rounded-2xl relative z-10 backdrop-blur-sm">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col items-center">
                      <Calendar className="h-4 w-4 text-gold mb-1" />
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Date</span>
                      <span className="text-[10px] font-bold text-foreground mt-0.5">{formatted.shortDate}</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-gold/15 px-1">
                      <Clock className="h-4 w-4 text-gold mb-1" />
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Time</span>
                      <span className="text-[10px] font-bold text-foreground mt-0.5">{formatted.time}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MapPin className="h-4 w-4 text-gold mb-1" />
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Venue</span>
                      <span className="text-[10px] font-bold text-foreground mt-0.5 line-clamp-1 truncate w-full">{venue}</span>
                    </div>
                  </div>
                </div>

                {/* classic ticket notches */}
                <div className="w-full flex items-center my-5 relative sm:my-6">
                  <div className="ticket-notch absolute left-[-25px] h-6 w-6 rounded-full bg-background border-r border-gold/30 z-10 sm:left-[-33px] sm:h-8 sm:w-8" />
                  <div className="border-t-2 border-dashed border-gold/30 flex-grow" />
                  <div className="ticket-notch absolute right-[-25px] h-6 w-6 rounded-full bg-background border-l border-gold/30 z-10 sm:right-[-33px] sm:h-8 sm:w-8" />
                </div>

                {/* QR SCAN CODE & VERIFICATION FOOTER */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="text-center sm:text-left flex flex-col items-center sm:items-start">
                    <span className="text-[8px] uppercase tracking-widest text-muted-foreground font-mono">TICKET ACCESS CODE</span>
                    <span className="font-mono text-base font-black text-gold tracking-widest mt-0.5">{reg.ticket_code}</span>
                    <div className="mt-3 flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] text-gold font-semibold uppercase tracking-wider">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{reg.payment_status === "free" ? "Paid Offline" : "Access Granted"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center bg-white p-2 rounded-2xl shadow-elegant border-2 border-gold/40 flex-shrink-0">
                    {qr && <img src={qr} alt="QR Access Pass" width={100} height={100} className="rounded-lg" />}
                    <span className="text-[7px] font-mono text-slate-800 tracking-widest mt-1 uppercase font-bold">
                      Scan at Entry Gate
                    </span>
                  </div>
                </div>

                {/* ADMIT ONE FOIL TEXT */}
                <div className="mt-6 text-[9px] font-serif uppercase tracking-[0.5em] text-gold/45 text-center font-bold">
                  ★ Admit One Finalist Pass ★
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col items-stretch gap-3 no-print sm:flex-row sm:justify-center">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition hover:bg-card/60 shadow-elegant sm:py-3"
              >
                <Download className="h-4 w-4 text-gold" /> Print / Save PDF
              </button>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-full bg-gradient-gold px-6 py-3.5 text-sm font-semibold text-gold-foreground shadow-gold transition hover:opacity-90 sm:py-3"
              >
                Return Home
              </Link>
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
