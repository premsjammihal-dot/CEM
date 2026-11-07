import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Mail, Phone, ShieldCheck, UserRound, KeyRound } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { db } from "@/services/db";
import { registerSchema, zodErrors, type FieldErrors } from "@/lib/validators";
import { useToast } from "@/components/overlays";
import { Button, Input, Logo, Select } from "@/components/ui";

export default function RegisterPage() {
  const { registerWith } = useApp();
  const navigate = useNavigate();
  const toast = useToast();
  const departments = db().departments;

  const [form, setForm] = useState({
    name: "",
    usn: "",
    email: "",
    phone: "",
    departmentId: "",
    semester: "1",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    if (form.password !== form.confirm) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }
    setErrors({});
    setBusy(true);
    const res = registerWith({
      name: form.name,
      usn: form.usn,
      email: form.email,
      phone: form.phone,
      departmentId: form.departmentId,
      semester: Number(form.semester),
      password: form.password,
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Registration failed", res.error);
      return;
    }
    toast.success("Account created", "Welcome to CampusSphere — explore events now.");
    navigate("/app/student", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="absolute -right-32 top-1/4 size-96 rounded-full bg-violet-600/15 blur-3xl" aria-hidden />

      <div className="relative w-full max-w-xl animate-rise">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="glass rounded-3xl p-8">
          <h1 className="font-display text-2xl font-bold text-ink">Create your student account</h1>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-muted">
            <ShieldCheck className="size-4 text-emerald-300" aria-hidden /> Staff roles are assigned by the Super Admin after verification.
          </p>

          <form onSubmit={submit} noValidate className="mt-7 grid gap-5 sm:grid-cols-2">
            <Input label="Full name" icon={UserRound} placeholder="Aarav Kumar" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
            <Input label="USN" icon={GraduationCap} placeholder="1PI23CS001" value={form.usn} onChange={(e) => setForm((f) => ({ ...f, usn: e.target.value.toUpperCase() }))} error={errors.usn} />
            <Input label="Email" type="email" icon={Mail} placeholder="you@college.edu" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
            <Input label="Phone" icon={Phone} placeholder="10-digit mobile" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" inputMode="numeric" />
            <Select
              label="Department"
              placeholder="Select department"
              value={form.departmentId}
              onChange={set("departmentId")}
              error={errors.departmentId}
              options={departments.map((d) => ({ value: d.id, label: `${d.code} — ${d.name}` }))}
            />
            <Select label="Semester" value={form.semester} onChange={set("semester")} error={errors.semester} options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({ value: String(s), label: `Semester ${s}` }))} />
            <Input label="Password" type="password" icon={KeyRound} placeholder="Min. 6 characters" value={form.password} onChange={set("password")} error={errors.password} autoComplete="new-password" />
            <Input label="Confirm password" type="password" icon={KeyRound} placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} autoComplete="new-password" />
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" className="w-full" loading={busy}>
                Create account
              </Button>
              <p className="mt-4 text-center text-sm text-muted">
                Already registered?{" "}
                <Link to="/login" className="font-medium text-cyan-300 hover:text-cyan-200">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
