import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Sparkles, Trophy, Users, Heart, Mail, Phone } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Countdown } from "@/components/countdown";
import { EVENT } from "@/lib/event";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({ component: Landing });

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

function useGallery() {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data } = await supabase.from("gallery").select("*").order("sort_order", { ascending: true });
      return data ?? [];
    },
  });
}

function Landing() {
  const { data: settings } = useSettings();
  const { data: gallery } = useGallery();
  const venue = settings?.venue ?? "To Be Announced";
  const eventDate = settings?.event_date ?? EVENT.dateISO;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28 md:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/40 px-4 py-1.5 text-xs uppercase tracking-widest text-gold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> {EVENT.orgShort} · {EVENT.chapter}
            </div>
            <h1 className="mt-6 font-serif text-4xl font-bold leading-tight sm:text-6xl md:text-7xl">
              <span className="block">FYB Dinner</span>
              <span className="block text-gradient-gold">& Awards Night</span>
              <span className="mt-2 block text-2xl font-medium text-muted-foreground sm:text-3xl">{EVENT.year}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              An elegant evening of celebration, honour, and thanksgiving as we send forth our finalists into the next chapter of God's calling.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/60 px-3 py-1.5 backdrop-blur"><Calendar className="h-4 w-4 text-gold" /> {EVENT.dateHuman}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/60 px-3 py-1.5 backdrop-blur"><Clock className="h-4 w-4 text-gold" /> {EVENT.timeHuman}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/60 px-3 py-1.5 backdrop-blur"><MapPin className="h-4 w-4 text-gold" /> {venue}</span>
            </div>

            <div className="mt-10">
              <Countdown iso={eventDate} />
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="rounded-full bg-gradient-gold px-8 py-3 text-sm font-semibold text-gold-foreground shadow-gold transition hover:opacity-90">
                Register Now
              </Link>
              <a href="#details" className="rounded-full border border-gold/40 px-8 py-3 text-sm font-semibold text-foreground transition hover:bg-card/60">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-xs uppercase tracking-widest text-gold">About the Event</div>
            <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">A night to honour God and celebrate His faithfulness</h2>
            <p className="mt-4 text-muted-foreground">
              The FYB Dinner & Awards Night is the crowning event of the academic year for the {EVENT.orgShort} family at {EVENT.chapter}. It brings together our finalists, executives, alumni, and friends for an evening of worship, fellowship, fine dining, and awards that honour dedication and service.
            </p>
            <p className="mt-3 text-muted-foreground">
              This is more than a dinner — it is a commissioning, a thanksgiving, and a family gathering as we send forth another set of students into the world for Christ.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Heart, title: "Worship", body: "Praise and reflection as one body." },
              { icon: Trophy, title: "Awards", body: "Honouring servants and finalists." },
              { icon: Users, title: "Fellowship", body: "Family, alumni, and friends." },
              { icon: Sparkles, title: "Fine Dining", body: "An elegant three-course evening." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border/60 bg-card/60 p-5">
                <f.icon className="h-6 w-6 text-gold" />
                <div className="mt-3 font-serif text-lg">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILS */}
      <section id="details" className="bg-gradient-royal py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-xs uppercase tracking-widest text-gold">Event Details</div>
            <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">Save the date</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Calendar, label: "Date", value: EVENT.dateHuman },
              { icon: Clock, label: "Time", value: EVENT.timeHuman },
              { icon: MapPin, label: "Venue", value: venue },
            ].map((d) => (
              <div key={d.label} className="rounded-2xl border border-gold/30 bg-background/40 p-6 text-center backdrop-blur">
                <d.icon className="mx-auto h-7 w-7 text-gold" />
                <div className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">{d.label}</div>
                <div className="mt-1 font-serif text-xl">{d.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs uppercase tracking-widest text-gold">Gallery</div>
          <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">Moments from past events</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {(gallery && gallery.length > 0) ? gallery.map((g: { id: string; image_url: string; caption: string | null }) => (
            <div key={g.id} className="group aspect-square overflow-hidden rounded-xl border border-border/60 bg-card">
              <img src={g.image_url} alt={g.caption ?? ""} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
            </div>
          )) : Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl border border-dashed border-border/60 bg-card/40" />
          ))}
        </div>
        {(!gallery || gallery.length === 0) && (
          <p className="mt-6 text-center text-sm text-muted-foreground">Photos from the night will be shared here after the event.</p>
        )}
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-card/30 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-gold">FAQ</div>
            <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
          </div>
          <Accordion type="single" collapsible className="mt-8">
            {[
              { q: "Who can attend?", a: "The event is open to all finalists (FYB) of NIFES CUSTECH Osara, and to invited guests including alumni, friends of the fellowship, and family members." },
              { q: "How much does it cost?", a: `FYB registration is ₦${settings?.fyb_price_naira ?? "7,000"}. Guest registration is ₦${settings?.guest_price_naira ?? "5,000"}.` },
              { q: "How do I know if my FYB payment is recognised?", a: "During registration, enter the Registration ID given to you when you paid at the fellowship office. If it is on the paid list, you will be sent straight to your digital ticket." },
              { q: "Can I pay online?", a: "Yes. Both FYB and guest registration support secure online payment via Paystack." },
              { q: "What is the dress code?", a: "Elegant/formal — think dinner suits, gowns, and native attire in classy tones." },
              { q: "Where is the venue?", a: "The exact venue will be announced closer to the date. Registered attendees will receive an update by email and on the platform." },
            ].map((f, i) => (
              <AccordionItem key={i} value={`i${i}`} className="border-border/40">
                <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="text-xs uppercase tracking-widest text-gold">Contact</div>
        <h2 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">Get in touch</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Questions about registration, tickets, or the programme? Reach out to the FYB Dinner planning committee.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={`mailto:${EVENT.contactEmail}`} className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-5 py-2.5 text-sm hover:bg-card"><Mail className="h-4 w-4 text-gold" /> {EVENT.contactEmail}</a>
          <a href={`tel:${EVENT.contactPhone}`} className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-5 py-2.5 text-sm hover:bg-card"><Phone className="h-4 w-4 text-gold" /> {EVENT.contactPhone}</a>
        </div>
        <div className="mt-10">
          <Link to="/register" className="rounded-full bg-gradient-gold px-8 py-3 text-sm font-semibold text-gold-foreground shadow-gold hover:opacity-90">
            Reserve your seat
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
