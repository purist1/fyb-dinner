# Supabase Project Setup Guide

This guide explains how to connect your real Supabase account to the NIFES FYB Dinner & Awards Night application.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in or create an account.
2. Click **New Project** and select your organization.
3. Enter a project name (e.g. `nifes-fyb-dinner`), set a secure database password, and choose a region close to your users.
4. Wait for the project database to provision.

## 2. Apply Database Migrations

To set up the database tables, roles, and RLS (Row Level Security) policies, you need to run the migrations provided in the project.

### Option A: Using the SQL Editor (Easiest)

1. In your Supabase Dashboard, click on the **SQL Editor** icon in the left sidebar.
2. Click **New query**.
3. Copy the contents of the migration files in `supabase/migrations/` in order:
   - First, run the schema setup from [20260717133130_273fc71e-6712-4508-8a0b-0239fcf83d89.sql](supabase/migrations/20260717133130_273fc71e-6712-4508-8a0b-0239fcf83d89.sql).
   - Second, run the function restrictions from [20260717133141_9de1bd2c-d9ab-4008-a843-df355a39375c.sql](supabase/migrations/20260717133141_9de1bd2c-d9ab-4008-a843-df355a39375c.sql).
   - Third, run the paid IDs seed from [20260717150000_seed_paid_fyb_ids.sql](supabase/migrations/20260717150000_seed_paid_fyb_ids.sql) to populate the `paid_fyb_ids` table with `NCO-FYB26-001` to `NCO-FYB26-100`.
4. Click **Run** for each query.

### Option B: Using the Supabase CLI

If you have the Supabase CLI installed, link your project and apply the migrations:
```bash
npx supabase login
npx supabase link --project-ref <your-project-id>
npx supabase db push
```

## 3. Create Storage Buckets

The application uploads and displays images (e.g., finalists' passport photos).
1. Go to the **Storage** section in the Supabase Dashboard.
2. Click **New Bucket**.
3. Create a bucket named **`passports`**.
4. Toggle **Public bucket** to `Enabled` (so public links can access the photos).
5. Click **Save**.
6. Create another bucket named **`gallery`** and set it to **Public** as well.

## 4. Retrieve API Keys & Configure Environment Variables

1. Go to **Project Settings** > **API** in the Supabase Dashboard.
2. Copy the following keys:
   - **Project URL** (`SUPABASE_URL`)
   - **`anon` `public` API Key** (`SUPABASE_PUBLISHABLE_KEY`)
   - **`service_role` `secret` API Key** (`SUPABASE_SERVICE_ROLE_KEY`) — *Do not expose this on the frontend!*
3. Paste these values into your environment or a `.env` file in the project root:

```env
SUPABASE_PROJECT_ID="your-project-ref"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"

# Required for local client-side variables
VITE_SUPABASE_PROJECT_ID="your-project-ref"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"

# Paystack Config for Online Payments (Secret Key)
PAYSTACK_SECRET_KEY="your-paystack-secret-key"

# Resend API Key for sending ticket emails
RESEND_API_KEY="your-resend-api-key"
# Application Host URL (used for absolute ticket links in email notifications)
APP_URL="http://localhost:8080"
```

## 5. Enable Paystack Integration (Optional)

If you plan to accept online registration payments via Paystack:
1. Register for an account on [Paystack](https://paystack.com).
2. Go to **Settings** > **API Keys & Webhooks** in your Paystack dashboard.
3. Retrieve your **Secret Key** (starts with `sk_live_` or `sk_test_`).
4. Set it as `PAYSTACK_SECRET_KEY` in your environment/`.env`.

## 6. Enable Email Notification System (Optional)

To automatically send beautifully formatted VIP ticket passes via email immediately upon registration:
1. Go to [Resend](https://resend.com) and create a free account.
2. In the Resend Dashboard, go to **API Keys** and click **Create API Key** (ensure it has sending permissions).
3. Copy the key (starts with `re_`) and save it as `RESEND_API_KEY` in your `.env` file.
4. *(Optional)* Add and verify your custom domain in the **Domains** section of Resend to send from a custom email address like `tickets@yourdomain.com`. By default, the application will send from `tickets@resend.dev` on the onboarding domain.
5. Set `APP_URL` in your environment to the public URL of your deployed application (e.g. `https://nifes-fyb-dinner.pages.dev`) so that links inside the email point directly to the digital ticket passes.
