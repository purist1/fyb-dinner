import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { EVENT } from "@/lib/event";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // Verify admin role before redirecting to dashboard
        supabase.from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle()
          .then(({ data: role }) => {
            if (role) {
              navigate({ to: "/admin" });
            } else {
              // Sign out if not authorized
              supabase.auth.signOut();
            }
          });
      }
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Double check role on sign in
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!role) {
        await supabase.auth.signOut();
        throw new Error("Access denied. Your account is not authorized as an admin.");
      }

      toast.success("Welcome back");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-gold/40 bg-white mb-2 shadow-gold">
            <img src="/nifes.jpeg" alt="NIFES Logo" className="h-full w-full object-cover" />
          </div>
          <span className="font-serif text-lg font-semibold text-foreground tracking-wide">{EVENT.orgShort} {EVENT.chapter}</span>
        </Link>
        <div className="rounded-3xl border border-gold/30 bg-card p-8 shadow-elegant">
          <h1 className="font-serif text-2xl font-bold">Admin Sign In</h1>
          <p className="mt-1 text-sm text-muted-foreground font-serif">FYB Coordinator access only.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="auth-email">Email</Label>
              <Input id="auth-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auth-password">Password</Label>
              <Input id="auth-password" required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90 mt-2">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Admin accounts are provisioned by the database administrator.
        </p>
      </div>
    </div>
  );
}
