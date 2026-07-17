import { EVENT } from "@/lib/event";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/60">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-full border border-gold/40 bg-white flex-shrink-0">
                <img src="/nifes.jpeg" alt="NIFES Logo" className="h-full w-full object-cover" />
              </div>
              <div className="font-serif text-xl text-foreground leading-tight">
                <div>{EVENT.orgShort}</div>
                <div className="text-xs text-gold uppercase tracking-wider">{EVENT.chapter}</div>
              </div>
            </div>
            <p className="mt-4 max-w-xs">{EVENT.title} {EVENT.year} — a night of celebration, honour, and thanksgiving.</p>
          </div>
          <div>
            <div className="mb-2 font-semibold text-foreground">Contact</div>
            <div>{EVENT.contactEmail}</div>
            <div>{EVENT.contactPhone}</div>
          </div>
          <div>
            <div className="mb-2 font-semibold text-foreground">Links</div>
            <div className="flex flex-col gap-1">
              <Link to="/register" className="hover:text-gold">Register</Link>
              <Link to="/auth" className="hover:text-gold">Admin login</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border/40 pt-6 text-xs">
          © {new Date().getFullYear()} NIFES {EVENT.chapter}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
