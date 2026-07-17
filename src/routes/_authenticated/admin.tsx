import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Loader2, Upload, Download, ScanLine, LogOut, Search, ShieldAlert, Save, Trash2 } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminPage });

type Reg = {
  id: string;
  ticket_code: string;
  attendee_type: string;
  full_name: string;
  email: string;
  gender: string | null;
  whatsapp: string | null;
  department: string | null;
  course: string | null;
  fyb_registration_id: string | null;
  payment_status: string;
  payment_amount: number | null;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
};

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [regs, setRegs] = useState<Reg[]>([]);
  const [paidIds, setPaidIds] = useState<{ registration_id: string; full_name: string | null; used: boolean }[]>([]);
  const [venue, setVenue] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/auth" }); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!role);
      if (role) await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const [r, p, v] = await Promise.all([
      supabase.from("registrations").select("*").order("created_at", { ascending: false }),
      supabase.from("paid_fyb_ids").select("registration_id, full_name, used").order("created_at", { ascending: false }),
      supabase.from("event_settings").select("value").eq("key", "venue").maybeSingle(),
    ]);
    setRegs((r.data as Reg[]) ?? []);
    setPaidIds(p.data ?? []);
    setVenue(v.data?.value ?? "");
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return regs;
    return regs.filter(r =>
      r.full_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.ticket_code.toLowerCase().includes(q) ||
      (r.department ?? "").toLowerCase().includes(q) ||
      (r.fyb_registration_id ?? "").toLowerCase().includes(q)
    );
  }, [regs, search]);

  const stats = useMemo(() => {
    const total = regs.length;
    const fyb = regs.filter(r => r.attendee_type === "fyb").length;
    const guest = regs.filter(r => r.attendee_type === "guest").length;
    const paid = regs.filter(r => r.payment_status === "paid" || r.payment_status === "free").length;
    const checkedIn = regs.filter(r => r.checked_in).length;
    const revenue = regs.filter(r => r.payment_status === "paid").reduce((s, r) => s + (r.payment_amount ?? 0), 0);
    return { total, fyb, guest, paid, checkedIn, revenue };
  }, [regs]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function saveVenue() {
    setBusy(true);
    const { error } = await supabase.from("event_settings").update({ value: venue, updated_at: new Date().toISOString() }).eq("key", "venue");
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Venue updated");
  }

  async function importPaidIds(file: File) {
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    const rows = parsed.data
      .map(r => ({
        registration_id: (r.registration_id || r.RegistrationID || r["Registration ID"] || r.id || "").toString().trim(),
        full_name: (r.full_name || r["Full Name"] || r.name || "").toString().trim() || null,
      }))
      .filter(r => r.registration_id);
    if (rows.length === 0) { toast.error("No rows found. Ensure a 'registration_id' column."); return; }
    const { error } = await supabase.from("paid_fyb_ids").upsert(rows, { onConflict: "registration_id" });
    if (error) toast.error(error.message); else { toast.success(`${rows.length} IDs imported`); refresh(); }
  }

  async function addSingleId(id: string, name: string) {
    if (!id.trim()) return;
    const { error } = await supabase.from("paid_fyb_ids").upsert({ registration_id: id.trim(), full_name: name.trim() || null }, { onConflict: "registration_id" });
    if (error) toast.error(error.message); else { toast.success("Added"); refresh(); }
  }

  async function removeId(id: string) {
    const { error } = await supabase.from("paid_fyb_ids").delete().eq("registration_id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); refresh(); }
  }

  function exportCSV() {
    const csv = Papa.unparse(filtered);
    downloadBlob(csv, `attendees-${Date.now()}.csv`, "text/csv;charset=utf-8;");
  }
  function exportXLSX() {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendees");
    XLSX.writeFile(wb, `attendees-${Date.now()}.xlsx`);
  }

  async function toggleCheckin(reg: Reg) {
    const { error } = await supabase.from("registrations").update({
      checked_in: !reg.checked_in,
      checked_in_at: !reg.checked_in ? new Date().toISOString() : null,
    }).eq("id", reg.id);
    if (error) toast.error(error.message); else { toast.success(reg.checked_in ? "Undone" : "Checked in"); refresh(); }
  }

  if (isAdmin === null) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="max-w-md rounded-2xl border border-destructive/40 bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 font-serif text-2xl font-bold">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your account isn't an admin. Ask the developer to grant your account the <code>admin</code> role in the <code>user_roles</code> table.</p>
          <Button variant="secondary" onClick={signOut} className="mt-6"><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-gold">Admin Dashboard</div>
            <h1 className="font-serif text-2xl">FYB Dinner 2026</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-gold">Site</Link>
            <Button variant="ghost" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* STATS */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {[
            { label: "Total", v: stats.total },
            { label: "FYB", v: stats.fyb },
            { label: "Guests", v: stats.guest },
            { label: "Paid", v: stats.paid },
            { label: "Checked in", v: stats.checkedIn },
            { label: "Revenue (₦)", v: stats.revenue.toLocaleString() },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <div className="mt-1 font-serif text-2xl text-gradient-gold">{s.v}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="attendees" className="mt-8">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="paidids">Paid FYB IDs</TabsTrigger>
            <TabsTrigger value="checkin">Check-in Scanner</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="attendees" className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, ticket, department…" className="pl-9" />
              </div>
              <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />CSV</Button>
              <Button variant="outline" onClick={exportXLSX}><Download className="mr-2 h-4 w-4" />Excel</Button>
            </div>
            <div className="overflow-auto rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Dept / Course</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.ticket_code}</TableCell>
                      <TableCell>{r.full_name}</TableCell>
                      <TableCell><Badge variant="outline" className="border-gold/40 text-gold">{r.attendee_type.toUpperCase()}</Badge></TableCell>
                      <TableCell className="text-xs">{r.email}</TableCell>
                      <TableCell className="text-xs">{r.department}{r.course ? ` · ${r.course}` : ""}</TableCell>
                      <TableCell>
                        <Badge variant={r.payment_status === "pending" ? "destructive" : "default"} className={r.payment_status !== "pending" ? "bg-gradient-gold text-gold-foreground" : ""}>{r.payment_status}</Badge>
                      </TableCell>
                      <TableCell>{r.checked_in ? <Badge className="bg-gradient-gold text-gold-foreground">In</Badge> : <Badge variant="outline">—</Badge>}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => toggleCheckin(r)}>{r.checked_in ? "Undo" : "Check in"}</Button></TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No registrations yet.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="paidids" className="mt-6 space-y-6">
            <PaidIdImporter onImport={importPaidIds} onAdd={addSingleId} />
            <div className="overflow-auto rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidIds.map(p => (
                    <TableRow key={p.registration_id}>
                      <TableCell className="font-mono text-xs">{p.registration_id}</TableCell>
                      <TableCell>{p.full_name ?? "—"}</TableCell>
                      <TableCell>{p.used ? <Badge className="bg-gradient-gold text-gold-foreground">Used</Badge> : <Badge variant="outline">Unused</Badge>}</TableCell>
                      <TableCell><Button variant="ghost" size="sm" onClick={() => removeId(p.registration_id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {paidIds.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">Import your paid FYB IDs list.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="checkin" className="mt-6">
            <CheckinScanner regs={regs} onCheckedIn={refresh} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6 max-w-xl">
            <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
              <div>
                <Label>Event Venue</Label>
                <Textarea value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Main Auditorium, CUSTECH Osara" className="mt-2" />
              </div>
              <Button onClick={saveVenue} disabled={busy} className="bg-gradient-gold text-gold-foreground">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Venue
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function downloadBlob(content: string, name: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

function PaidIdImporter({ onImport, onAdd }: { onImport: (f: File) => void; onAdd: (id: string, name: string) => void }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  return (
    <div className="grid gap-4 rounded-2xl border border-border/60 bg-card p-6 md:grid-cols-2">
      <div>
        <div className="font-serif text-lg">Import CSV</div>
        <p className="mt-1 text-xs text-muted-foreground">CSV with a <code>registration_id</code> column (and optional <code>full_name</code>).</p>
        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-gold/40 p-4 text-sm hover:bg-accent/40">
          <Upload className="h-4 w-4 text-gold" /> Choose CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        </label>
      </div>
      <div>
        <div className="font-serif text-lg">Add one</div>
        <div className="mt-3 grid gap-2">
          <Input placeholder="Registration ID" value={id} onChange={(e) => setId(e.target.value)} />
          <Input placeholder="Full name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={() => { onAdd(id, name); setId(""); setName(""); }} className="bg-gradient-gold text-gold-foreground">Add</Button>
        </div>
      </div>
    </div>
  );
}

function CheckinScanner({ regs, onCheckedIn }: { regs: Reg[]; onCheckedIn: () => void }) {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastReg, setLastReg] = useState<Reg | null>(null);
  const [manual, setManual] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function processCode(code: string) {
    const reg = regs.find(r => r.ticket_code === code.trim());
    setLastResult(code);
    if (!reg) { setLastReg(null); toast.error("Ticket not found"); return; }
    setLastReg(reg);
    if (reg.checked_in) { toast.info("Already checked in", { description: reg.full_name }); return; }
    const { error } = await supabase.from("registrations").update({
      checked_in: true, checked_in_at: new Date().toISOString(),
    }).eq("id", reg.id);
    if (error) toast.error(error.message); else { toast.success("Checked in", { description: reg.full_name }); onCheckedIn(); }
  }

  async function start() {
    setScanning(true);
    const el = document.getElementById("qr-region");
    if (!el) return;
    const scanner = new Html5Qrcode("qr-region");
    scannerRef.current = scanner;
    try {
      await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, async (text) => {
        await processCode(text);
      }, () => {});
    } catch (err) {
      toast.error("Camera not available", { description: err instanceof Error ? err.message : String(err) });
      setScanning(false);
    }
  }
  async function stop() {
    try { await scannerRef.current?.stop(); await scannerRef.current?.clear(); } catch {}
    scannerRef.current = null;
    setScanning(false);
  }
  useEffect(() => { return () => { stop(); }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="font-serif text-lg">QR Scanner</div>
        <div id="qr-region" className="mt-3 aspect-square w-full overflow-hidden rounded-lg bg-background" />
        <div className="mt-3 flex gap-2">
          {!scanning ? (
            <Button onClick={start} className="bg-gradient-gold text-gold-foreground"><ScanLine className="mr-2 h-4 w-4" />Start Scanner</Button>
          ) : (
            <Button variant="secondary" onClick={stop}>Stop</Button>
          )}
        </div>
        <div className="mt-4">
          <Label>Or enter code manually</Label>
          <div className="mt-2 flex gap-2">
            <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="NIFES-XXXXXXXX" />
            <Button onClick={() => { processCode(manual); setManual(""); }}>Check</Button>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="font-serif text-lg">Last Scan</div>
        {lastResult ? (
          lastReg ? (
            <div className="mt-3 space-y-2">
              <div className="font-mono text-xs text-muted-foreground">{lastResult}</div>
              <div className="font-serif text-2xl">{lastReg.full_name}</div>
              <div className="text-xs uppercase tracking-widest text-gold">{lastReg.attendee_type}</div>
              <div className="text-sm text-muted-foreground">{lastReg.email}</div>
              <Badge className={lastReg.checked_in ? "bg-gradient-gold text-gold-foreground" : ""} variant={lastReg.checked_in ? "default" : "outline"}>
                {lastReg.checked_in ? "Checked in" : "Not yet"}
              </Badge>
            </div>
          ) : <div className="mt-3 text-sm text-destructive">Ticket not found</div>
        ) : <div className="mt-3 text-sm text-muted-foreground">Scan a ticket to see attendee details.</div>}
      </div>
    </div>
  );
}
