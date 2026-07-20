import { cn } from "@/lib/utils";
import { SectionEyebrow } from "./section-eyebrow";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  className,
  align = "center",
  tone = "dark",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  align?: "center" | "left";
  tone?: "dark" | "cream";
}) {
  const subtitleClass =
    tone === "cream" ? "text-surface-cream-foreground/70" : "text-muted-foreground";

  return (
    <div
      className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}
    >
      {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
      <h2 className={cn("font-serif text-3xl font-bold sm:text-4xl", eyebrow && "mt-3")}>
        {title}
      </h2>
      {subtitle && <p className={cn("mt-3 text-sm sm:text-base", subtitleClass)}>{subtitle}</p>}
    </div>
  );
}
