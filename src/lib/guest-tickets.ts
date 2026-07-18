export const GUEST_TICKET_TIERS = [
  { amount: 3000, title: "Regular", desc: "Single admission with dinner access" },
  { amount: 5000, title: "Couple", desc: "Admission for two with dinner access" },
  { amount: 7000, title: "VIP", desc: "Priority seating and premium dinner" },
  { amount: 10000, title: "VVIP", desc: "Front-row seating and special recognition" },
] as const;

export const GUEST_TICKET_AMOUNTS: number[] = GUEST_TICKET_TIERS.map((tier) => tier.amount);

export const DEFAULT_GUEST_TICKET_AMOUNT = GUEST_TICKET_TIERS[0].amount;

export function formatGuestTicketPriceList(): string {
  return GUEST_TICKET_TIERS.map((tier) => `₦${tier.amount.toLocaleString()} (${tier.title})`).join(", ");
}
