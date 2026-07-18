import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GraduationCap, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatGuestTicketPriceList } from "@/lib/guest-tickets";

export const Route = createFileRoute("/register/")({ component: RegisterChooser });

function useSettings() {
  return useQuery({
    queryKey: ["event-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("event_settings").select("key,value");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: { key: string; value: string | null }) => { if (r.value != null) map[r.key] = r.value; });
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
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs uppercase tracking-widest text-gold">Registration</div>
          <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl md:text-5xl">Choose how you're attending</h1>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">Select the option that best describes you to begin registration.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6">
          <Link to="/register/fyb" className="group rounded-3xl border border-gold/30 bg-gradient-royal p-6 shadow-elegant transition hover:border-gold hover:shadow-gold sm:p-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground sm:h-14 sm:w-14">
              <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h2 className="mt-5 font-serif text-xl font-bold sm:mt-6 sm:text-2xl">I'm a Finalist (FYB)</h2>
            <p className="mt-2 text-sm text-muted-foreground">For final-year students of NIFES CUSTECH Osara being sent forth. Registration is ₦{formattedFyb}.</p>
            <div className="mt-5 inline-flex text-sm font-semibold text-gold group-hover:underline sm:mt-6">Continue as FYB →</div>
          </Link>
          <Link to="/register/guest" className="group rounded-3xl border border-gold/30 bg-card p-6 shadow-elegant transition hover:border-gold hover:shadow-gold sm:p-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground sm:h-14 sm:w-14">
              <UserPlus className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h2 className="mt-5 font-serif text-xl font-bold sm:mt-6 sm:text-2xl">I'm a Guest</h2>
            <p className="mt-2 text-sm text-muted-foreground">For alumni, friends of the fellowship, family members, and invited guests. Tickets: {guestTicketPrices}.</p>
            <div className="mt-5 inline-flex text-sm font-semibold text-gold group-hover:underline sm:mt-6">Continue as Guest →</div>
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
