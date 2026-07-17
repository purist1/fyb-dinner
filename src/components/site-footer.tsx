import { EVENT } from "@/lib/event";
import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/60">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-serif text-xl text-foreground">{EVENT.orgShort} {EVENT.chapter}</div>
            <p className="mt-2 max-w-xs">{EVENT.title} {EVENT.year} — a night of celebration, honour, and thanksgiving.</p>
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
