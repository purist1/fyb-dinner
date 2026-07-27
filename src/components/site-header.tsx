"use client";

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CeremonialButton } from "@/components/marketing/ceremonial-button";
import { EVENT } from "@/lib/event";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#story", label: "Story", isRoute: false },
  { href: "/#about", label: "About", isRoute: false },
  { href: "/#programme", label: "The Night", isRoute: false },
  { href: "/gallery", label: "Gallery", isRoute: true },
  { href: "/#faq", label: "FAQ", isRoute: false },
  { href: "/#contact", label: "Contact", isRoute: false },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-border/60 bg-background/95 shadow-elegant backdrop-blur-xl"
          : "border-transparent bg-background/40 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-[4.5rem]">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-gold/50 bg-white shadow-gold">
            <img src="/nifes.jpeg" alt="NIFES Logo" className="h-full w-full object-cover" />
          </div>
          <div className="hidden text-sm leading-tight sm:block">
            <div className="font-serif text-base font-bold">{EVENT.orgShort}</div>
            <div className="text-eyebrow text-gold">{EVENT.chapter}</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) =>
            l.isRoute ? (
              <Link
                key={l.href}
                to={l.href}
                className="relative text-sm text-muted-foreground transition hover:text-gold after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all hover:after:w-full font-medium"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="relative text-sm text-muted-foreground transition hover:text-gold after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all hover:after:w-full"
              >
                {l.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden lg:block">
          <CeremonialButton to="/gallery" className="px-5 py-2 text-sm">
            View Gallery
          </CeremonialButton>
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border/40 bg-background lg:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 p-4">
              {links.map((l) =>
                l.isRoute ? (
                  <Link
                    key={l.href}
                    to={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {l.label}
                  </a>
                ),
              )}
              <CeremonialButton
                to="/gallery"
                className="mt-2 w-full text-center"
                onClick={() => setOpen(false)}
              >
                View Gallery
              </CeremonialButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
