import { Heart, Sparkles, Trophy, Users } from "lucide-react";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/marketing/scroll-reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EVENT } from "@/lib/event";

const pillars = [
  { icon: Heart, title: "Worship", body: "Praise and reflection as one body before the Lord." },
  {
    icon: Trophy,
    title: "Awards",
    body: "Honouring dedicated servants and outstanding finalists.",
  },
  { icon: Users, title: "Fellowship", body: "Family, alumni, and friends united in celebration." },
  { icon: Sparkles, title: "Fine Dining", body: "An elegant three-course evening of hospitality." },
];

export function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <ScrollReveal>
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <SectionHeading
              eyebrow="About the Event"
              title="A night to honour God and celebrate His faithfulness"
              align="left"
            />
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
              The FYB Dinner & Awards Night is the crowning event of the academic year for the{" "}
              {EVENT.orgShort} family at {EVENT.chapter}. It brings together our finalists,
              executives, alumni, and friends for an evening of worship, fellowship, fine dining,
              and awards that honour dedication and service.
            </p>
          </div>

          <StaggerReveal className="grid grid-cols-2 gap-3 sm:gap-4">
            {pillars.map((f) => (
              <StaggerItem key={f.title}>
                <div className="group h-full rounded-2xl border border-gold/20 bg-card/60 p-5 transition hover:border-gold/50 hover:shadow-gold sm:p-6">
                  <div className="border-t-2 border-gold/60 pt-1">
                    <f.icon className="mt-3 h-6 w-6 text-gold transition group-hover:scale-110" />
                  </div>
                  <div className="mt-3 font-serif text-lg font-semibold sm:text-xl">{f.title}</div>
                  <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    {f.body}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      </ScrollReveal>
    </section>
  );
}
