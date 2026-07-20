import { Calendar, Clock, MapPin, Shirt } from "lucide-react";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/marketing/scroll-reveal";
import { SectionHeading } from "@/components/marketing/section-heading";

type EventDetailsSectionProps = {
  dateHuman: string;
  timeHuman: string;
  venue: string;
};

export function EventDetailsSection({ dateHuman, timeHuman, venue }: EventDetailsSectionProps) {
  const details = [
    { icon: Calendar, label: "Date", value: dateHuman },
    { icon: Clock, label: "Time", value: timeHuman || "To Be Announced" },
    { icon: MapPin, label: "Venue", value: venue },
    { icon: Shirt, label: "Dress Code", value: "Elegant / Formal Attire" },
  ];

  return (
    <section id="details" className="bg-surface-cream py-16 text-surface-cream-foreground sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <ScrollReveal>
          <SectionHeading eyebrow="Event Details" title="Join us on" tone="cream" />
        </ScrollReveal>

        <StaggerReveal className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {details.map((d) => (
            <StaggerItem key={d.label}>
              <div className="group rounded-2xl border-2 border-gold/30 bg-white/70 p-6 text-center shadow-elegant transition hover:-translate-y-1 hover:border-gold/60 hover:shadow-gold">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-surface-cream">
                  <d.icon className="h-6 w-6 text-gold transition group-hover:scale-110" />
                </div>
                <div className="mt-4 text-eyebrow text-surface-cream-foreground/60">{d.label}</div>
                <div className="mt-2 font-serif text-lg font-bold leading-snug">{d.value}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
