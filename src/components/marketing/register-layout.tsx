import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { SectionEyebrow } from "@/components/marketing/section-eyebrow";
import { cn } from "@/lib/utils";

export function RegisterPageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <ScrollReveal className="mx-auto max-w-2xl text-center">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl md:text-5xl">{title}</h1>
      {subtitle && <p className="mt-4 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
    </ScrollReveal>
  );
}

export function RegistrationProgress({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Step {step} of {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-gold transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function RegisterInvitationBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-royal px-6 py-10 text-center shadow-gold sm:px-10",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,oklch(0.78_0.14_85/0.15),transparent_60%)]" />
      <p className="relative text-eyebrow text-gold">You're Invited</p>
      <h2 className="relative mt-3 font-serif text-2xl font-bold sm:text-3xl">
        Join us for an evening of{" "}
        <span className="font-accent text-gradient-gold">honour & celebration</span>
      </h2>
      <p className="relative mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
        Reserve your place at the FYB Dinner & Awards Night — a commissioning, a thanksgiving, and a
        family gathering.
      </p>
    </div>
  );
}
