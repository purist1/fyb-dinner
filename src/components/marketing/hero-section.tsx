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
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-4 py-1.5 text-eyebrow text-gold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> 2026 Edition Concluded · Next Edition Loading
            </div>
          </Item>

          <Item {...itemProps}>
            <h1 className="mt-6 text-display font-bold leading-tight">
              <span className="block">FYB Dinner</span>
              <span className="block font-accent text-gradient-gold">&amp; Awards Night</span>
              <span className="mt-2 block text-2xl font-medium text-muted-foreground sm:text-3xl">
                Anticipate 2027
              </span>
            </h1>
          </Item>

          <Item {...itemProps}>
            <GoldDivider className="my-6" />
          </Item>

          <Item {...itemProps}>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-lg">
              The 2026 Dinner Night was an unforgettable celebration of praise, honour, and thanksgiving.
              Relive the highlights and anticipate another grand edition in 2027!
            </p>
          </Item>

          <Item {...itemProps}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs sm:gap-3 sm:text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/60 px-3.5 py-1.5 backdrop-blur border border-gold/20 text-gold">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> 2026 Edition Successfully Concluded
              </span>
            </div>
          </Item>

          <Item {...itemProps}>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <CeremonialButton to="/gallery" className="w-full sm:w-auto">
                Explore 2026 Gallery
              </CeremonialButton>
              <CeremonialButton href="#fyb-story" variant="secondary" className="w-full sm:w-auto">
                Relive Memories
              </CeremonialButton>
            </div>
          </Item>
        </Wrapper>
      </div>
    </section>
  );
}
