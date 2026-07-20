import { cn } from "@/lib/utils";

export function InvitationCard({
  children,
  className,
  variant = "dark",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "dark" | "cream";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 border-double p-6 shadow-elegant sm:p-8",
        variant === "dark"
          ? "border-gold/35 bg-card/80"
          : "border-gold/50 bg-surface-cream text-surface-cream-foreground",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-2 rounded-[1.25rem] border border-gold/15"
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
