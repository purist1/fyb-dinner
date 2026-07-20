import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { InvitationCard } from "@/components/marketing/invitation-card";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { SectionHeading } from "@/components/marketing/section-heading";

type FaqItem = { q: string; a: string };

export function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="bg-card/30 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <ScrollReveal>
          <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <InvitationCard className="mt-10">
            <Accordion type="single" collapsible defaultValue="i0">
              {items.map((f, i) => (
                <AccordionItem key={i} value={`i${i}`} className="border-border/40">
                  <AccordionTrigger className="text-left font-medium hover:text-gold [&[data-state=open]]:border-l-2 [&[data-state=open]]:border-gold [&[data-state=open]]:pl-3">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </InvitationCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
