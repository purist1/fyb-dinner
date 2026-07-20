"use client";

import { PROGRAMME } from "@/lib/programme";
import { ScrollReveal, StaggerItem, StaggerReveal } from "@/components/marketing/scroll-reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function ProgrammeSection() {
  const reduced = useReducedMotion();

  return (
    <section id="programme" className="bg-gradient-royal py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <ScrollReveal>
          <SectionHeading
            eyebrow="The Night"
            title="An evening in five movements"
            subtitle="From arrival to send-forth — here's how the celebration unfolds."
          />
        </ScrollReveal>

        <div className="relative mt-14">
          {!reduced && (
            <div
              className="absolute left-6 top-0 hidden h-full w-px origin-top bg-gold/30 md:left-1/2 md:block animate-draw-line"
              aria-hidden
            />
          )}

          <StaggerReveal className="grid gap-8 md:gap-0">
            {PROGRAMME.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <StaggerItem key={step.title}>
                  <div
                    className={`relative md:grid md:grid-cols-2 md:gap-8 ${!isLeft ? "md:[&>div:first-child]:order-2" : ""}`}
                  >
                    <div
                      className={`${isLeft ? "md:text-right md:pr-12" : "md:pl-12"} hidden md:block`}
                    >
                      {isLeft && (
                        <div className="inline-block rounded-2xl border border-gold/30 bg-background/40 p-6 backdrop-blur">
                          <div className="text-eyebrow text-gold">{step.time}</div>
                          <div className="mt-2 font-serif text-2xl font-bold">{step.title}</div>
                          <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="relative flex gap-4 md:contents">
                      <div className="flex flex-col items-center md:absolute md:left-1/2 md:top-6 md:-translate-x-1/2">
                        <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full border-2 border-gold/50 bg-background shadow-gold">
                          <step.icon className="h-5 w-5 text-gold" />
                        </div>
                      </div>

                      <div className="flex-1 rounded-2xl border border-gold/30 bg-background/40 p-5 backdrop-blur md:hidden">
                        <div className="text-eyebrow text-gold">{step.time}</div>
                        <div className="mt-2 font-serif text-xl font-bold">{step.title}</div>
                        <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>

                    <div
                      className={`${!isLeft ? "md:text-left md:pl-12" : "md:pr-12"} hidden md:block`}
                    >
                      {!isLeft && (
                        <div className="inline-block rounded-2xl border border-gold/30 bg-background/40 p-6 backdrop-blur">
                          <div className="text-eyebrow text-gold">{step.time}</div>
                          <div className="mt-2 font-serif text-2xl font-bold">{step.title}</div>
                          <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerReveal>
        </div>
      </div>
    </section>
  );
}
