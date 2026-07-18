import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sendTicketEmail, sendTicketEmailsBatch } from "./email";
import { readServerSupabaseEnv } from "./supabase-env";
import { readEnv } from "./worker-env";

// Polyfill global WebSocket for older Node.js environments (like Node 20) on the server.
// This prevents Supabase client initialization from throwing errors since we only use REST.
if (typeof globalThis !== "undefined" && typeof (globalThis as any).WebSocket === "undefined") {
  (globalThis as any).WebSocket = class MockWebSocket {
    constructor() {}
  };
}

const registrationSchema = z.object({
  attendee_type: z.enum(["fyb", "guest"]),
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  gender: z.enum(["male", "female"]).optional().nullable(),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  department: z.string().trim().max(120).optional().nullable(),
  course: z.string().trim().max(120).optional().nullable(),
  fyb_registration_id: z.string().trim().max(60).optional().nullable(),
  passport_url: z.string().url().optional().nullable(),
  already_paid: z.boolean().optional(),
  ticket_amount: z.number().optional().nullable(),
});

function serverAnon() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = readServerSupabaseEnv();
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Supabase is not configured on the server. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Cloudflare Worker variables.",
    );
  }
  const key = SUPABASE_PUBLISHABLE_KEY;
  return createClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Service-role client — bypasses RLS for trusted server-side mutations (e.g. marking payment as paid). */
function serverAdmin() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY } = readServerSupabaseEnv();
  if (!SUPABASE_URL) {
    throw new Error(
      "Supabase is not configured on the server. Set SUPABASE_URL in Cloudflare Worker variables.",
    );
  }
  const key = SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is not set — falling back to anon client (RLS may block writes)");
    return serverAnon();
  }
  return createClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Create a registration.
 *  - For FYB with a valid, unused paid ID: mark payment_status=free (already paid offline).
 *  - Otherwise: payment_status=pending; caller then initializes Paystack.
 *  Returns ticket_code + payment info.
 */
export const createRegistration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => registrationSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = serverAdmin();

    // Basic duplicate check by email + type
    const { data: existing } = await supabase
      .from("registrations")
      .select("id, ticket_code, payment_status")
      .eq("email", data.email)
      .eq("attendee_type", data.attendee_type)
      .maybeSingle();

    if (existing && existing.payment_status !== "pending") {
      return { ok: true as const, ticket_code: existing.ticket_code, status: existing.payment_status, duplicate: true };
    }

    let paymentStatus: "free" | "pending" = "pending";
    let amount: number | null = null;

    const { data: settings } = await supabase.from("event_settings").select("key, value");
    let fybPriceVal = 7000;
    let guestPriceVal = 5000;
    if (settings) {
      const fybP = settings.find(s => s.key === "fyb_price_naira")?.value;
      const guestP = settings.find(s => s.key === "guest_price_naira")?.value;
      if (fybP) {
        const parsed = parseInt(fybP.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsed)) fybPriceVal = parsed;
      }
      if (guestP) {
        const parsed = parseInt(guestP.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsed)) guestPriceVal = parsed;
      }
    }

    if (data.attendee_type === "fyb" && data.already_paid && data.fyb_registration_id) {
      const { data: paid } = await supabase
        .from("paid_fyb_ids")
        .select("registration_id, used")
        .eq("registration_id", data.fyb_registration_id.trim())
        .maybeSingle();
      if (!paid) {
        throw new Error("Registration ID not found. If you have paid, contact the FYB Coordinator.");
      }
      paymentStatus = "free";
      amount = fybPriceVal;
    } else if (data.attendee_type === "fyb") {
      amount = fybPriceVal;
    } else {
      // Validate guest ticket amount is one of the allowed tiers: 1500, 3000, 5000.
      const allowedTiers = [1500, 3000, 5000];
      if (data.ticket_amount && allowedTiers.includes(data.ticket_amount)) {
        amount = data.ticket_amount;
      } else {
        amount = 1500; // default to standard ticket if missing/tampered
      }
    }

    const { data: inserted, error } = await supabase
      .from("registrations")
      .insert({
        attendee_type: data.attendee_type,
        full_name: data.full_name,
        email: data.email,
        gender: data.gender ?? null,
        whatsapp: data.whatsapp ?? null,
        department: data.department ?? null,
        course: data.course ?? null,
        fyb_registration_id: data.fyb_registration_id ?? null,
        passport_url: data.passport_url ?? null,
        payment_status: paymentStatus,
        payment_amount: amount,
      })
      .select("ticket_code, id")
      .single();

    if (error || !inserted) throw new Error(error?.message || "Failed to create registration");

    // Mark paid_fyb_id as used
    if (paymentStatus === "free" && data.fyb_registration_id) {
      await supabase
        .from("paid_fyb_ids")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("registration_id", data.fyb_registration_id.trim());
    }

    if (paymentStatus === "free") {
      sendTicketEmail({
        email: data.email,
        fullName: data.full_name,
        ticketCode: inserted.ticket_code,
        attendeeType: data.attendee_type,
      }).catch(err => console.error("Email delivery failed:", err));
    }

    return { ok: true as const, ticket_code: inserted.ticket_code, status: paymentStatus, amount, id: inserted.id };
  });

