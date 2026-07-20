import { cn } from "@/lib/utils";

export function SectionEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("text-eyebrow text-gold", className)}>{children}</div>;
}
