import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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
});

function serverAnon() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
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

/** Create a registration.
 *  - For FYB with a valid, unused paid ID: mark payment_status=free (already paid offline).
 *  - Otherwise: payment_status=pending; caller then initializes Paystack.
 *  Returns ticket_code + payment info.
 */
export const createRegistration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => registrationSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = serverAnon();

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
      amount = 7000;
    } else if (data.attendee_type === "fyb") {
      amount = 7000;
    } else {
      amount = 5000;
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

    return { ok: true as const, ticket_code: inserted.ticket_code, status: paymentStatus, amount, id: inserted.id };
  });

/** Initialize Paystack payment for an existing pending registration. */
export const initPaystackPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ ticket_code: z.string(), callback_url: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Payment is not configured yet. Please contact the coordinator.");

    const supabase = serverAnon();
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

    await supabase.from("registrations").update({ payment_reference: reference }).eq("ticket_code", data.ticket_code);

    return { ok: true as const, authorization_url: body.data.authorization_url, reference: body.data.reference };
  });

/** Verify a Paystack reference and mark registration paid. */
export const verifyPaystackPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ reference: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Payment is not configured yet.");
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const body = await res.json() as { status?: boolean; data?: { status: string; metadata?: { ticket_code?: string }; reference: string } };
    if (!res.ok || !body.status || !body.data) throw new Error("Could not verify payment");

    const supabase = serverAnon();
    if (body.data.status === "success") {
      // find by reference
      const { data: reg } = await supabase
        .from("registrations")
        .select("ticket_code")
        .eq("payment_reference", body.data.reference)
        .maybeSingle();
      if (reg) {
        await supabase.from("registrations").update({ payment_status: "paid" }).eq("ticket_code", reg.ticket_code);
        return { ok: true as const, paid: true, ticket_code: reg.ticket_code };
      }
    }
    return { ok: true as const, paid: false };
  });
