import { Mail, Phone } from "lucide-react";
import { CeremonialButton } from "@/components/marketing/ceremonial-button";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EVENT } from "@/lib/event";

export function ContactSection() {
  return (
    <section id="contact" className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
      <ScrollReveal>
        <SectionHeading
          eyebrow="Contact"
          title="Questions? We're here."
          subtitle="Reach out to the FYB Dinner planning committee about registration, tickets, or the programme."
        />
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={`mailto:${EVENT.contactEmail}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 bg-card/60 px-5 py-3 text-sm transition hover:border-gold hover:bg-card sm:w-auto"
          >
            <Mail className="h-4 w-4 text-gold" /> {EVENT.contactEmail}
          </a>
          <a
            href={`tel:${EVENT.contactPhone}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/40 bg-card/60 px-5 py-3 text-sm transition hover:border-gold hover:bg-card sm:w-auto"
          >
            <Phone className="h-4 w-4 text-gold" /> {EVENT.contactPhone}
          </a>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <div className="mt-14 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-royal p-8 shadow-gold sm:p-10">
          <h3 className="font-serif text-2xl font-bold sm:text-3xl">Don't miss the night</h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Seats are limited. Secure your place at the FYB Dinner & Awards Night {EVENT.year}.
          </p>
          <div className="mt-6">
            <CeremonialButton to="/register">Reserve Your Seat</CeremonialButton>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
