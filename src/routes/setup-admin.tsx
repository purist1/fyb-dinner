import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { bootstrapAdminFromEnv } from "@/lib/admin-auth.functions";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/setup-admin")({
  component: SetupAdminPage,
  validateSearch: (s: Record<string, unknown>) => ({
    secret: typeof s.secret === "string" ? s.secret : "",
  }),
});

function SetupAdminPage() {
  const { secret } = Route.useSearch();
  const bootstrap = useServerFn(bootstrapAdminFromEnv);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState<string | null>(null);

  async function runSetup() {
    if (!secret || secret.length < 8) {
      setStatus("error");
      setMessage("Add ?secret=YOUR_ADMIN_SETUP_SECRET to the URL.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const result = await bootstrap({ data: { secret } });
      setEmail(result.email);
      setStatus("success");
      setMessage(`Admin account synced for ${result.email}. You can sign in at /auth using ADMIN_PASSWORD from Vercel.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Setup failed.");
    }
  }

  useEffect(() => {
    if (secret.length >= 8) void runSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-gold/30 bg-card p-8 shadow-elegant">
        <h1 className="font-serif text-2xl font-bold">Admin Setup</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Creates or updates the Supabase admin user from your Vercel env vars (
          <code className="text-xs">ADMIN_EMAIL</code>, <code className="text-xs">ADMIN_PASSWORD</code>,{" "}
          <code className="text-xs">ADMIN_SETUP_SECRET</code>). Deploying alone does not run this — visit this page once
          after deploy.
        </p>

        {status === "loading" && (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Syncing admin to Supabase…
          </div>
        )}

        {status === "success" && (
          <div className="mt-6 flex gap-3 rounded-xl border border-gold/30 bg-gold/10 p-4 text-sm">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <div className="font-semibold text-foreground">Admin ready</div>
              <div className="mt-1 text-muted-foreground">{message}</div>
              {email && (
                <div className="mt-2 font-mono text-xs text-gold">{email}</div>
              )}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <div className="font-semibold text-destructive">Setup failed</div>
              <div className="mt-1 text-muted-foreground">{message}</div>
            </div>
          </div>
        )}

        {status === "idle" && !secret && (
          <div className="mt-6 text-sm text-muted-foreground">
            Example: <code className="text-xs">/setup-admin?secret=your-admin-setup-secret</code>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button
            type="button"
            onClick={() => void runSetup()}
            disabled={status === "loading" || !secret}
            className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running…
              </>
            ) : (
              "Run setup again"
            )}
          </Button>
          <Link to="/auth" className="text-center text-sm text-gold hover:underline">
            Go to admin sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
