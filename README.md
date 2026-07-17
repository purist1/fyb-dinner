# NIFES FYB Dinner & Awards Night Application

An elegant, premium web application built with **TanStack Start**, **React**, and **Supabase** for managing registrations, dynamic pricing settings, photo gallery, check-ins, and ticket generation for the NIFES FYB Dinner & Awards Night.

## 🚀 Getting Started

### 1. Installation
Install project dependencies using `npm`:
```bash
npm install
```

### 2. Local Environment Setup
Create a `.env` file in the root directory (or update the existing one) with your credentials:
```env
SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key"

VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"

# Paystack Config for accepting online payments
PAYSTACK_SECRET_KEY="your-paystack-secret-key"

# Resend API Key for automated email ticket passes
RESEND_API_KEY="your-resend-api-key"
APP_URL="http://localhost:8080"
```

### 3. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:8080](http://localhost:8080)** to view the site.

### 4. Build for Production
To bundle the application for production:
```bash
npm run build
```

---

## 🔒 Admin Account Provisioning

For maximum security, **public admin registration has been disabled** on the web. Admin accounts must be created and granted access manually via the **Supabase Dashboard**:

### Step 1: Create the User
1. Go to your **Supabase Dashboard** > **Authentication** > **Users**.
2. Click **Add User** > **Create User**.
3. Fill in the coordinator's **Email** and a secure **Password**.
4. Leave "Auto-confirm user" checked and click **Create User**.
5. Copy the newly generated **User ID** (e.g. `d8b58409-e85d-4f7d-8931-893c834a34b2`).

### Step 2: Assign the Admin Role
1. Go to the **Table Editor** in the Supabase Sidebar.
2. Select the **`user_roles`** table.
3. Click **Insert Row**.
4. Paste the copied **User ID** into the `user_id` field.
5. Set the `role` field to **`admin`**.
6. Save the row.

*Alternatively, you can run this command inside the Supabase **SQL Editor** (replace the ID with the one you copied):*
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('PASTE-USER-ID-HERE', 'admin'::app_role);
```

Once provisioned, the user can sign in at `/auth` and access the secure Admin Dashboard.

---

## 📸 Storage Bucket Setup

Finalists' passport photos and event gallery photos require storage bucket configuration:
1. Go to the **Storage** section in your Supabase Dashboard.
2. Ensure both **`gallery`** and **`passports`** buckets exist.
3. Mark both buckets as **Public** so their public URLs are accessible in the browser.

---

## ⚙️ App Features

* **Dynamic Prices**: Ticket prices (Finalist and Guest) can be configured dynamically from the admin settings dashboard.
* **Gallery Manager**: Admins can upload photos of past events with captions directly to the database/storage bucket.
* **Pass Generator**: High-fidelity VIP pass with a unique QR code generated for every attendee upon successful payment verification.
* **Email Delivery**: High-fidelity HTML VIP pass is dynamically sent straight to the user's email inbox immediately upon registration or successful checkout.
