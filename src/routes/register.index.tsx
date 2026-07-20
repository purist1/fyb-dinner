import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  RegisterInvitationBanner,
  RegisterPageHeader,
} from "@/components/marketing/register-layout";
import { StaggerItem, StaggerReveal } from "@/components/marketing/scroll-reveal";
import { formatGuestTicketPriceList } from "@/lib/guest-tickets";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register/")({ component: RegisterChooser });

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

function RegisterChooser() {
  const { data: settings } = useSettings();
  const fybPrice = settings?.fyb_price_naira ?? "7000";
  const formattedFyb = Number(fybPrice.replace(/[^0-9]/g, "") || "7000").toLocaleString();
  const guestTicketPrices = formatGuestTicketPriceList();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <RegisterInvitationBanner className="mb-12" />
        <RegisterPageHeader
          eyebrow="Registration"
          title="Choose how you're attending"
          subtitle="Select the option that best describes you to begin your registration."
        />

        <StaggerReveal className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6">
          <StaggerItem>
            <Link
              to="/register/fyb"
              className="group flex h-full flex-col rounded-3xl border-2 border-gold/30 bg-gradient-royal p-6 shadow-elegant transition hover:-translate-y-1 hover:border-gold hover:shadow-gold sm:p-8"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground shadow-gold">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-serif text-2xl font-bold">I'm a Finalist (FYB)</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                For final-year students of NIFES CUSTECH Osara being sent forth. Registration is ₦
                {formattedFyb}.
              </p>
              <div className="mt-6 text-sm font-semibold text-gold group-hover:underline">
                Continue as FYB →
              </div>
            </Link>
          </StaggerItem>

          <StaggerItem>
            <Link
              to="/register/guest"
              className="group flex h-full flex-col rounded-3xl border-2 border-gold/30 bg-surface-cream p-6 text-surface-cream-foreground shadow-elegant transition hover:-translate-y-1 hover:border-gold hover:shadow-gold sm:p-8"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground shadow-gold">
                <UserPlus className="h-7 w-7" />
              </div>
              <h2 className="mt-6 font-serif text-2xl font-bold">I'm a Guest</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-surface-cream-foreground/75">
                For alumni, friends of the fellowship, family members, and invited guests. Tickets:{" "}
                {guestTicketPrices}.
              </p>
              <div className="mt-6 text-sm font-semibold text-gold group-hover:underline">
                Continue as Guest →
              </div>
            </Link>
          </StaggerItem>
        </StaggerReveal>
      </section>
      <SiteFooter />
    </div>
  );
}
