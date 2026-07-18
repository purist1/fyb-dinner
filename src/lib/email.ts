import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { EVENT } from "./event";
import { readServerSupabaseEnv } from "./supabase-env.server";
import { readEnv } from "./worker-env.server";

// Polyfill global WebSocket for Node environments on the server (Vite SSR / server functions)
if (typeof globalThis !== "undefined" && typeof (globalThis as any).WebSocket === "undefined") {
  (globalThis as any).WebSocket = class MockWebSocket {
    constructor() {}
  };
}

function serverAnon() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = readServerSupabaseEnv();
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase is not configured on the server.");
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function formatEventDate(isoString: string) {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: "To Be Announced", time: "" };
    const dateStr = d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return { date: dateStr, time: `${timeStr} (WAT)` };
  } catch {
    return { date: "To Be Announced", time: "" };
  }
}

export type EmailOptions = {
  email: string;
  fullName: string;
  ticketCode: string;
  attendeeType: "fyb" | "guest";
};

export type EmailHtmlOptions = {
  fullName: string;
  ticketCode: string;
  dateHuman: string;
  timeHuman: string;
  venue: string;
  ticketUrl: string;
  welcomeMessage: string;
  attendeeType: "fyb" | "guest";
};

export function getEmailHtml({
  fullName,
  ticketCode,
  dateHuman,
  timeHuman,
  venue,
  ticketUrl,
  welcomeMessage,
  attendeeType,
}: EmailHtmlOptions): string {
  const isFyb = attendeeType === "fyb";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket Pass</title>
</head>
<body style="margin: 0; padding: 0; background-color: #05020a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #05020a; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card Wrapper -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 550px; background-color: #0d0614; border: 2px solid #dfc380; border-radius: 28px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
          <!-- Top Border Accent -->
          <tr>
            <td height="6" style="background: linear-gradient(90deg, #dfc380 0%, #c5a85c 50%, #dfc380 100%); line-height: 6px; font-size: 1px;">&nbsp;</td>
          </tr>
          
          <!-- Logo & Header -->
          <tr>
            <td align="center" style="padding: 35px 20px 20px 20px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px; background-color: #ffffff; border-radius: 50%; border: 2px solid #dfc380; box-shadow: 0 4px 10px rgba(223, 195, 128, 0.2);">
                    <img src="https://ftextqkrknnacdwnmtsa.supabase.co/storage/v1/object/public/gallery/nifes.jpeg" alt="NIFES Logo" width="60" height="60" style="display: block; object-fit: cover; border-radius: 50%;" />
                  </td>
                </tr>
              </table>
              <h2 style="font-family: Georgia, serif; color: #dfc380; font-size: 20px; font-weight: bold; letter-spacing: 3px; margin: 15px 0 0 0; text-transform: uppercase; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">NIFES CUSTECH OSARA</h2>
              <p style="color: #a1a1aa; font-size: 10px; font-weight: 600; letter-spacing: 4px; margin: 5px 0 0 0; text-transform: uppercase;">FYB Sent Forth & Awards 2026</p>
            </td>
          </tr>
 
          <!-- Separator Line -->
          <tr>
            <td style="padding: 0 30px;">
              <hr style="border: 0; border-top: 1px solid rgba(223, 195, 128, 0.15); margin: 0;" />
            </td>
          </tr>
 
          <!-- Message Body -->
          <tr>
            <td style="padding: 30px 35px 20px 35px; color: #e4e4e7; font-size: 15px; line-height: 1.6;">
              <p style="margin-top: 0; font-size: 18px; color: #ffffff; font-family: Georgia, serif;">Hello, <strong>${fullName}</strong></p>
              <p style="color: #d4d4d8; font-weight: 300;">${welcomeMessage}</p>
            </td>
          </tr>
 
          <!-- Ticket Card Container -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #140b20; border: 1px solid rgba(223,195,128,0.25); border-radius: 20px; padding: 25px; box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);">
                <tr>
                  <td>
                    <!-- Ticket Header -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size: 9px; color: #a1a1aa; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">TICKET CLASS</td>
                        <td align="right" style="font-size: 9px; color: #a1a1aa; letter-spacing: 2px; text-transform: uppercase; font-weight: bold;">ACCESS PASS</td>
                      </tr>
                      <tr>
                        <td style="font-size: 16px; color: #dfc380; font-weight: bold; font-family: Georgia, serif; padding: 4px 0 15px 0;">${isFyb ? "FINALIST (VIP)" : "INVITED GUEST"}</td>
                        <td align="right" style="font-size: 16px; color: #ffffff; font-weight: bold; font-family: monospace; padding: 4px 0 15px 0; letter-spacing: 1px;">${ticketCode}</td>
                      </tr>
                    </table>
                    
                    <!-- Dotted Line Divider -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 15px;">
                      <tr>
                        <td style="border-top: 1px dotted rgba(223, 195, 128, 0.25); line-height: 1px; font-size: 1px;">&nbsp;</td>
                      </tr>
                    </table>
 
                    <!-- Event Logistics -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: #d4d4d8;">
                      <tr>
                        <td style="padding: 5px 0; font-weight: bold; color: #ffffff; width: 100px;">DATE:</td>
                        <td style="padding: 5px 0; color: #e4e4e7;">${dateHuman}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-weight: bold; color: #ffffff;">TIME:</td>
                        <td style="padding: 5px 0; color: #e4e4e7;">${timeHuman}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-weight: bold; color: #ffffff; vertical-align: top;">VENUE:</td>
                        <td style="padding: 5px 0; color: #e4e4e7; line-height: 1.4;">${venue}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
 
          <!-- Action Button -->
          <tr>
            <td align="center" style="padding: 10px 30px 30px 30px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #dfc380 0%, #c5a85c 100%); border-radius: 50px; box-shadow: 0 4px 15px rgba(223, 195, 128, 0.3);">
                    <a href="${ticketUrl}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; font-weight: bold; color: #0d0614; text-decoration: none; letter-spacing: 1px; text-transform: uppercase;">View VIP Ticket Pass</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
 
          <!-- Footer Signature -->
          <tr>
            <td align="center" style="background-color: #09030e; padding: 30px 35px; border-top: 1px solid rgba(223, 195, 128, 0.15);">
              <p style="color: #a1a1aa; font-size: 13px; margin: 0 0 5px 0; line-height: 1.4;">Please present the QR code on your digital pass at the entrance gate for check-in.</p>
              <p style="color: #dfc380; font-size: 12px; font-weight: bold; font-family: Georgia, serif; margin: 15px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">With joy and anticipation,</p>
              <p style="color: #ffffff; font-size: 13px; font-weight: bold; margin: 4px 0 0 0; letter-spacing: 0.5px;">NIFES CUSTECH Osara Planning Committee</p>
              <p style="color: #52525b; font-size: 10px; margin: 25px 0 0 0; letter-spacing: 0.5px;">&copy; 2026 NIFES CUSTECH. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function sendTicketEmail({ email, fullName, ticketCode, attendeeType }: EmailOptions) {
  const apiKey = readEnv("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("⚠️ [Email Notification] RESEND_API_KEY is not set in environment. Skipping email sending.");
    return;
  }

  try {
    const supabase = serverAnon();
    const { data: settings } = await supabase.from("event_settings").select("key, value");
    let venue = "To Be Announced";
    let eventDate = EVENT.dateISO;

    if (settings) {
      const v = settings.find(s => s.key === "venue")?.value;
      const d = settings.find(s => s.key === "event_date")?.value;
      if (v) venue = v;
      if (d) eventDate = d;
    }

    const formatted = formatEventDate(eventDate);
    const dateHuman = formatted.date;
    const timeHuman = formatted.time;

    const appUrl = readEnv("APP_URL") || "http://localhost:8080";
    const ticketUrl = `${appUrl}/ticket/${ticketCode}`;

    const isFyb = attendeeType === "fyb";
    const welcomeMessage = isFyb 
      ? `Congratulations on completing your academic race! As a finalist, we are deeply honored to send you forth. Here is your exclusive VIP access pass for the celebration.` 
      : `We are delighted and honored to have you join us for this special evening. Below is your official guest access ticket.`;

    const htmlContent = getEmailHtml({
      fullName,
      ticketCode,
      dateHuman,
      timeHuman,
      venue,
      ticketUrl,
      welcomeMessage,
      attendeeType,
    });

    const fromEmail = readEnv("RESEND_FROM_EMAIL")
      ? `NIFES CUSTECH <${readEnv("RESEND_FROM_EMAIL")}>`
      : "NIFES CUSTECH <onboarding@resend.dev>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        reply_to: ["nifescustech@gmail.com"],
        subject: "Your VIP Pass: NIFES FYB Dinner & Awards Night 2026",
        html: htmlContent,
      }),
    });

    const body = await res.json();
    if (!res.ok) {
      console.error("❌ [Email Notification] Resend API Error:", body);
    } else {
      console.log(`✅ [Email Notification] Ticket email sent successfully to ${email}`);
    }
  } catch (err) {
    console.error("❌ [Email Notification] Failed to send email:", err);
  }
}

