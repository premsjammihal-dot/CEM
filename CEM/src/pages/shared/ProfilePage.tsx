import { useState, type FormEvent } from "react";
import { KeyRound, Save, UserRound } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { changePassword, updateProfile } from "@/services/auth";
import { db } from "@/services/db";
import { passwordChangeSchema, profileSchema, zodErrors, type FieldErrors } from "@/lib/validators";
import { fmtDate } from "@/lib/utils";
import { Avatar, Badge, Button, Card, Input, Select } from "@/components/ui";
import { useToast } from "@/components/overlays";

const ROLE_LABEL = { student: "Student", coordinator: "Event Coordinator", faculty: "Faculty / Judge", admin: "Super Admin" } as const;

export default function ProfilePage() {
  const { user, student, refreshSession } = useApp();
  const toast = useToast();
  const [pForm, setPForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", semester: String(student?.semester ?? 1) });
  const [pErrors, setPErrors] = useState<FieldErrors>({});
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<FieldErrors>({});

  if (!user) return null;
  const dept = student ? db().departments.find((d) => d.id === student.departmentId) : null;

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    const payload = { name: pForm.name, phone: pForm.phone, semester: Number(pForm.semester) };
    const parsed = profileSchema.safeParse(payload);
    if (!parsed.success) {
      setPErrors(zodErrors(parsed.error));
      return;
    }
    const res = updateProfile(user.id, payload);
    if (res.ok) {
      refreshSession();
      toast.success("Profile updated");
    } else toast.error("Update failed", res.error);
  };

  const savePassword = (e: FormEvent) => {
    e.preventDefault();
    const parsed = passwordChangeSchema.safeParse(pw);
    if (!parsed.success) {
      setPwErrors(zodErrors(parsed.error));
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwErrors({ confirm: "Passwords do not match" });
      return;
    }
    const res = changePassword(user.id, pw.current, pw.next);
    if (res.ok) {
      setPw({ current: "", next: "", confirm: "" });
      setPwErrors({});
      toast.success("Password changed");
    } else {
      setPwErrors({ current: res.error ?? "Could not change password" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Profile</h1>
        <p className="mt-1 text-sm text-muted">Identity, academics and security.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-bold text-ink">{user.name}</p>
              <p className="text-sm text-muted">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="violet">{ROLE_LABEL[user.role]}</Badge>
              {student && <Badge tone="cyan">{student.usn}</Badge>}
              {dept && <Badge tone="slate">{dept.code}</Badge>}
              {student && <Badge tone="slate">Sem {student.semester}</Badge>}
              <Badge tone="green">Member since {fmtDate(user.createdAt.slice(0, 10))}</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <UserRound className="size-5 text-violet-300" aria-hidden /> Details
          </h2>
          <form onSubmit={saveProfile} className="mt-5 space-y-4" noValidate>
            <Input label="Full name" value={pForm.name} onChange={(e) => setPForm((f) => ({ ...f, name: e.target.value }))} error={pErrors.name} />
            <Input label="Phone" value={pForm.phone} onChange={(e) => setPForm((f) => ({ ...f, phone: e.target.value }))} error={pErrors.phone} inputMode="numeric" />
            {student ? (
              <Select
                label="Semester"
                value={pForm.semester}
                onChange={(e) => setPForm((f) => ({ ...f, semester: e.target.value }))}
                options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: String(s), label: `Semester ${s}` }))}
              />
            ) : null}
            <Input label="Email (managed)" value={user.email} disabled hint="Email changes go through the Super Admin." />
            <Button type="submit" icon={Save}>
              Save changes
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <KeyRound className="size-5 text-cyan-300" aria-hidden /> Security
          </h2>
          <form onSubmit={savePassword} className="mt-5 space-y-4" noValidate>
            <Input label="Current password" type="password" value={pw.current} onChange={(e) => setPw((f) => ({ ...f, current: e.target.value }))} error={pwErrors.current} autoComplete="current-password" />
            <Input label="New password" type="password" value={pw.next} onChange={(e) => setPw((f) => ({ ...f, next: e.target.value }))} error={pwErrors.next} autoComplete="new-password" />
            <Input label="Confirm new password" type="password" value={pw.confirm} onChange={(e) => setPw((f) => ({ ...f, confirm: e.target.value }))} error={pwErrors.confirm} autoComplete="new-password" />
            <Button type="submit" variant="secondary" icon={KeyRound}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
