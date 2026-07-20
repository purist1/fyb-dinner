import { EVENT } from "@/lib/event";
import { Link } from "@tanstack/react-router";
import { GoldDivider } from "@/components/marketing/gold-divider";

export function SiteFooter() {
  return (
    <footer className="border-t border-gold/20 bg-background/80">
      <div className="mx-auto max-w-6xl px-4 py-12 text-sm text-muted-foreground">
        <GoldDivider className="mb-10" />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-full border-2 border-gold/40 bg-white">
                <img src="/nifes.jpeg" alt="NIFES Logo" className="h-full w-full object-cover" />
              </div>
              <div className="font-serif text-xl leading-tight text-foreground">
                <div>{EVENT.orgShort}</div>
                <div className="text-eyebrow text-gold">{EVENT.chapter}</div>
              </div>
            </div>
            <p className="mt-4 max-w-xs leading-relaxed">
              <span className="font-accent text-foreground">{EVENT.title}</span> {EVENT.year} — a
              night of celebration, honour, and thanksgiving.
            </p>
          </div>

          <div>
            <div className="mb-3 font-semibold text-foreground">Navigate</div>
            <div className="flex flex-col gap-1.5">
              <a href="/#programme" className="transition hover:text-gold">
                The Night
              </a>
              <a href="/#details" className="transition hover:text-gold">
                Event Details
              </a>
              <a href="/#gallery" className="transition hover:text-gold">
                Gallery
              </a>
              <a href="/#faq" className="transition hover:text-gold">
                FAQ
              </a>
            </div>
          </div>

          <div>
            <div className="mb-3 font-semibold text-foreground">Contact</div>
            <div className="space-y-1">
              <div>{EVENT.contactEmail}</div>
              <div>{EVENT.contactPhone}</div>
            </div>
          </div>

          <div>
            <div className="mb-3 font-semibold text-foreground">Register</div>
            <div className="flex flex-col gap-1.5">
              <Link to="/register" className="transition hover:text-gold">
                Reserve your seat
              </Link>
              <Link to="/auth" className="transition hover:text-gold">
                Admin login
              </Link>
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
