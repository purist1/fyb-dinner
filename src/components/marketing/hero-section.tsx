"use client";

import { motion } from "motion/react";
import { Calendar, Clock, MapPin, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { Countdown } from "@/components/countdown";
import { CeremonialButton } from "@/components/marketing/ceremonial-button";
import { GoldDivider } from "@/components/marketing/gold-divider";
import { EVENT } from "@/lib/event";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type HeroSectionProps = {
  dateHuman: string;
  timeHuman: string;
  venue: string;
  eventDate: string;
};

export function HeroSection({ dateHuman, timeHuman, venue, eventDate }: HeroSectionProps) {
  const reduced = useReducedMotion();

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : 0.12 } },
  };
  const item = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  const Wrapper = reduced ? "div" : motion.div;
  const wrapperProps = reduced
    ? { className: "mx-auto max-w-3xl text-center" }
    : {
        className: "mx-auto max-w-3xl text-center",
        variants: container,
        initial: "hidden",
        animate: "visible",
      };

  const Item = reduced ? "div" : motion.div;
  const itemProps = reduced ? {} : { variants: item };

  return (
    <section className="relative min-h-[90dvh] overflow-hidden">
      <div
        className="hero-parallax absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[90dvh] max-w-6xl flex-col justify-center px-4 py-20 sm:py-28">
        <Wrapper {...wrapperProps}>
          <Item {...itemProps}>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/40 px-4 py-1.5 text-eyebrow text-gold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> {EVENT.orgShort} · {EVENT.chapter}
            </div>
          </Item>

          <Item {...itemProps}>
            <h1 className="mt-6 text-display font-bold leading-tight">
              <span className="block">FYB Dinner</span>
              <span className="block font-accent text-gradient-gold">& Awards Night</span>
              <span className="mt-2 block text-2xl font-medium text-muted-foreground sm:text-3xl">
                {EVENT.year}
              </span>
            </h1>
          </Item>

          <Item {...itemProps}>
            <GoldDivider className="my-6" />
          </Item>

          <Item {...itemProps}>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-lg">
              An elegant evening of celebration, honour, and thanksgiving as we send forth our
              finalists into the next chapter of God's calling.
            </p>
          </Item>

          <Item {...itemProps}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs sm:gap-3 sm:text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/60 px-3 py-1.5 backdrop-blur">
                <Calendar className="h-3.5 w-3.5 text-gold" /> {dateHuman}
              </span>
              {timeHuman && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/60 px-3 py-1.5 backdrop-blur">
                  <Clock className="h-3.5 w-3.5 text-gold" /> {timeHuman}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/60 px-3 py-1.5 backdrop-blur">
                <MapPin className="h-3.5 w-3.5 text-gold" /> {venue}
              </span>
            </div>
          </Item>

          <Item {...itemProps}>
            <p className="mt-8 text-eyebrow text-muted-foreground">Until the celebration begins</p>
            <div className="mt-3">
              <Countdown iso={eventDate} />
            </div>
          </Item>

          <Item {...itemProps}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <CeremonialButton to="/register" className="w-full sm:w-auto">
                Reserve Your Seat
              </CeremonialButton>
              <CeremonialButton href="#programme" variant="secondary" className="w-full sm:w-auto">
                Explore the Night
              </CeremonialButton>
            </div>
          </Item>
        </Wrapper>
      </div>
    </section>
  );
}
