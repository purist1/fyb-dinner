import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/marketing/hero-section";
import { FybStorySection } from "@/components/marketing/fyb-story-section";
import { AboutSection } from "@/components/marketing/about-section";
import { ProgrammeSection } from "@/components/marketing/programme-section";
import { EventDetailsSection } from "@/components/marketing/event-details-section";
import { GallerySection } from "@/components/marketing/gallery-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { ContactSection } from "@/components/marketing/contact-section";
import { EVENT, formatEventDate } from "@/lib/event";
import { formatGuestTicketPriceList } from "@/lib/guest-tickets";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({ component: Landing });

function useSettings() {
  return useQuery({
    queryKey: ["event-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("event_settings").select("key,value");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: { key: string; value: string | null }) => {
        if (r.value != null) map[r.key] = r.value;
      });
      return map;
    },
  });
}

function useGallery() {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gallery")
        .select("*")
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
  });
}

function Landing() {
  const { data: settings } = useSettings();
  const { data: gallery } = useGallery();
  const venue = settings?.venue ?? "To Be Announced";
  const eventDate = settings?.event_date ?? EVENT.dateISO;
  const formatted = formatEventDate(eventDate);

  const faqItems = [
    {
      q: "What should I wear?",
      a: "Elegant/formal — think dinner suits, gowns, and native attire in classy tones.",
    },
    {
      q: "Who can attend?",
      a: "The event is open to all finalists (FYB) of NIFES CUSTECH Osara, and to invited guests including alumni, friends of the fellowship, and family members.",
    },
    {
      q: "How much does it cost?",
      a: `FYB registration is ₦${settings?.fyb_price_naira ?? "7,000"}. Guest tickets are available in four tiers: ${formatGuestTicketPriceList()}.`,
    },
    {
      q: "How do I know if my FYB payment is recognised?",
      a: "During registration, enter the Registration ID given to you when you paid at the fellowship office. If it is on the paid list, you will be sent straight to your digital ticket.",
    },
    {
      q: "Can I pay online?",
      a: "Yes. Both FYB and guest registration support secure online payment via Paystack.",
    },
    {
      q: "Where is the venue?",
      a: "The exact venue will be announced closer to the date. Registered attendees will receive an update by email and on the platform.",
    },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <HeroSection
        dateHuman={formatted.date}
        timeHuman={formatted.time}
        venue={venue}
        eventDate={eventDate}
      />
      <FybStorySection />
      <AboutSection />
      <ProgrammeSection />
      <EventDetailsSection dateHuman={formatted.date} timeHuman={formatted.time} venue={venue} />
      <GallerySection gallery={gallery} />
      <FaqSection items={faqItems} />
      <ContactSection />
      <SiteFooter />
    </div>
  );
}
