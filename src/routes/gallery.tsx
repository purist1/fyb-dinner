import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Camera, Sparkles, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gallery")({ component: GalleryPage });

type GalleryItem = {
  id: string;
  image_url: string;
  caption: string | null;
  edition?: string | null;
  created_at: string;
  sort_order: number;
};

function useGallery() {
  return useQuery({
    queryKey: ["full-gallery"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });
      return (data as GalleryItem[]) ?? [];
    },
  });
}

function GalleryPage() {
  const { data: items = [], isLoading } = useGallery();
  const [activeTab, setActiveTab] = useState<"all" | "2026" | "2025">("all");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Categorize items into editions (defaulting nulls to '2025' or '2026' intelligently)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const edition = item.edition || (new Date(item.created_at).getFullYear() >= 2026 ? "2026" : "2025");
      if (activeTab === "all") return true;
      if (activeTab === "2026") return edition === "2026";
      if (activeTab === "2025") return edition === "2025";
      return true;
    });
  }, [items, activeTab]);

  const activePhoto = selectedIndex !== null ? filteredItems[selectedIndex] : null;

  const handlePrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Gallery Hero Header */}
        <section className="relative overflow-hidden border-b border-border/40 bg-card/40 py-16 sm:py-24">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-5xl px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/60 px-4 py-1.5 text-xs text-gold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> NIFES FYB Dinner Archives
            </div>
            <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-5xl">
              Memories &amp; <span className="text-gradient-gold">Gala Gallery</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Relive the unforgettable moments of fellowship, thanksgiving, and glamour from our Dinner &amp; Awards Nights.
            </p>

            {/* Edition Filter Tabs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("all")}
                className={cn(activeTab === "all" ? "bg-gradient-gold text-gold-foreground font-semibold" : "border-border/60")}
              >
                All Moments ({items.length})
              </Button>
              <Button
                variant={activeTab === "2026" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("2026")}
                className={cn(activeTab === "2026" ? "bg-gradient-gold text-gold-foreground font-semibold" : "border-border/60")}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-gold" />
                2026 Dinner Night
              </Button>
              <Button
                variant={activeTab === "2025" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("2025")}
                className={cn(activeTab === "2025" ? "bg-gradient-gold text-gold-foreground font-semibold" : "border-border/60")}
              >
                2025 Edition
              </Button>
            </div>
          </div>
        </section>

        {/* Gallery Photos Grid */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl border border-border/40 bg-card/60" />
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item, index) => {
                const itemEdition = item.edition || (new Date(item.created_at).getFullYear() >= 2026 ? "2026" : "2025");
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedIndex(index)}
                    className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl border border-gold/25 bg-card shadow-elegant transition duration-300 hover:border-gold/60 hover:shadow-2xl"
                  >
                    <img
                      src={item.image_url}
                      alt={item.caption ?? `FYB Dinner ${itemEdition} photo`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Edition Tag */}
                    <div className="absolute left-3 top-3">
                      <Badge variant="outline" className="border-gold/50 bg-background/80 text-gold backdrop-blur text-[10px]">
                        {itemEdition === "2026" ? "2026 Dinner Night" : "2025 Edition"}
                      </Badge>
                    </div>

                    {/* Hover Caption Overlay */}
                    {item.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
                        <p className="text-sm font-medium text-foreground line-clamp-2">{item.caption}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gold/30 bg-card/40 py-16 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold/40 bg-gradient-royal text-gold">
                <Camera className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold">No photos found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There are no gallery photos uploaded under this edition yet.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md p-4">
          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="absolute right-4 top-4 z-50 rounded-full border border-gold/40 bg-card/80 p-2 text-muted-foreground hover:text-foreground"
            aria-label="Close photo"
          >
            <X className="h-6 w-6 text-gold" />
          </button>

          {/* Navigation Controls */}
          {filteredItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 z-50 rounded-full border border-gold/40 bg-card/80 p-3 text-gold hover:border-gold"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 z-50 rounded-full border border-gold/40 bg-card/80 p-3 text-gold hover:border-gold"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="relative max-h-[85vh] max-w-4xl overflow-hidden rounded-2xl border border-gold/30 bg-card p-2 shadow-2xl">
            <img
              src={activePhoto.image_url}
              alt={activePhoto.caption ?? "Enlarged photo"}
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
            <div className="mt-3 flex items-center justify-between px-3 pb-2 text-xs">
              <span className="text-muted-foreground">{activePhoto.caption || "FYB Dinner Gala Memory"}</span>
              <Badge variant="outline" className="border-gold/40 text-gold text-[10px]">
                {activePhoto.edition || (new Date(activePhoto.created_at).getFullYear() >= 2026 ? "2026 Dinner Night" : "2025 Edition")}
              </Badge>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
