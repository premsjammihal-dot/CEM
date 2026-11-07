import { useState, type FormEvent } from "react";
import { KeyRound, Power, Search, UserPlus } from "lucide-react";
import { adminCreateUser } from "@/services/auth";
import { setUserActive, setUserRole, userRows } from "@/services/admin";
import { adminCreateUserSchema, zodErrors, type FieldErrors } from "@/lib/validators";
import { useApp } from "@/context/AppContext";
import { cn, relTime } from "@/lib/utils";
import type { Role } from "@/services/types";
import { Avatar, Badge, Button, Input, Select } from "@/components/ui";
import { DataTable } from "@/components/data";
import { Modal, useToast } from "@/components/overlays";

const ROLE_TONE: Record<Role, "violet" | "cyan" | "amber" | "rose"> = { student: "cyan", coordinator: "violet", faculty: "amber", admin: "rose" };

export default function UsersAdminPage() {
  const { user } = useApp();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "coordinator", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const rows = userRows().filter((r) => {
    const q = search.trim().toLowerCase();
    if (roleFilter && r.role !== roleFilter) return false;
    return !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.usn ?? "").toLowerCase().includes(q);
  });

  const changeRole = (id: string, role: Role) => {
    const res = setUserRole(user.id, id, role);
    if (res.ok) toast.success("Role updated");
    else toast.error("Blocked", res.error);
  };

  const toggleActive = (id: string, active: boolean) => {
    const res = setUserActive(user.id, id, active);
    if (res.ok) toast.success(active ? "Account reactivated" : "Account deactivated");
    else toast.error("Blocked", res.error);
  };

  const create = (e: FormEvent) => {
    e.preventDefault();
    const parsed = adminCreateUserSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setBusy(true);
    const res = adminCreateUser(parsed.data.name, parsed.data.email, parsed.data.phone, parsed.data.role, parsed.data.password);
    setBusy(false);
    if (!res.ok) {
      toast.error("Could not create account", res.error);
      return;
    }
    toast.success("Staff account created", `${parsed.data.name} can sign in immediately.`);
    setCreateOpen(false);
    setForm({ name: "", email: "", phone: "", role: "coordinator", password: "" });
    setErrors({});
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Users</h1>
          <p className="mt-1 text-sm text-muted">Roles, activation and staff account provisioning.</p>
        </div>
        <Button icon={UserPlus} onClick={() => setCreateOpen(true)}>
          New staff account
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <Input icon={Search} placeholder="Search name, email or USN…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
        <Select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          placeholder="All roles"
          options={(["student", "coordinator", "faculty", "admin"] as Role[]).map((r) => ({ value: r, label: r }))}
        />
      </div>

      <DataTable
        columns={[
          {
            key: "user",
            header: "User",
            render: (r: (typeof rows)[number]) => (
              <div className="flex items-center gap-3">
                <Avatar name={r.name} size="sm" />
                <div>
                  <p className="font-medium text-ink">{r.name}{r.id === user.id && <Badge tone="slate" className="ml-2">You</Badge>}</p>
                  <p className="text-xs text-dim">{r.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (r) => (
              r.id === user.id ? (
                <Badge tone={ROLE_TONE[r.role]}>{r.role}</Badge>
              ) : (
                <select
                  aria-label={`Role for ${r.name}`}
                  value={r.role}
                  onChange={(e) => changeRole(r.id, e.target.value as Role)}
                  className="h-8 rounded-lg border border-line bg-panel px-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                >
                  {(["student", "coordinator", "faculty", "admin"] as Role[]).map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              )
            ),
          },
          { key: "academic", header: "Academic", render: (r) => (r.usn ? <span className="text-xs text-muted">{r.usn} · {r.department} · Sem {r.semester}</span> : <span className="text-xs text-dim">—</span>) },
          { key: "regs", header: "Regs", render: (r) => <span className="font-mono text-sm text-cyan-300">{r.registrations}</span> },
          { key: "joined", header: "Joined", render: (r) => <span className="text-xs text-muted">{relTime(r.createdAt)}</span> },
          {
            key: "active",
            header: "Status",
            className: "text-right",
            render: (r) => (
              <button
                onClick={() => toggleActive(r.id, !r.active)}
                disabled={r.id === user.id}
                aria-label={r.active ? `Deactivate ${r.name}` : `Activate ${r.name}`}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors disabled:opacity-40",
                  r.active ? "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10" : "border-rose-500/30 text-rose-300 hover:bg-rose-500/10",
                )}
              >
                <Power className="size-3.5" aria-hidden />
                {r.active ? "Active" : "Disabled"}
              </button>
            ),
          },
        ]}
        rows={rows}
        rowKey={(r) => r.id}
        empty="No users match the current filters."
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Provision staff account" size="sm">
        <form onSubmit={create} className="space-y-4" noValidate>
          <Input label="Full name" value={form.name} onChange={set("name")} error={errors.name} placeholder="Riya Sharma" />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="name@campussphere.edu" />
          <Input label="Phone" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="10-digit mobile" />
          <Select
            label="Role"
            value={form.role}
            onChange={set("role")}
            error={errors.role}
            options={[
              { value: "coordinator", label: "Event Coordinator" },
              { value: "faculty", label: "Faculty / Judge" },
            ]}
          />
          <Input label="Temporary password" type="text" icon={KeyRound} value={form.password} onChange={set("password")} error={errors.password} hint="Share securely; the staff member should change it from Profile." />
          <Button type="submit" className="w-full" loading={busy}>
            Create account
          </Button>
        </form>
      </Modal>
    </div>
  );
}
