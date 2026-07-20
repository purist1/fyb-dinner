"use client";

import { useCallback, useEffect, useState } from "react";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { cn } from "@/lib/utils";

type GalleryItem = { id: string; image_url: string; caption: string | null };

function GalleryTile({ imageUrl, caption }: { imageUrl: string; caption: string | null }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-gold/25 bg-card shadow-elegant">
      <img
        src={imageUrl}
        alt={caption ?? "Gallery photo"}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        onError={() => setBroken(true)}
      />
      {caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
          <p className="text-sm text-foreground">{caption}</p>
        </div>
      )}
    </div>
  );
}

function GalleryCarousel({ items }: { items: GalleryItem[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const syncButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    syncButtons();
    emblaApi.on("select", syncButtons);
    emblaApi.on("reInit", syncButtons);
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => {
      clearInterval(interval);
      emblaApi.off("select", syncButtons);
      emblaApi.off("reInit", syncButtons);
    };
  }, [emblaApi, syncButtons]);

  return (
    <div className="relative mt-12">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex gap-4">
          {items.map((g) => (
            <div key={g.id} className="min-w-0 flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_32%]">
              <GalleryTile imageUrl={g.image_url} caption={g.caption} />
            </div>
          ))}
        </div>
      </div>
      {items.length > 1 && (
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-card transition hover:border-gold disabled:opacity-40"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5 text-gold" />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-card transition hover:border-gold disabled:opacity-40"
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5 text-gold" />
          </button>
        </div>
      )}
    </div>
  );
}

function GalleryEmptyState() {
  return (
    <div className="relative mt-12 overflow-hidden rounded-3xl border-2 border-dashed border-gold/30 bg-card/40 p-12 text-center">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className={cn(
              "absolute h-1.5 w-1.5 rounded-full bg-gold/40 animate-float",
              i === 0 && "left-[15%] top-[20%]",
              i === 1 && "right-[20%] top-[30%] [animation-delay:0.5s]",
              i === 2 && "left-[25%] bottom-[25%] [animation-delay:1s]",
              i === 3 && "right-[15%] bottom-[20%] [animation-delay:1.5s]",
              i === 4 && "left-[50%] top-[15%] [animation-delay:0.8s]",
              i === 5 && "right-[40%] bottom-[15%] [animation-delay:1.2s]",
            )}
          />
        ))}
      </div>
      <div className="relative mx-auto grid h-20 w-20 place-items-center rounded-full border-2 border-gold/40 bg-gradient-royal">
        <Camera className="h-9 w-9 text-gold" />
      </div>
      <h3 className="relative mt-6 font-serif text-2xl font-bold">Memories coming soon</h3>
      <p className="relative mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        Photos from past FYB Dinners and this year's celebration will be shared here after the
        event.
      </p>
    </div>
  );
}

export function GallerySection({ gallery }: { gallery: GalleryItem[] | undefined }) {
  const hasPhotos = gallery && gallery.length > 0;

  return (
    <section id="gallery" className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <ScrollReveal>
        <SectionHeading
          eyebrow="Gallery"
          title="Moments from past events"
          subtitle="A glimpse of fellowship, celebration, and send-forth."
        />
      </ScrollReveal>
      {hasPhotos ? <GalleryCarousel items={gallery} /> : <GalleryEmptyState />}
    </section>
  );
}
