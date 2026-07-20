import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type CeremonialButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  to?: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function CeremonialButton({
  children,
  className,
  href,
  to,
  variant = "primary",
  onClick,
  type = "button",
  disabled,
}: CeremonialButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90 animate-shimmer"
      : "border border-gold/40 text-foreground hover:bg-card/60";

  const cls = cn(base, styles, className);

  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
