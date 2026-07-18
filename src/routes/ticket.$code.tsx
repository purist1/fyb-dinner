import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import QRCode from "qrcode";
import { useServerFn } from "@tanstack/react-start";
import {
  getTicketByCode,
  verifyPaystackPayment,
  type PublicTicket,
} from "@/lib/registrations.functions";
import { EVENT, formatEventDate } from "@/lib/event";
import { Calendar, Clock, MapPin, CheckCircle2, Loader2, Download, User, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ticket/$code")({
  component: TicketPage,
  validateSearch: (s: Record<string, unknown>) => ({
    verify: typeof s.verify === "string" ? s.verify : undefined,
    reference: typeof s.reference === "string" ? s.reference : undefined,
    trxref: typeof s.trxref === "string" ? s.trxref : undefined,
  }),
});

function TicketPage() {
  const { code } = Route.useParams();
  const s = useSearch({ from: "/ticket/$code" });
  const verify = useServerFn(verifyPaystackPayment);
  const fetchTicket = useServerFn(getTicketByCode);
  const [reg, setReg] = useState<PublicTicket | null>(null);
  const [qr, setQr] = useState<string>("");
  const [venue, setVenue] = useState("To Be Announced");
  const [eventDate, setEventDate] = useState(EVENT.dateISO);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function loadTicket() {
    setLoadError(null);
    const ticket = await fetchTicket({ data: { ticket_code: code } });
    setReg(ticket);
    if (ticket) {
      const png = await QRCode.toDataURL(ticket.ticket_code, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 320,
        color: { dark: "#1a0b2e", light: "#f7e6b6" },
      });
      setQr(png);
    }
  }

  async function loadSettings() {
    try {
      const { data: settings } = await supabase.from("event_settings").select("key, value");
      if (settings) {
        const venueVal = settings.find((r) => r.key === "venue")?.value;
        const dateVal = settings.find((r) => r.key === "event_date")?.value;
        if (venueVal) setVenue(venueVal);
        if (dateVal) setEventDate(dateVal);
      }
    } catch (err) {
      console.warn("[TicketPage] Could not load event settings:", err);
    }
  }

  useEffect(() => {
    (async () => {
      const ref = s.reference || s.trxref;
      if (s.verify || ref) {
        setVerifying(true);
        try {
          if (ref) {
            const r = await verify({ data: { reference: ref } });
            if (r.paid) toast.success("Payment confirmed! Loading your ticket…");
            else toast.error("Payment verification returned unpaid status.");
          }
        } catch (err) {
          console.error("[TicketPage] verify() threw:", err);
          toast.error("Could not verify payment", {
            description: err instanceof Error ? err.message : String(err),
          });
        } finally {
          setVerifying(false);
        }
      }

      try {
        await Promise.all([loadTicket(), loadSettings()]);
      } catch (err) {
        console.error("[TicketPage] loadTicket() threw:", err);
        setLoadError(err instanceof Error ? err.message : "Could not load ticket");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, s.reference, s.trxref, s.verify]);

  const paid = reg?.payment_status === "paid" || reg?.payment_status === "free";
  const formatted = formatEventDate(eventDate);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your ticket…
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-destructive/60 bg-card p-8 text-center">
            <h2 className="font-serif text-2xl text-destructive">Could not load ticket</h2>
            <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                void loadTicket().finally(() => setLoading(false));
              }}
              className="mt-6 inline-flex rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-semibold text-gold-foreground"
            >
              Try again
            </button>
          </div>
        ) : !reg ? (
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
            <h2 className="font-serif text-2xl">Ticket not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">This ticket code doesn't exist.</p>
            <Link
              to="/register"
              className="mt-6 inline-flex rounded-full bg-gradient-gold px-6 py-2.5 text-sm font-semibold text-gold-foreground"
            >
              Register
            </Link>
          </div>
        ) : (
          <div className="relative">
            <style
              dangerouslySetInnerHTML={{
                __html: `
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
            `,
              }}
            />

            {verifying && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-gold/40 bg-card p-3 text-sm text-gold no-print">
                <Loader2 className="h-4 w-4 animate-spin" /> Verifying payment…
              </div>
            )}

            {!paid ? (
              <div className="rounded-2xl border border-destructive/60 bg-card p-8 text-center no-print">
                <h2 className="font-serif text-2xl text-destructive">Payment Pending</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your ticket will unlock once your payment is confirmed. If you just paid, refresh in a moment.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    void loadTicket().finally(() => setLoading(false));
                  }}
                  className="mt-4 inline-flex rounded-full border border-gold/40 px-6 py-2.5 text-sm font-semibold"
                >
                  Refresh ticket
                </button>
              </div>
            ) : (
              <div
                id="ticket"
                className="relative mx-auto max-w-md overflow-hidden rounded-[2.5rem] border-4 border-double border-gold/45 bg-gradient-royal p-6 shadow-elegant sm:p-8"
              >
                <div className="pointer-events-none absolute left-0 top-0 h-32 w-32 rounded-full bg-gold/10 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
                <div className="pointer-events-none absolute inset-2 rounded-[2rem] border border-gold/25" />

                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="mb-3 h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-gold/60 bg-white shadow-gold">
                    <img src="/nifes.jpeg" alt="NIFES Logo" className="h-full w-full object-cover" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
                    {EVENT.orgShort} · {EVENT.chapter}
                  </div>
                  <h2 className="mt-1 font-serif text-2xl font-black uppercase tracking-wider text-gradient-gold">
                    FYB DINNER & AWARDS
                  </h2>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                    Finalist Sent Forth · {EVENT.year}
                  </div>
                </div>

                <div className="relative my-6 flex w-full items-center">
                  <div className="ticket-notch absolute left-[-33px] z-10 h-8 w-8 rounded-full border-r border-gold/30 bg-background sm:left-[-41px]" />
                  <div className="flex-grow border-t-2 border-dashed border-gold/30" />
                  <div className="ticket-notch absolute right-[-33px] z-10 h-8 w-8 rounded-full border-l border-gold/30 bg-background sm:right-[-41px]" />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-5 flex justify-center">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-gold bg-background/50 shadow-gold">
                      {reg.passport_url ? (
                        <img src={reg.passport_url} alt={reg.full_name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-background/40">
                          {reg.attendee_type === "fyb" ? (
                            <GraduationCap className="h-12 w-12 text-gold/80" />
                          ) : (
                            <User className="h-12 w-12 text-gold/80" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-[-10px] rounded-full border border-gold/20 bg-gradient-gold px-4 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-gold-foreground shadow-md">
                      {reg.attendee_type === "fyb" ? "Finalist (FYB)" : "Guest"}
                    </div>
                  </div>

                  <div className="mt-3 text-center">
                    <div className="font-serif text-3xl font-extrabold leading-tight tracking-wide text-foreground">
                      {reg.full_name}
                    </div>
                    {reg.attendee_type === "fyb" && reg.department && (
                      <div className="mt-2 text-xs font-medium uppercase tracking-wider text-gold">
                        {reg.department}
                        {reg.course ? ` · ${reg.course}` : ""}
                      </div>
                    )}
                    <div className="mt-1 font-mono text-[11px] tracking-wide text-muted-foreground">{reg.email}</div>
                  </div>
                </div>

                <div className="relative z-10 mt-6 rounded-2xl border border-gold/25 bg-background/30 p-4 backdrop-blur-sm">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="flex flex-col items-center">
                      <Calendar className="mb-1 h-4 w-4 text-gold" />
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Date</span>
                      <span className="mt-0.5 text-[10px] font-bold text-foreground">{formatted.shortDate}</span>
                    </div>
                    <div className="flex flex-col items-center border-x border-gold/15 px-1">
                      <Clock className="mb-1 h-4 w-4 text-gold" />
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Time</span>
                      <span className="mt-0.5 text-[10px] font-bold text-foreground">{formatted.time}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MapPin className="mb-1 h-4 w-4 text-gold" />
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Venue</span>
                      <span className="mt-0.5 line-clamp-1 w-full truncate text-[10px] font-bold text-foreground">
                        {venue}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative my-5 flex w-full items-center sm:my-6">
                  <div className="ticket-notch absolute left-[-25px] z-10 h-6 w-6 rounded-full border-r border-gold/30 bg-background sm:left-[-33px] sm:h-8 sm:w-8" />
                  <div className="flex-grow border-t-2 border-dashed border-gold/30" />
                  <div className="ticket-notch absolute right-[-25px] z-10 h-6 w-6 rounded-full border-l border-gold/30 bg-background sm:right-[-33px] sm:h-8 sm:w-8" />
                </div>

                <div className="relative z-10 flex flex-col items-center justify-between gap-6 sm:flex-row">
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
                      TICKET ACCESS CODE
                    </span>
                    <span className="mt-0.5 font-mono text-base font-black tracking-widest text-gold">
                      {reg.ticket_code}
                    </span>
                    <div className="mt-3 flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{reg.payment_status === "free" ? "Paid Offline" : "Access Granted"}</span>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 flex-col items-center rounded-2xl border-2 border-gold/40 bg-white p-2 shadow-elegant">
                    {qr && <img src={qr} alt="QR Access Pass" width={100} height={100} className="rounded-lg" />}
                    <span className="mt-1 font-mono text-[7px] font-bold uppercase tracking-widest text-slate-800">
                      Scan at Entry Gate
                    </span>
                  </div>
                </div>

                <div className="mt-6 text-center font-serif text-[9px] font-bold uppercase tracking-[0.5em] text-gold/45">
                  ★ Admit One Finalist Pass ★
                </div>
              </div>
            )}

            <div className="no-print mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/40 bg-card px-6 py-3.5 text-sm font-semibold text-foreground shadow-elegant transition hover:bg-card/60 sm:py-3"
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
