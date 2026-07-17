import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GraduationCap, UserPlus } from "lucide-react";

export const Route = createFileRoute("/register/")({ component: RegisterChooser });

function RegisterChooser() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs uppercase tracking-widest text-gold">Registration</div>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">Choose how you're attending</h1>
          <p className="mt-4 text-muted-foreground">Select the option that best describes you to begin registration.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Link to="/register/fyb" className="group rounded-3xl border border-gold/30 bg-gradient-royal p-8 shadow-elegant transition hover:border-gold hover:shadow-gold">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h2 className="mt-6 font-serif text-2xl font-bold">I'm a Finalist (FYB)</h2>
            <p className="mt-2 text-sm text-muted-foreground">For final-year students of NIFES CUSTECH Osara being sent forth. Registration is ₦7,000.</p>
            <div className="mt-6 inline-flex text-sm font-semibold text-gold group-hover:underline">Continue as FYB →</div>
          </Link>
          <Link to="/register/guest" className="group rounded-3xl border border-gold/30 bg-card p-8 shadow-elegant transition hover:border-gold hover:shadow-gold">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-gold text-gold-foreground">
              <UserPlus className="h-7 w-7" />
            </div>
            <h2 className="mt-6 font-serif text-2xl font-bold">I'm a Guest</h2>
            <p className="mt-2 text-sm text-muted-foreground">For alumni, friends of the fellowship, family members, and invited guests. Registration is ₦5,000.</p>
            <div className="mt-6 inline-flex text-sm font-semibold text-gold group-hover:underline">Continue as Guest →</div>
          </Link>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
