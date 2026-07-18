export const EVENT = {
  orgName: "Nigeria Fellowship of Evangelical Students",
  orgShort: "NIFES",
  chapter: "CUSTECH Osara",
  title: "FYB Dinner & Awards Night",
  year: "2026",
  dateISO: "2026-08-26T15:00:00+01:00",
  dateHuman: "Wednesday, August 26, 2026",
  timeHuman: "3:00 PM (WAT)",
  contactEmail: "nifescustech@gmail.com",
  contactPhone: "+234 800 000 0000",
};

/** Fixed zone so SSR (Cloudflare UTC) and browser (user locale) render the same strings. */
export const EVENT_TIMEZONE = "Africa/Lagos";

export function formatEventDate(isoString: string) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { date: "To Be Announced", time: "", shortDate: "To Be Announced" };
    }
    const zone = { timeZone: EVENT_TIMEZONE };
    const dateStr = d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      ...zone,
    });
    const shortDateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...zone,
    });
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      ...zone,
    });
    return { date: dateStr, time: `${timeStr} (WAT)`, shortDate: shortDateStr };
  } catch {
    return { date: "To Be Announced", time: "", shortDate: "To Be Announced" };
  }
}
