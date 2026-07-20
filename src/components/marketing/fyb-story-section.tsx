import { GraduationCap } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EVENT } from "@/lib/event";

export function FybStorySection() {
  return (
    <section id="story" className="bg-surface-cream py-16 text-surface-cream-foreground sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <ScrollReveal>
          <SectionHeading
            eyebrow="What is FYB?"
            title="A commissioning, a thanksgiving, a family gathering"
            align="left"
            tone="cream"
            className="max-w-3xl"
          />
        </ScrollReveal>

        <div className="mt-12 grid gap-10 md:grid-cols-5 md:items-center">
          <ScrollReveal className="md:col-span-3" delay={0.1}>
            <blockquote className="border-l-4 border-gold/60 pl-6 font-accent text-2xl leading-relaxed text-surface-cream-foreground/90 sm:text-3xl">
              "This is more than a dinner — it is a commissioning, a thanksgiving, and a family
              gathering as we send forth another set of students into the world for Christ."
            </blockquote>
            <p className="mt-6 text-sm leading-relaxed text-surface-cream-foreground/75 sm:text-base">
              Final Year Blessing (FYB) marks the end of one chapter and the beginning of another.
              Each year, {EVENT.orgShort} {EVENT.chapter} gathers to honour those who have served
              faithfully, celebrate those completing their studies, and commit them to God's purpose
              beyond the campus.
            </p>
          </ScrollReveal>

          <ScrollReveal className="md:col-span-2" delay={0.2}>
            <div className="relative mx-auto flex max-w-xs flex-col items-center rounded-3xl border-2 border-double border-gold/40 bg-white/60 p-10 text-center shadow-elegant">
              <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-gold/50 bg-gradient-gold text-gold-foreground shadow-gold">
                <GraduationCap className="h-10 w-10" />
              </div>
              <p className="mt-6 font-serif text-xl font-bold">Sent Forth</p>
              <p className="mt-2 text-sm text-surface-cream-foreground/70">
                Finalists commissioned into ministry, career, and life beyond CUSTECH.
              </p>
              <div className="mt-6 text-eyebrow text-gold">FYB {EVENT.year}</div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