/** Initialize Paystack payment for an existing pending registration. */
export const initPaystackPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ ticket_code: z.string(), callback_url: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    const secret = readEnv("PAYSTACK_SECRET_KEY");
    if (!secret) throw new Error("Payment is not configured yet. Please contact the coordinator.");

    // Use admin client for all DB operations — anon key may be blocked by RLS
    const supabase = serverAdmin();
    const { data: reg, error } = await supabase
      .from("registrations")
      .select("ticket_code, email, full_name, payment_amount, payment_status")
      .eq("ticket_code", data.ticket_code)
      .maybeSingle();
    if (error || !reg) throw new Error("Registration not found");
    if (reg.payment_status === "paid" || reg.payment_status === "free") {
      return { ok: true as const, already_paid: true };
    }

    const amountKobo = (reg.payment_amount ?? 0) * 100;
    const reference = `${reg.ticket_code}-${Date.now()}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: reg.email,
        amount: amountKobo,
        reference,
        callback_url: data.callback_url,
        metadata: { ticket_code: reg.ticket_code, full_name: reg.full_name },
      }),
    });
    const body = await res.json() as { status?: boolean; message?: string; data?: { authorization_url: string; reference: string } };
    if (!res.ok || !body.status || !body.data) {
      throw new Error(body.message || "Failed to initialize payment");
    }

    const { error: refErr } = await supabase
      .from("registrations")
      .update({ payment_reference: reference })
      .eq("ticket_code", data.ticket_code);

    if (refErr) console.error("❌ [initPaystackPayment] Failed to store payment_reference:", refErr);

    return { ok: true as const, authorization_url: body.data.authorization_url, reference: body.data.reference };
  });

/** Verify a Paystack reference and mark registration paid. */
export const verifyPaystackPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ reference: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const secret = readEnv("PAYSTACK_SECRET_KEY");
    if (!secret) throw new Error("Payment is not configured yet.");
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await res.json() as { status?: boolean; data?: { status: string; metadata?: { ticket_code?: string }; reference: string } };
    if (!res.ok || !body.status || !body.data) throw new Error("Could not verify payment");

    console.log(`[verifyPaystackPayment] Paystack status=${body.data?.status}, reference=${body.data?.reference}`);

    // Use service-role client to bypass RLS for the payment_status update
    const supabaseAdmin = serverAdmin();
    if (body.data.status === "success") {
      // find by reference
      const { data: reg, error: findErr } = await supabaseAdmin
        .from("registrations")
        .select("ticket_code, email, full_name, attendee_type")
        .eq("payment_reference", body.data.reference)
        .maybeSingle();
      
      console.log(`[verifyPaystackPayment] DB lookup result: reg=${reg?.ticket_code ?? "NOT FOUND"}, error=${findErr?.message ?? "none"}`);
      
      if (findErr) console.error("❌ [verifyPaystackPayment] Failed to find registration:", findErr);
      
      if (reg) {
        const { error: updateErr } = await supabaseAdmin
          .from("registrations")
          .update({ payment_status: "paid" })
          .eq("ticket_code", reg.ticket_code);

        if (updateErr) {
          console.error("❌ [verifyPaystackPayment] Failed to update payment_status:", updateErr);
          throw new Error("Payment verified but failed to update ticket. Please contact support.");
        }
        
        sendTicketEmail({
          email: reg.email,
          fullName: reg.full_name,
          ticketCode: reg.ticket_code,
          attendeeType: reg.attendee_type as "fyb" | "guest",
        }).catch(err => console.error("Email delivery failed:", err));

        return { ok: true as const, paid: true, ticket_code: reg.ticket_code };
      }
    }
    return { ok: true as const, paid: false };
  });

const bulkImportItemSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  attendee_type: z.enum(["fyb", "guest"]),
  gender: z.enum(["male", "female"]).optional().nullable(),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  department: z.string().trim().max(120).optional().nullable(),
  course: z.string().trim().max(120).optional().nullable(),
  fyb_registration_id: z.string().trim().max(60).optional().nullable(),
});

const bulkImportSchema = z.object({
  registrants: z.array(bulkImportItemSchema),
  adminUserId: z.string().uuid(),
});

/** Bulk import offline paid registrations and trigger their ticket emails. */
export const bulkImportRegistrations = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => bulkImportSchema.parse(d))
  .handler(async ({ data }) => {
    const supabaseAdmin = serverAdmin();

    // 1. Verify that the user performing the action is an admin
    const { data: role, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !role) {
      throw new Error("Unauthorized: You do not have permissions to perform this operation.");
    }

    // 2. Fetch price settings to set ticket prices correctly
    const { data: settings } = await supabaseAdmin.from("event_settings").select("key, value");
    let fybPriceVal = 7000;
    let guestPriceVal = 5000;
    if (settings) {
      const fybP = settings.find(s => s.key === "fyb_price_naira")?.value;
      const guestP = settings.find(s => s.key === "guest_price_naira")?.value;
      if (fybP) {
        const parsed = parseInt(fybP.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsed)) fybPriceVal = parsed;
      }
      if (guestP) {
        const parsed = parseInt(guestP.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(parsed)) guestPriceVal = parsed;
      }
    }

    // 3. Construct rows for bulk insert
    const insertRows = data.registrants.map(item => {
      const amount = item.attendee_type === "fyb" ? fybPriceVal : guestPriceVal;
      return {
        attendee_type: item.attendee_type,
        full_name: item.full_name,
        email: item.email,
        gender: item.gender ?? null,
        whatsapp: item.whatsapp ?? null,
        department: item.department ?? null,
        course: item.course ?? null,
        fyb_registration_id: item.fyb_registration_id ?? null,
        payment_status: "free" as const, // bulk imported are free (offline paid)
        payment_amount: amount,
      };
    });

    // 4. Perform bulk insert
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("registrations")
      .insert(insertRows)
      .select("ticket_code, full_name, email, attendee_type");

    if (insertError) {
      console.error("❌ [bulkImportRegistrations] Insert error:", insertError);
      throw new Error(`Failed to bulk import registrations: ${insertError.message}`);
    }

    // 5. Send emails to all newly registered attendees in batch chunks of 100
    if (inserted && inserted.length > 0) {
      console.log(`[bulkImportRegistrations] Successfully imported ${inserted.length} users. Queueing batch emails...`);
      const batchRecipients = inserted.map(reg => ({
        email: reg.email,
        fullName: reg.full_name,
        ticketCode: reg.ticket_code,
        attendeeType: reg.attendee_type as "fyb" | "guest",
      }));
      sendTicketEmailsBatch(batchRecipients).catch(err => 
        console.error(`[bulkImportRegistrations] Batch email delivery failed:`, err)
      );
    }

    return { ok: true as const, count: inserted?.length ?? 0 };
  });

