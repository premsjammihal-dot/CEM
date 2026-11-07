import { useState, type FormEvent } from "react";
import { Building2, CheckCircle2, Inbox, Landmark, Plus, RotateCcw, Save, Settings2, Trash2 } from "lucide-react";
import { db, resetDemo } from "@/services/db";
import { addDepartment, addVenue, deleteDepartment, deleteVenue, saveSettings } from "@/services/admin";
import { contactMessages, markContactHandled } from "@/services/engage";
import { departmentSchema, venueSchema, zodErrors, type FieldErrors } from "@/lib/validators";
import { useApp } from "@/context/AppContext";
import { fmtMoney, relTime } from "@/lib/utils";
import { Badge, Button, Card, EmptyState, Input } from "@/components/ui";
import { DataTable, Tabs } from "@/components/data";
import { ConfirmDialog, useToast } from "@/components/overlays";

export default function OrgAdminPage() {
  const { refreshSession } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState("departments");

  const [dept, setDept] = useState({ name: "", code: "" });
  const [deptErrors, setDeptErrors] = useState<FieldErrors>({});
  const [venue, setVenue] = useState({ name: "", location: "", capacity: "" });
  const [venueErrors, setVenueErrors] = useState<FieldErrors>({});
  const [settingsForm, setSettingsForm] = useState(() => ({ ...db().settings }));
  const [resetOpen, setResetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const departments = db().departments;
  const venues = db().venues;
  const inbox = contactMessages();

  const submitDept = (e: FormEvent) => {
    e.preventDefault();
    const parsed = departmentSchema.safeParse(dept);
    if (!parsed.success) return setDeptErrors(zodErrors(parsed.error));
    const res = addDepartment(parsed.data.name, parsed.data.code);
    if (res.ok) {
      toast.success("Department added", parsed.data.code.toUpperCase());
      setDept({ name: "", code: "" });
      setDeptErrors({});
    } else toast.error("Failed", res.error);
  };

  const submitVenue = (e: FormEvent) => {
    e.preventDefault();
    const parsed = venueSchema.safeParse(venue);
    if (!parsed.success) return setVenueErrors(zodErrors(parsed.error));
    const res = addVenue(parsed.data.name, parsed.data.location, parsed.data.capacity);
    if (res.ok) {
      toast.success("Venue added", parsed.data.name);
      setVenue({ name: "", location: "", capacity: "" });
      setVenueErrors({});
    } else toast.error("Failed", res.error);
  };

  const doReset = () => {
    setBusy(true);
    resetDemo();
    refreshSession();
    setBusy(false);
    setResetOpen(false);
    toast.success("Demo data reset", "All tables restored to the seeded snapshot (non-seed sessions will need to sign in again).");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Organization</h1>
        <p className="mt-1 text-sm text-muted">Departments, venues, contact inbox and platform settings.</p>
      </div>

      <Tabs
        tabs={[
          { id: "departments", label: "Departments", count: departments.length },
          { id: "venues", label: "Venues", count: venues.length },
          { id: "inbox", label: "Contact inbox", count: inbox.filter((m) => !m.handled).length },
          { id: "settings", label: "Settings" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "departments" && (
        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <Card>
            <h3 className="flex items-center gap-2 font-display font-semibold text-ink">
              <Building2 className="size-5 text-violet-300" aria-hidden /> Add department
            </h3>
            <form onSubmit={submitDept} className="mt-4 space-y-4" noValidate>
              <Input label="Name" placeholder="Data Science & Engineering" value={dept.name} onChange={(e) => setDept((d) => ({ ...d, name: e.target.value }))} error={deptErrors.name} />
              <Input label="Code" placeholder="DSE" value={dept.code} onChange={(e) => setDept((d) => ({ ...d, code: e.target.value.toUpperCase() }))} error={deptErrors.code} />
              <Button type="submit" icon={Plus}>
                Add department
              </Button>
            </form>
          </Card>
          <DataTable
            columns={[
              { key: "code", header: "Code", render: (d: (typeof departments)[number]) => <Badge tone="cyan">{d.code}</Badge> },
              { key: "name", header: "Name", render: (d) => <span className="font-medium text-ink">{d.name}</span> },
              { key: "students", header: "Students", render: (d) => <span className="font-mono text-sm text-muted">{db().students.filter((s) => s.departmentId === d.id).length}</span> },
              {
                key: "act",
                header: "",
                className: "text-right",
                render: (d) => (
                  <button
                    onClick={() => {
                      const res = deleteDepartment(d.id);
                      if (res.ok) toast.success("Department removed");
                      else toast.error("Blocked", res.error);
                    }}
                    className="rounded-lg p-1.5 text-dim transition-colors hover:text-rose-300"
                    aria-label={`Delete ${d.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                ),
              },
            ]}
            rows={departments}
            rowKey={(d) => d.id}
          />
        </div>
      )}

      {tab === "venues" && (
        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <Card>
            <h3 className="flex items-center gap-2 font-display font-semibold text-ink">
              <Landmark className="size-5 text-cyan-300" aria-hidden /> Add venue
            </h3>
            <form onSubmit={submitVenue} className="mt-4 space-y-4" noValidate>
              <Input label="Name" placeholder="Seminar Hall 2" value={venue.name} onChange={(e) => setVenue((v) => ({ ...v, name: e.target.value }))} error={venueErrors.name} />
              <Input label="Location" placeholder="Block B · 3rd Floor" value={venue.location} onChange={(e) => setVenue((v) => ({ ...v, location: e.target.value }))} error={venueErrors.location} />
              <Input label="Capacity" type="number" min={10} placeholder="200" value={venue.capacity} onChange={(e) => setVenue((v) => ({ ...v, capacity: e.target.value }))} error={venueErrors.capacity} />
              <Button type="submit" icon={Plus}>
                Add venue
              </Button>
            </form>
          </Card>
          <DataTable
            columns={[
              { key: "name", header: "Venue", render: (v: (typeof venues)[number]) => (<div><p className="font-medium text-ink">{v.name}</p><p className="text-xs text-dim">{v.location}</p></div>) },
              { key: "cap", header: "Capacity", render: (v) => <span className="font-mono text-sm text-cyan-300">{v.capacity}</span> },
              { key: "events", header: "Events hosted", render: (v) => <span className="font-mono text-sm text-muted">{db().events.filter((e) => e.venueId === v.id).length}</span> },
              {
                key: "act",
                header: "",
                className: "text-right",
                render: (v) => (
                  <button
                    onClick={() => {
                      const res = deleteVenue(v.id);
                      if (res.ok) toast.success("Venue removed");
                      else toast.error("Blocked", res.error);
                    }}
                    className="rounded-lg p-1.5 text-dim transition-colors hover:text-rose-300"
                    aria-label={`Delete ${v.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                ),
              },
            ]}
            rows={venues}
            rowKey={(v) => v.id}
          />
        </div>
      )}

      {tab === "inbox" && (
        inbox.length === 0 ? (
          <EmptyState icon={Inbox} title="Inbox zero" body="Messages from the public Contact page land here." />
        ) : (
          <div className="space-y-3">
            {inbox.map((m) => (
              <Card key={m.id} className={m.handled ? "opacity-60" : ""}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold text-ink">{m.subject}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {m.name} · {m.email} · {relTime(m.createdAt)}
                    </p>
                  </div>
                  {m.handled ? (
                    <Badge tone="green">Handled</Badge>
                  ) : (
                    <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => markContactHandled(m.id)}>
                      Mark handled
                    </Button>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{m.message}</p>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === "settings" && (
        <div className="grid max-w-3xl gap-5">
          <Card>
            <h3 className="flex items-center gap-2 font-display font-semibold text-ink">
              <Settings2 className="size-5 text-violet-300" aria-hidden /> Platform settings
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveSettings(settingsForm);
                toast.success("Settings saved");
              }}
              className="mt-4 space-y-4"
            >
              <Input label="Site name" value={settingsForm.siteName} onChange={(e) => setSettingsForm((s) => ({ ...s, siteName: e.target.value }))} />
              <Input label="College name" value={settingsForm.collegeName} onChange={(e) => setSettingsForm((s) => ({ ...s, collegeName: e.target.value }))} />
              <Input label="Contact email" type="email" value={settingsForm.contactEmail} onChange={(e) => setSettingsForm((s) => ({ ...s, contactEmail: e.target.value }))} />
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-panel px-4 py-3">
                <span className="text-sm text-muted">
                  Registrations open <span className="block text-[11px] text-dim">When off, every register action returns an error.</span>
                </span>
                <input type="checkbox" checked={settingsForm.allowRegistrations} onChange={(e) => setSettingsForm((s) => ({ ...s, allowRegistrations: e.target.checked }))} className="size-5 accent-violet-500" />
              </label>
              <Button type="submit" icon={Save}>
                Save settings
              </Button>
            </form>
          </Card>

          <Card className="border-rose-500/25">
            <h3 className="flex items-center gap-2 font-display font-semibold text-rose-300">
              <RotateCcw className="size-5" aria-hidden /> Danger zone
            </h3>
            <p className="mt-1.5 text-sm text-muted">
              Reset the entire demo dataset to its seeded snapshot. Useful after workshops. {fmtMoney(0).slice(0, 1)} balances, registrations and accounts revert.
            </p>
            <Button variant="danger" size="sm" className="mt-4" icon={RotateCcw} onClick={() => setResetOpen(true)}>
              Reset demo data
            </Button>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={resetOpen}
        title="Reset all demo data?"
        body="Every table returns to the seeded snapshot. Accounts created during this session disappear and their sessions must sign in again."
        confirmLabel="Reset everything"
        danger
        loading={busy}
        onConfirm={doReset}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  );
}
