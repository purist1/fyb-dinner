import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminSignIn } from "@/lib/admin-auth.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvitationCard } from "@/components/marketing/invitation-card";
import { CeremonialButton } from "@/components/marketing/ceremonial-button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { EVENT } from "@/lib/event";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const signIn = useServerFn(adminSignIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (role) {
        navigate({ to: "/admin" });
      } else {
        await supabase.auth.signOut();
      }
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const session = await signIn({ data: { email, password } });
      const { error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      if (error) throw error;

      toast.success("Welcome back");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,oklch(0.42_0.18_300/0.25),transparent_55%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-6 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <div className="mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-gold/40 bg-white shadow-gold">
            <img src="/nifes.jpeg" alt="NIFES Logo" className="h-full w-full object-cover" />
          </div>
          <span className="font-serif text-lg font-semibold tracking-wide text-foreground">
            {EVENT.orgShort} {EVENT.chapter}
          </span>
        </Link>
        <InvitationCard>
          <h1 className="font-serif text-2xl font-bold">Admin Sign In</h1>
          <p className="mt-1 font-accent text-sm text-muted-foreground">
            FYB Coordinator access only.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <CeremonialButton type="submit" className="mt-2 w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </CeremonialButton>
          </form>
        </InvitationCard>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Admin accounts are created in Supabase, not via Vercel env vars. Use the email and
          password provisioned for your coordinator account.
        </p>
      </div>
    </div>
  );
}
