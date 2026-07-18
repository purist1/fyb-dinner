import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

if (!email || !password) {
  console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === targetEmail);
    if (match) return match;

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  let userId;

  const existing = await findUserByEmail(email);
  if (existing) {
    userId = existing.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (updateError) throw updateError;
    console.log(`Updated existing auth user: ${email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "NIFES CUSTECH Admin" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created auth user: ${email}`);
  }

  const { data: roleRow, error: roleLookupError } = await supabase
    .from("user_roles")
    .select("id, role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleLookupError) throw roleLookupError;

  if (!roleRow) {
    const { error: roleInsertError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (roleInsertError) throw roleInsertError;
    console.log("Granted admin role.");
  } else {
    console.log("Admin role already assigned.");
  }

  console.log("");
  console.log("Admin login ready:");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Sign in:  /auth`);
}

main().catch((err) => {
  console.error("Failed to provision admin:", err.message || err);
  process.exit(1);
});