/** Sends a batch of ticket emails in groups of 100 to comply with Resend limitations. */
export async function sendTicketEmailsBatch(recipients: EmailOptions[]) {
  const apiKey = readEnv("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("⚠️ [Email Notification] RESEND_API_KEY is not set in environment. Skipping batch sending.");
    return;
  }

  try {
    const supabase = serverAnon();
    const { data: settings } = await supabase.from("event_settings").select("key, value");
    let venue = "To Be Announced";
    let eventDate = EVENT.dateISO;

    if (settings) {
      const v = settings.find(s => s.key === "venue")?.value;
      const d = settings.find(s => s.key === "event_date")?.value;
      if (v) venue = v;
      if (d) eventDate = d;
    }

    const formatted = formatEventDate(eventDate);
    const dateHuman = formatted.date;
    const timeHuman = formatted.time;
    const appUrl = readEnv("APP_URL") || "http://localhost:8080";

    const fromEmail = readEnv("RESEND_FROM_EMAIL")
      ? `NIFES CUSTECH <${readEnv("RESEND_FROM_EMAIL")}>`
      : "NIFES CUSTECH <onboarding@resend.dev>";

    // Prepare all requests
    const emailRequests = recipients.map((r) => {
      const ticketUrl = `${appUrl}/ticket/${r.ticketCode}`;
      const isFyb = r.attendeeType === "fyb";
      const welcomeMessage = isFyb
        ? `Congratulations on completing your academic race! As a finalist, we are deeply honored to send you forth. Here is your exclusive VIP access pass for the celebration.`
        : `We are delighted and honored to have you join us for this special evening. Below is your official guest access ticket.`;

      const htmlContent = getEmailHtml({
        fullName: r.fullName,
        ticketCode: r.ticketCode,
        dateHuman,
        timeHuman,
        venue,
        ticketUrl,
        welcomeMessage,
        attendeeType: r.attendeeType,
      });

      return {
        from: fromEmail,
        to: [r.email],
        reply_to: ["nifescustech@gmail.com"],
        subject: "Your VIP Pass: NIFES FYB Dinner & Awards Night 2026",
        html: htmlContent,
      };
    });

    // Send in chunks of 100 (Resend batch API limit)
    const chunkSize = 100;
    for (let i = 0; i < emailRequests.length; i += chunkSize) {
      const chunk = emailRequests.slice(i, i + chunkSize);
      console.log(`✉️ [Email Notification] Sending batch chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(emailRequests.length / chunkSize)} (${chunk.length} emails)...`);

      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: chunk,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        console.error("❌ [Email Notification] Resend Batch Error:", body);
      } else {
        console.log(`✅ [Email Notification] Sent batch chunk successfully`);
      }

      // Small throttling delay to protect API limits
      if (i + chunkSize < emailRequests.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  } catch (err) {
    console.error("❌ [Email Notification] Failed to send email batch:", err);
  }
}

