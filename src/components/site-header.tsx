import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { EVENT } from "@/lib/event";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#details", label: "Details" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-gold font-serif text-lg font-bold text-gold-foreground">N</div>
          <div className="hidden text-sm leading-tight sm:block">
            <div className="font-serif text-base font-bold">{EVENT.orgShort}</div>
            <div className="text-[10px] uppercase tracking-widest text-gold">{EVENT.chapter}</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground transition hover:text-gold">{l.label}</a>
          ))}
        </nav>
        <div className="hidden md:block">
          <Link to="/register" className="rounded-full bg-gradient-gold px-5 py-2 text-sm font-semibold text-gold-foreground shadow-gold transition hover:opacity-90">
            Register
          </Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 p-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">{l.label}</a>
            ))}
            <Link to="/register" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-gradient-gold px-5 py-2.5 text-center text-sm font-semibold text-gold-foreground">
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
