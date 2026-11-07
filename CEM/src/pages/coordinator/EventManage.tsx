import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Award,
  Banknote,
  CheckCircle2,
  Download,
  IndianRupee,
  Megaphone,
  Pencil,
  QrCode,
  ScanLine,
  Send,
  Trash2,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { eventDetail, deleteEvent } from "@/services/events";
import { attendanceRowsForEvent, checkInByQr, participantsForEvent } from "@/services/registrations";
import { announcementsFor, budgetSummary, deleteBudgetEntry, expensesFor, addBudgetEntry, postAnnouncement } from "@/services/engage";
import { approveAndPublishResults, issueParticipationCertificates, standings } from "@/services/results";
import { expenseSchema } from "@/services/forms-extra";
import { zodErrors, type FieldErrors } from "@/lib/validators";
import { z } from "zod";
import { cn, downloadCsv, fmtCurrency, fmtDate, fmtMoney, fmtTime, relTime } from "@/lib/utils";
import { PosterThumb } from "@/components/eventBits";
import { Badge, Button, Card, EmptyState, Input, Progress, StatCard, Textarea } from "@/components/ui";
import { DataTable, Tabs, tooltipStyle } from "@/components/data";
import { ConfirmDialog, Modal, useToast } from "@/components/overlays";

const announceSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters"),
  body: z.string().trim().min(10, "Announcement must be at least 10 characters"),
});

