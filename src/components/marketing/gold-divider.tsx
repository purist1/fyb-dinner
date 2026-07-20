import { cn } from "@/lib/utils";

export function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)} aria-hidden>
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-gold/60 sm:w-16" />
      <span className="text-gold/80 text-xs">★</span>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-gold/60 sm:w-16" />
    </div>
  );
}
