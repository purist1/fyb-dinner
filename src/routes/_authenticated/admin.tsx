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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Loader2, Upload, Download, ScanLine, LogOut, Search, ShieldAlert, Save, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Html5Qrcode } from "html5-qrcode";
import { useServerFn } from "@tanstack/react-start";
import { EVENT } from "@/lib/event";
import { uploadGalleryBatch, deleteGalleryImage, type GalleryUploadProgress } from "@/lib/storage";
import { bulkImportRegistrations } from "@/lib/registrations.functions";

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
  const runBulkImport = useServerFn(bulkImportRegistrations);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [regs, setRegs] = useState<Reg[]>([]);
  const [paidIds, setPaidIds] = useState<{ registration_id: string; full_name: string | null; used: boolean }[]>([]);
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [fybPrice, setFybPrice] = useState("");
  const [guestPrice, setGuestPrice] = useState("");
  const [galleryItems, setGalleryItems] = useState<{ id: string; image_url: string; caption: string | null }[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<GalleryUploadProgress | null>(null);
  const [galleryDeleteTarget, setGalleryDeleteTarget] = useState<{ id: string; image_url: string } | null>(null);
  const [deletingGallery, setDeletingGallery] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  // Bulk import states
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/auth" }); return; }
      setAdminUserId(u.user.id);
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!role);
      if (role) await refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const [r, p, s, g] = await Promise.all([
      supabase.from("registrations").select("*").order("created_at", { ascending: false }),
      supabase.from("paid_fyb_ids").select("registration_id, full_name, used").order("created_at", { ascending: false }),
      supabase.from("event_settings").select("key, value"),
      supabase.from("gallery").select("*").order("created_at", { ascending: false }),
    ]);
    setRegs((r.data as Reg[]) ?? []);
    setPaidIds(p.data ?? []);
    setGalleryItems(g.data ?? []);
    if (s.data) {
      setVenue(s.data.find(x => x.key === "venue")?.value ?? "");
      setEventDate(s.data.find(x => x.key === "event_date")?.value ?? "");
      setFybPrice(s.data.find(x => x.key === "fyb_price_naira")?.value ?? "7000");
      setGuestPrice(s.data.find(x => x.key === "guest_price_naira")?.value ?? "5000");
    }
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

  async function saveSettings() {
    setBusy(true);
    const updates = [
      { key: "venue", value: venue, updated_at: new Date().toISOString() },
      { key: "event_date", value: eventDate, updated_at: new Date().toISOString() },
      { key: "fyb_price_naira", value: fybPrice, updated_at: new Date().toISOString() },
      { key: "guest_price_naira", value: guestPrice, updated_at: new Date().toISOString() },
    ];
    const { error } = await supabase.from("event_settings").upsert(updates);
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Settings updated successfully");
  }

  async function handleUploadGallery(e: React.FormEvent) {
    e.preventDefault();
    if (galleryFiles.length === 0) {
      toast.error("Please select at least one image");
      return;
    }
    setUploadingGallery(true);
    setGalleryUploadProgress(null);
    try {
      const caption = galleryCaption.trim() || null;
      const baseSort = galleryItems.length;

      const { rows, failed } = await uploadGalleryBatch(galleryFiles, {
        caption,
        baseSort,
        onProgress: setGalleryUploadProgress,
      });

      if (rows.length === 0) {
        throw new Error("All uploads failed. Check your connection and try again.");
      }

      const { error } = await supabase.from("gallery").insert(rows);
      if (error) throw error;

      if (failed > 0) {
        toast.warning(`${rows.length} uploaded, ${failed} failed`);
      } else {
        toast.success(`${rows.length} image${rows.length === 1 ? "" : "s"} uploaded to gallery`);
      }

      setGalleryFiles([]);
      setGalleryCaption("");
      const fileInput = document.getElementById("gallery-file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      const { data: g } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
      setGalleryItems(g ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setUploadingGallery(false);
      setGalleryUploadProgress(null);
    }
  }

  async function confirmDeleteGallery() {
    if (!galleryDeleteTarget) return;
    setDeletingGallery(true);
    try {
      await deleteGalleryImage(galleryDeleteTarget.image_url);
      const { error } = await supabase.from("gallery").delete().eq("id", galleryDeleteTarget.id);
      if (error) throw error;
      toast.success("Gallery image removed");
      setGalleryDeleteTarget(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete gallery image");
    } finally {
      setDeletingGallery(false);
    }
  }

  function requestDeleteGallery(item: { id: string; image_url: string }) {
    setGalleryDeleteTarget(item);
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

  async function parseBulkImportFile(file: File) {
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let data: any[] = [];
      if (ext === "csv") {
        const text = await file.text();
        const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
        data = parsed.data;
      } else if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(ws);
      } else {
        toast.error("Unsupported file format. Please upload CSV or Excel (.xlsx/.xls)");
        return;
      }

      const mapped = data.map((r: any) => {
        const fullName = r.full_name || r["Full Name"] || r.name || r.FullName || "";
        const email = r.email || r.Email || r.email_address || r["Email Address"] || "";
        const attendeeType = (r.attendee_type || r["Attendee Type"] || r.type || "fyb").toString().toLowerCase().trim();
        const gender = (r.gender || r.Gender || "").toString().toLowerCase().trim();
        const whatsapp = r.whatsapp || r.WhatsApp || r.phone || r.Phone || "";
        const department = r.department || r.Department || r.dept || "";
        const course = r.course || r.Course || "";
        const fybId = r.fyb_registration_id || r["FYB ID"] || r.registration_id || "";

        return {
          full_name: fullName.toString().trim(),
          email: email.toString().trim(),
          attendee_type: (attendeeType === "guest" || attendeeType === "invited guest") ? "guest" : "fyb",
          gender: (gender === "male" || gender === "female") ? gender : null,
          whatsapp: whatsapp ? whatsapp.toString().trim() : null,
          department: department ? department.toString().trim() : null,
          course: course ? course.toString().trim() : null,
          fyb_registration_id: fybId ? fybId.toString().trim() : null,
        };
      }).filter(r => r.full_name && r.email);

      if (mapped.length === 0) {
        toast.error("No valid rows found. Ensure you have 'full_name' and 'email' columns.");
        return;
      }

      setImportPreview(mapped);
      setImportFile(file);
      toast.success(`Loaded ${mapped.length} registrants for preview`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse file");
    }
  }

  async function handleBulkImport() {
    if (importPreview.length === 0 || !adminUserId) return;
    setImporting(true);
    try {
      const res = await runBulkImport({
        data: {
          registrants: importPreview,
          adminUserId,
        }
      });
      if (res.ok) {
        toast.success(`Successfully imported ${res.count} registrations and sent ticket emails!`);
        setImportPreview([]);
        setImportFile(null);
        const fileInput = document.getElementById("bulk-import-input") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        await refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk import failed");
    } finally {
      setImporting(false);
    }
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-gold/40 bg-white shadow-sm sm:h-10 sm:w-10">
              <img src="/nifes.jpeg" alt="NIFES Logo" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.2em] text-gold font-bold leading-none sm:text-[10px]">
                {EVENT.orgShort} · {EVENT.chapter}
              </div>
              <h1 className="font-serif text-lg font-bold mt-0.5 truncate sm:text-2xl sm:mt-1">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/" className="hidden text-sm font-semibold text-muted-foreground hover:text-gold transition sm:block">
              View Site
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="hover:text-destructive transition">
              <LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Sign out</span>
            </Button>
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
            <div key={s.label} className="rounded-xl border border-gold/30 bg-gradient-royal p-4 shadow-elegant relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-gold/5 rounded-full blur-xl pointer-events-none" />
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-1 font-serif text-3xl font-extrabold text-gradient-gold">{s.v}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="attendees" className="mt-6 sm:mt-8">
          <TabsList className="flex h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="attendees" className="text-xs sm:text-sm">Attendees</TabsTrigger>
            <TabsTrigger value="paidids" className="text-xs sm:text-sm">Paid FYB IDs</TabsTrigger>
            <TabsTrigger value="bulk-import" className="text-xs sm:text-sm">Bulk Import</TabsTrigger>
            <TabsTrigger value="checkin" className="text-xs sm:text-sm">Check-in</TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs sm:text-sm">Gallery</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="attendees" className="mt-4 space-y-4 sm:mt-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative flex-1 min-w-0 sm:min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, ticket…" className="pl-9" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-1.5 h-3.5 w-3.5" />CSV</Button>
                <Button variant="outline" size="sm" onClick={exportXLSX}><Download className="mr-1.5 h-3.5 w-3.5" />Excel</Button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-card/60">
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">Ticket</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">Name</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">Dept/Course</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">Payment</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground">In</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b border-border/40 hover:bg-card/40 transition">
                      <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{r.ticket_code}</td>
                      <td className="px-3 py-3 font-medium">{r.full_name}</td>
                      <td className="px-3 py-3"><Badge variant="outline" className="border-gold/40 text-gold text-[10px]">{r.attendee_type.toUpperCase()}</Badge></td>
                      <td className="px-3 py-3 text-xs">{r.email}</td>
                      <td className="px-3 py-3 text-xs">{r.department}{r.course ? ` · ${r.course}` : ""}</td>
                      <td className="px-3 py-3">
                        <Badge variant={r.payment_status === "pending" ? "destructive" : "default"} className={r.payment_status !== "pending" ? "bg-gradient-gold text-gold-foreground" : ""}>{r.payment_status}</Badge>
                      </td>
                      <td className="px-3 py-3">{r.checked_in ? <Badge className="bg-gradient-gold text-gold-foreground">In</Badge> : <Badge variant="outline">—</Badge>}</td>
                      <td className="px-3 py-3"><Button size="sm" variant="ghost" onClick={() => toggleCheckin(r)}>{r.checked_in ? "Undo" : "Check in"}</Button></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">No registrations yet.</td></tr>}
                </tbody>
              </table>
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

          <TabsContent value="gallery" className="mt-6 space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6 max-w-xl">
              <h2 className="font-serif text-xl font-bold mb-3">Upload Gallery Images</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Select multiple photos at once. They will all share the same caption.
              </p>
              <form onSubmit={handleUploadGallery} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="gallery-file-input">Select Images</Label>
                  <Input
                    id="gallery-file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    required
                    onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))}
                    className="mt-1"
                  />
                  {galleryFiles.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {galleryFiles.length} image{galleryFiles.length === 1 ? "" : "s"} selected
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gallery-caption">Caption for all images</Label>
                  <Input
                    id="gallery-caption"
                    value={galleryCaption}
                    onChange={(e) => setGalleryCaption(e.target.value)}
                    placeholder="e.g. FYB Dinner 2025 highlights"
                    className="mt-1"
                  />
                </div>
                {uploadingGallery && galleryUploadProgress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {galleryUploadProgress.phase === "compressing" && "Compressing photos…"}
                        {galleryUploadProgress.phase === "uploading" && "Uploading…"}
                        {galleryUploadProgress.phase === "saving" && "Saving to gallery…"}
                      </span>
                      <span>
                        {galleryUploadProgress.done} / {galleryUploadProgress.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        galleryUploadProgress.total > 0
                          ? (galleryUploadProgress.done / galleryUploadProgress.total) * 100
                          : 0
                      }
                    />
                  </div>
                )}
                <Button type="submit" disabled={uploadingGallery || galleryFiles.length === 0} className="w-full bg-gradient-gold text-gold-foreground">
                  {uploadingGallery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {uploadingGallery && galleryUploadProgress
                    ? galleryUploadProgress.phase === "compressing"
                      ? `Compressing ${galleryUploadProgress.done}/${galleryUploadProgress.total}…`
                      : galleryUploadProgress.phase === "uploading"
                        ? `Uploading ${galleryUploadProgress.done}/${galleryUploadProgress.total}…`
                        : "Saving…"
                    : galleryFiles.length > 0
                      ? `Upload ${galleryFiles.length} Image${galleryFiles.length === 1 ? "" : "s"}`
                      : "Upload Images"}
                </Button>
              </form>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="font-serif text-xl font-bold mb-4">Current Gallery Images</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {galleryItems.map((item) => (
                  <AdminGalleryCard key={item.id} item={item} onDelete={() => requestDeleteGallery(item)} />
                ))}
                {galleryItems.length === 0 && (
                  <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                    No gallery images uploaded yet. Upload images to show them on the event website.
                  </div>
                )}
              </div>
            </div>

            <AlertDialog open={!!galleryDeleteTarget} onOpenChange={(open) => !open && setGalleryDeleteTarget(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete gallery image?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the image from the website and deletes the file from storage. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletingGallery}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deletingGallery}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={(e) => {
                      e.preventDefault();
                      void confirmDeleteGallery();
                    }}
                  >
                    {deletingGallery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="settings" className="mt-6 max-w-xl">
            <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="set-venue">Event Venue</Label>
                <Textarea id="set-venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Main Auditorium, CUSTECH Osara" className="mt-1" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="set-date">Event Date & Time</Label>
                <Input id="set-date" type="datetime-local" value={eventDate ? eventDate.substring(0, 16) : ""} onChange={(e) => setEventDate(new Date(e.target.value).toISOString())} className="mt-1" />
                <p className="text-[10px] text-muted-foreground font-mono">Original saved ISO format: {eventDate}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                   <Label htmlFor="set-fyb-price">Finalist (FYB) Ticket Price (₦)</Label>
                   <Input id="set-fyb-price" type="number" value={fybPrice} onChange={(e) => setFybPrice(e.target.value)} className="mt-1" />
                </div>
                <div className="grid gap-2">
                   <Label htmlFor="set-guest-price">Guest Ticket Price (₦)</Label>
                   <Input id="set-guest-price" type="number" value={guestPrice} onChange={(e) => setGuestPrice(e.target.value)} className="mt-1" />
                </div>
              </div>
              <Button onClick={saveSettings} disabled={busy} className="w-full bg-gradient-gold text-gold-foreground mt-2">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Event Settings
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="bulk-import" className="mt-6 space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-gradient-gold">Bulk Import Offline Registrations</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upload a CSV or Excel file containing details of finalists/guests who have paid offline. The system will automatically register them as paid, generate unique tickets, and email passes directly.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 rounded-xl border border-dashed border-gold/30 bg-gold/5 p-6 text-center">
                <div className="mx-auto flex max-w-lg flex-col items-center">
                  <Upload className="h-8 w-8 text-gold mb-2" />
                  <span className="text-sm font-semibold">Select File (CSV or Excel)</span>
                  <span className="text-xs text-muted-foreground mt-2 max-w-md">
                    Required columns: <code className="font-mono bg-background px-1 py-0.5 rounded text-gold">full_name</code>, <code className="font-mono bg-background px-1 py-0.5 rounded text-gold">email</code>. 
                    Optional: <code className="font-mono bg-background px-1 py-0.5 rounded text-gold">attendee_type</code> (fyb/guest), <code className="font-mono bg-background px-1 py-0.5 rounded text-gold">department</code>, <code className="font-mono bg-background px-1 py-0.5 rounded text-gold">course</code>, <code className="font-mono bg-background px-1 py-0.5 rounded text-gold">whatsapp</code>, <code className="font-mono bg-background px-1 py-0.5 rounded text-gold">fyb_registration_id</code>.
                  </span>
                </div>
                <Input
                  id="bulk-import-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) parseBulkImportFile(file);
                  }}
                  className="mx-auto max-w-xs mt-2"
                />
              </div>

              {importPreview.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                      Import Preview ({importPreview.length} items loaded)
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setImportPreview([]);
                          setImportFile(null);
                          const fileInput = document.getElementById("bulk-import-input") as HTMLInputElement;
                          if (fileInput) fileInput.value = "";
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBulkImport}
                        disabled={importing}
                        className="bg-gradient-gold text-gold-foreground"
                      >
                        {importing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing & Emailing...
                          </>
                        ) : (
                          "Confirm & Process Import"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-auto max-h-96 rounded-xl border border-border/60">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>WhatsApp</TableHead>
                          <TableHead>FYB ID (Offline ID)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importPreview.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-semibold text-foreground">{item.full_name}</TableCell>
                            <TableCell>{item.email}</TableCell>
                            <TableCell>
                              <Badge variant={item.attendee_type === "fyb" ? "default" : "secondary"}>
                                {item.attendee_type === "fyb" ? "Finalist" : "Guest"}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.department || "—"}</TableCell>
                            <TableCell>{item.course || "—"}</TableCell>
                            <TableCell>{item.whatsapp || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{item.fyb_registration_id || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
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

function AdminGalleryCard({
  item,
  onDelete,
}: {
  item: { id: string; image_url: string; caption: string | null };
  onDelete: () => void;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-background">
      {broken ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
          <Badge variant="outline" className="border-destructive/50 text-destructive">
            Missing file
          </Badge>
          <p className="text-[10px] text-muted-foreground">Storage file not found. Remove this entry.</p>
        </div>
      ) : (
        <img
          src={item.image_url}
          alt={item.caption ?? ""}
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
      {item.caption && !broken && (
        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-center text-[10px] text-white line-clamp-2 truncate">
          {item.caption}
        </div>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow hover:bg-destructive/80"
        aria-label="Delete image"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
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