export default function EventManagePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState("overview");

  /* shared UI state */
  const [search, setSearch] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [announcement, setAnnouncement] = useState({ title: "", body: "" });
  const [annErrors, setAnnErrors] = useState<FieldErrors>({});
  const [budget, setBudget] = useState({ kind: "expense", category: "", label: "", amount: "", date: "" });
  const [budgetErrors, setBudgetErrors] = useState<FieldErrors>({});
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [certsOpen, setCertsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const detail = id ? eventDetail(id) : null;

  const allParticipants = id ? participantsForEvent(id) : [];
  const participants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allParticipants.filter((p) => !q || p.name.toLowerCase().includes(q) || p.usn.toLowerCase().includes(q) || (p.teamName ?? "").toLowerCase().includes(q));
  }, [allParticipants, search]);

  if (!detail || !user) {
    return <EmptyState title="Event not found" body="This event does not exist or was deleted." />;
  }
  const { event } = detail;

  if (event.coordinatorId !== user.id && user.role !== "admin") {
    return <EmptyState title="Not your event" body="Only the assigned coordinator can open this console." />;
  }

  const summary = budgetSummary(event.id);
  const standingRows = standings(event.id);
  const attendLog = attendanceRowsForEvent(event.id).slice(0, 6);
  const announcements = announcementsFor(event.id);
  const entries = expensesFor(event.id);

  /* ------------------------------ handlers ------------------------------ */

  const doCheckIn = (code: string) => {
    const res = checkInByQr(code);
    if (res.ok && res.data) {
      toast.success("Checked in", `${res.data.studentName} · ${res.data.usn}`);
      setQrInput("");
    } else {
      toast.error("Check-in blocked", res.error);
    }
  };

  const exportCsv = () => {
    downloadCsv(
      `${event.title.replace(/[^a-z0-9]+/gi, "-")}-registrations.csv`,
      ["Name", "USN", "Department", "Team", "Status", "Fee", "QR Code", "Registered at"],
      participants.map((p) => [p.name, p.usn, p.department, p.teamName ?? "—", p.reg.status, String(event.fee), p.reg.qrCode, p.reg.createdAt.slice(0, 10)]),
    );
    toast.success("Export ready", `${participants.length} rows exported.`);
  };

  const post = (e: FormEvent) => {
    e.preventDefault();
    const parsed = announceSchema.safeParse(announcement);
    if (!parsed.success) {
      setAnnErrors(zodErrors(parsed.error));
      return;
    }
    const res = postAnnouncement(event.id, parsed.data.title, parsed.data.body);
    if (res.ok) {
      toast.success("Announcement broadcast", "All registered participants were notified.");
      setAnnouncement({ title: "", body: "" });
      setAnnErrors({});
    } else toast.error("Failed", res.error);
  };

  const addEntry = (e: FormEvent) => {
    e.preventDefault();
    const parsed = expenseSchema.safeParse({ ...budget, date: budget.date });
    if (!parsed.success) {
      setBudgetErrors(zodErrors(parsed.error));
      return;
    }
    const res = addBudgetEntry(event.id, parsed.data);
    if (res.ok) {
      toast.success("Entry added", `${parsed.data.kind === "income" ? "+" : "-"}${fmtMoney(parsed.data.amount)}`);
      setBudget({ kind: "expense", category: "", label: "", amount: "", date: "" });
      setBudgetErrors({});
      setBudgetOpen(false);
    } else toast.error("Failed", res.error);
  };

  const publishResults = () => {
    setBusy(true);
    const res = approveAndPublishResults(event.id);
    setBusy(false);
    setPublishOpen(false);
    if (res.ok) toast.success("Results published", `${res.data?.winners ?? 0} winner certificate(s) minted. Event marked completed.`);
    else toast.error("Cannot publish", res.error);
  };

  const mintCerts = () => {
    setBusy(true);
    const res = issueParticipationCertificates(event.id);
    setBusy(false);
    setCertsOpen(false);
    if (res.ok) toast.success("Certificates issued", `${res.data?.issued ?? 0} new participation certificate(s). Attendees were notified.`);
    else toast.error("Failed", res.error);
  };

  const destroyEvent = () => {
    const res = deleteEvent(event.id);
    setDeleteOpen(false);
    if (res.ok) {
      toast.success("Event deleted");
      navigate("/app/coordinator/events");
    } else toast.error("Delete blocked", res.error);
  };

  /* --------------------------------- views --------------------------------- */

  const STATUS_TONE: Record<string, "green" | "amber" | "rose" | "slate" | "cyan"> = { published: "green", pending: "amber", rejected: "rose", draft: "slate", completed: "cyan" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <PosterThumb poster={event.poster} title={event.title} className="h-24 w-40 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{event.title}</h1>
              <Badge tone={STATUS_TONE[event.status]}>{event.status}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {fmtDate(event.date)} · {fmtTime(event.startTime)} · {detail.venueName} · Judge: {detail.facultyName}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={`/events/${event.id}`} className="inline-flex h-9 items-center rounded-xl border border-line px-3.5 text-xs font-semibold text-muted hover:text-ink">
              Public page
            </Link>
            <Link to={`/app/coordinator/events/${event.id}/edit`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-violet-500/40 px-3.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/10">
              <Pencil className="size-3.5" aria-hidden /> Edit
            </Link>
          </div>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "registrations", label: "Registrations", count: detail.registered },
          { id: "attendance", label: "Attendance", count: detail.attended },
          { id: "announcements", label: "Announce", count: announcements.length },
          { id: "results", label: "Results" },
          { id: "budget", label: "Budget" },
          { id: "settings", label: "Settings" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ------------------------------- OVERVIEW ------------------------------ */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Users} label="Registered" value={`${detail.registered}/${event.capacity}`} accent="violet" />
            <StatCard icon={CheckCircle2} label="Checked in" value={detail.attended} accent="green" />
            <StatCard icon={IndianRupee} label="Ticket revenue" value={fmtMoney(detail.registered * event.fee)} accent="cyan" />
            <StatCard icon={Wallet} label="Budget balance" value={fmtMoney(summary.balance)} accent="amber" sub={`${fmtMoney(summary.income)} in · ${fmtMoney(summary.spend)} out`} />
          </div>
          <Card>
            <div className="mb-2 flex justify-between text-xs text-muted">
              <span>Capacity utilization</span>
              <span>{Math.round((detail.registered / event.capacity) * 100)}%</span>
            </div>
            <Progress value={(detail.registered / event.capacity) * 100} tone="violet" />
            <p className="mt-3 text-xs text-dim">
              Deadline {fmtDate(event.regDeadline)} · {detail.spotsLeft} seats left · {event.teamSizeMax > 1 ? `Teams of ${event.teamSizeMin}–${event.teamSizeMax}` : "Individual event"}
            </p>
          </Card>
          {event.status === "pending" && (
            <Card className="border-amber-500/30">
              <p className="text-sm text-amber-200">This event is awaiting Super Admin approval. Everything is prepared — it publishes the moment it's approved.</p>
            </Card>
          )}
        </div>
      )}

      {/* ---------------------------- REGISTRATIONS ---------------------------- */}
      {tab === "registrations" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full sm:w-72">
              <Input placeholder="Search name, USN or team…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search participants" />
            </div>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv} disabled={participants.length === 0}>
              Export CSV
            </Button>
          </div>
          <DataTable
            columns={[
              { key: "name", header: "Participant", render: (p: (typeof participants)[number]) => (<div><p className="font-medium text-ink">{p.name}{p.isLeader && <Badge tone="amber" className="ml-2">Leader</Badge>}</p><p className="text-xs text-dim">{p.usn} · {p.department}</p></div>) },
              { key: "team", header: "Team", render: (p) => p.teamName ?? <span className="text-dim">Solo</span> },
              { key: "status", header: "Status", render: (p) => <Badge tone={p.reg.status === "attended" ? "green" : "cyan"}>{p.reg.status}</Badge> },
              { key: "fee", header: "Payment", render: () => (event.fee === 0 ? <Badge tone="green">Free</Badge> : <Badge tone="violet">Paid {fmtCurrency(event.fee)}</Badge>) },
              { key: "at", header: "Registered", render: (p) => <span className="text-xs text-muted">{relTime(p.reg.createdAt)}</span> },
            ]}
            rows={participants}
            rowKey={(p) => p.reg.id}
            empty={search ? "No participants match the search." : "No registrations yet — share the event page!"}
          />
        </div>
      )}

      {/* ----------------------------- ATTENDANCE ------------------------------ */}
      {tab === "attendance" && (
        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          <div className="space-y-5">
            <Card className="neon-ring">
              <h3 className="flex items-center gap-2 font-display font-semibold text-ink">
                <ScanLine className="size-5 text-cyan-300" aria-hidden /> QR check-in
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">Scan or paste the participant's QR code. Each code is single-use — duplicates are blocked instantly.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (qrInput.trim()) doCheckIn(qrInput);
                }}
                className="mt-4 space-y-3"
              >
                <Input icon={QrCode} placeholder="e.g. CS-TODY-ATTND1" value={qrInput} onChange={(e) => setQrInput(e.target.value.toUpperCase())} aria-label="QR code value" className="font-mono" />
                <Button type="submit" className="w-full" variant="neon" disabled={!qrInput.trim()}>
                  Verify & check in
                </Button>
              </form>
            </Card>
            <Card>
              <h3 className="font-display text-sm font-semibold text-ink">Recent check-ins</h3>
              {attendLog.length === 0 ? (
                <p className="mt-3 text-xs text-dim">No check-ins yet.</p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {attendLog.map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink">{a.name}</span>
                      <span className="text-dim">{relTime(a.checkedInAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
          <DataTable
            columns={[
              { key: "name", header: "Participant", render: (p: (typeof participants)[number]) => (<div><p className="font-medium text-ink">{p.name}</p><p className="font-mono text-[11px] text-dim">{p.reg.qrCode}</p></div>) },
              { key: "team", header: "Team", render: (p) => p.teamName ?? <span className="text-dim">Solo</span> },
              { key: "status", header: "Door status", render: (p) => (p.reg.status === "attended" ? <Badge tone="green"><CheckCircle2 className="size-3" aria-hidden /> In</Badge> : <Badge tone="slate">Awaiting</Badge>) },
              {
                key: "action",
                header: "",
                className: "text-right",
                render: (p) =>
                  p.reg.status === "attended" ? (
                    <span className="text-xs text-dim">{p.reg.attendedAt ? relTime(p.reg.attendedAt) : ""}</span>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => doCheckIn(p.reg.qrCode)}>
                      Simulate scan
                    </Button>
                  ),
              },
            ]}
            rows={participants}
            rowKey={(p) => p.reg.id}
            empty="No eligible participants."
          />
        </div>
      )}

      {/* ---------------------------- ANNOUNCEMENTS ---------------------------- */}
      {tab === "announcements" && (
        <div className="grid gap-5 lg:grid-cols-[400px_1fr]">
          <Card>
            <h3 className="flex items-center gap-2 font-display font-semibold text-ink">
              <Megaphone className="size-5 text-violet-300" aria-hidden /> Broadcast to participants
            </h3>
            <form onSubmit={post} className="mt-4 space-y-4" noValidate>
              <Input label="Title" value={announcement.title} onChange={(e) => setAnnouncement((a) => ({ ...a, title: e.target.value }))} error={annErrors.title} placeholder="Reporting time changed" />
              <Textarea label="Message" value={announcement.body} onChange={(e) => setAnnouncement((a) => ({ ...a, body: e.target.value }))} error={annErrors.body} placeholder="Gates open at 8:30 AM…" className="min-h-24" />
              <Button type="submit" icon={Send} disabled={detail.registered === 0}>
                Notify {detail.registered} participant{detail.registered === 1 ? "" : "s"}
              </Button>
            </form>
          </Card>
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <EmptyState icon={Megaphone} title="No announcements" body="Broadcasts appear here and land in every participant's notification center." />
            ) : (
              announcements.map((a) => (
                <Card key={a.id}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-ink">{a.title}</p>
                    <span className="text-xs text-dim">{relTime(a.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{a.body}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ------------------------------- RESULTS ------------------------------- */}
      {tab === "results" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={event.scoresSubmitted ? "green" : "amber"}>{event.scoresSubmitted ? "Judge submitted" : "Awaiting judge"}</Badge>
            <Badge tone={event.resultsPublished ? "green" : "slate"}>{event.resultsPublished ? "Published" : "Unpublished"}</Badge>
            <span className="text-xs text-muted">Judge: {detail.facultyName}</span>
            <div className="ml-auto flex gap-2">
              <Button variant="primary" size="sm" icon={Trophy} disabled={!event.scoresSubmitted || event.resultsPublished} onClick={() => setPublishOpen(true)}>
                Approve & publish results
              </Button>
              <Button variant="secondary" size="sm" icon={Award} onClick={() => setCertsOpen(true)}>
                Issue participation certificates
              </Button>
            </div>
          </div>

          {standingRows.length === 0 ? (
            <EmptyState icon={Trophy} title="No scores yet" body={`${detail.facultyName} enters scores from the Faculty dashboard. Once submitted, you can approve and publish them here.`} />
          ) : (
            <DataTable
              columns={[
                { key: "pos", header: "Pos", render: (s: (typeof standingRows)[number]) => <span className="font-display font-bold text-ink">#{s.position}</span> },
                { key: "name", header: "Participant", render: (s) => (<div><p className="font-medium text-ink">{s.name}</p><p className="text-xs text-dim">{s.teamName ?? s.usn}</p></div>) },
                { key: "total", header: "Total (30)", render: (s) => <span className="font-mono font-bold text-cyan-300">{s.total}</span> },
                { key: "rank", header: "Placement", render: (s) => (s.rankLabel ? <Badge tone="amber">{s.rankLabel}</Badge> : <span className="text-xs text-dim">—</span>) },
              ]}
              rows={standingRows}
              rowKey={(s) => s.registrationId}
              empty="No scores."
            />
          )}
        </div>
      )}

      {/* -------------------------------- BUDGET ------------------------------- */}
      {tab === "budget" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <StatCard icon={Banknote} label="Income" value={fmtMoney(summary.income)} accent="green" />
              <StatCard icon={Wallet} label="Spend" value={fmtMoney(summary.spend)} accent="rose" />
              <StatCard icon={IndianRupee} label="Balance" value={fmtMoney(summary.balance)} accent="cyan" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-ink">Ledger</h3>
              <Button size="sm" icon={IndianRupee} onClick={() => setBudgetOpen(true)}>
                Add entry
              </Button>
            </div>
            <DataTable
              dense
              columns={[
                { key: "kind", header: "Type", render: (r: (typeof entries)[number]) => <Badge tone={r.kind === "income" ? "green" : "rose"}>{r.kind}</Badge> },
                { key: "label", header: "Description", render: (r) => (<div><p className="font-medium text-ink">{r.label}</p><p className="text-xs text-dim">{r.category}</p></div>) },
                { key: "date", header: "Date", render: (r) => <span className="text-xs text-muted">{fmtDate(r.date)}</span> },
                { key: "amount", header: "Amount", render: (r) => <span className={cn("font-mono font-bold", r.kind === "income" ? "text-emerald-300" : "text-rose-300")}>{r.kind === "income" ? "+" : "-"}{fmtMoney(r.amount)}</span> },
                { key: "x", header: "", className: "text-right", render: (r) => <button onClick={() => deleteBudgetEntry(r.id)} className="rounded-lg p-1.5 text-dim hover:text-rose-300" aria-label={`Delete ${r.label}`}><Trash2 className="size-4" /></button> },
              ]}
              rows={entries}
              rowKey={(r) => r.id}
              empty="No ledger entries yet."
            />
          </div>
          <Card>
            <h3 className="font-display font-semibold text-ink">Income vs spend</h3>
            <div className="mt-2 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{ name: "Income", value: summary.income }, { name: "Spend", value: summary.spend }]} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={4} stroke="none">
                    <Cell fill="#34d399" />
                    <Cell fill="#fb7185" />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------- SETTINGS ------------------------------ */}
      {tab === "settings" && (
        <div className="max-w-xl space-y-5">
          <Card>
            <h3 className="font-display font-semibold text-ink">Edit configuration</h3>
            <p className="mt-1.5 text-sm text-muted">Update schedule, venue, capacity, rules and judging assignments.</p>
            <Link to={`/app/coordinator/events/${event.id}/edit`} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 text-sm font-semibold text-white">
              <Pencil className="size-4" aria-hidden /> Open editor
            </Link>
          </Card>
          <Card className="border-rose-500/25">
            <h3 className="font-display font-semibold text-rose-300">Danger zone</h3>
            <p className="mt-1.5 text-sm text-muted">Deleting removes the event permanently. Blocked automatically when registrations exist.</p>
            <Button variant="danger" size="sm" className="mt-4" icon={Trash2} onClick={() => setDeleteOpen(true)}>
              Delete event
            </Button>
          </Card>
        </div>
      )}

      {/* ------------------------------ modals ------------------------------- */}
      <Modal open={budgetOpen} onClose={() => setBudgetOpen(false)} title="Add budget entry" size="sm">
        <form onSubmit={addEntry} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-panel p-1.5">
            {(["income", "expense"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setBudget((b) => ({ ...b, kind: k }))} className={cn("rounded-lg py-2 text-sm font-semibold capitalize transition-all", budget.kind === k ? (k === "income" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white") : "text-muted hover:text-ink")}>
                {k}
              </button>
            ))}
          </div>
          <Input label="Category" placeholder={budget.kind === "income" ? "e.g. Sponsorship" : "e.g. Prizes"} value={budget.category} onChange={(e) => setBudget((b) => ({ ...b, category: e.target.value }))} error={budgetErrors.category} />
          <Input label="Description" placeholder="NexaSoft title sponsorship" value={budget.label} onChange={(e) => setBudget((b) => ({ ...b, label: e.target.value }))} error={budgetErrors.label} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (₹)" type="number" min={1} value={budget.amount} onChange={(e) => setBudget((b) => ({ ...b, amount: e.target.value }))} error={budgetErrors.amount} />
            <Input label="Date" type="date" value={budget.date} onChange={(e) => setBudget((b) => ({ ...b, date: e.target.value }))} error={budgetErrors.date} />
          </div>
          <Button type="submit" className="w-full">
            Save entry
          </Button>
        </form>
      </Modal>

      <ConfirmDialog open={publishOpen} title="Publish results?" body="Standings are frozen, the event is marked completed, winner certificates are minted and participants are notified. This is irreversible." confirmLabel="Publish results" loading={busy} onConfirm={publishResults} onCancel={() => setPublishOpen(false)} />
      <ConfirmDialog open={certsOpen} title="Issue participation certificates?" body="Every checked-in attendee who doesn't have a certificate will receive one, with a unique verification ID." confirmLabel="Issue certificates" loading={busy} onConfirm={mintCerts} onCancel={() => setCertsOpen(false)} />
      <ConfirmDialog open={deleteOpen} title="Delete this event?" body={`“${event.title}” and its announcements/budget ledger will be permanently removed.`} confirmLabel="Delete permanently" danger onConfirm={destroyEvent} onCancel={() => setDeleteOpen(false)} />
    </div>
  );
}
