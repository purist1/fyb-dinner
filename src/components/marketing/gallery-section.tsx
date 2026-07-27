"use client";

import { Camera, Sparkles, ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { CeremonialButton } from "@/components/marketing/ceremonial-button";
import { Badge } from "@/components/ui/badge";

export function GallerySection({ gallery }: { gallery?: any[] }) {
  const photoCount = gallery?.length ?? 0;

  return (
    <section id="gallery" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <ScrollReveal>
        <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-card/60 p-8 sm:p-12 shadow-2xl backdrop-blur">
          <div
            className="pointer-events-none absolute right-0 top-0 h-80 w-80 translate-x-1/3 -translate-y-1/3 rounded-full bg-gold/10 blur-3xl"
            aria-hidden
          />

          <div className="relative flex flex-col items-center text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full border border-gold/40 bg-gradient-royal text-gold shadow-lg">
              <Camera className="h-8 w-8 text-gold" />
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge variant="outline" className="border-gold/50 bg-gold/5 text-gold text-xs px-3 py-1">
                <Sparkles className="mr-1.5 h-3 w-3" /> 2026 Dinner Night
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground text-xs px-3 py-1">
                2025 Edition
              </Badge>
            </div>

            <h2 className="mt-6 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Official Gala <span className="text-gradient-gold">Gallery Archives</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Explore high-resolution photo albums from the 2026 Dinner Night and 2025 Edition in our dedicated photo gallery.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <CeremonialButton to="/gallery" className="w-full sm:w-auto">
                Explore Full Gallery ({photoCount > 0 ? `${photoCount} Photos` : "View All"}) <ArrowRight className="ml-2 h-4 w-4" />
              </CeremonialButton>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
