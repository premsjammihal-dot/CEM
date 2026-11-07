import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Info, KeyRound, LogIn, Mail } from "lucide-react";
import { dashboardPathFor, useApp } from "@/context/AppContext";
import { demoAccounts } from "@/services/auth";
import { cn } from "@/lib/utils";
import { loginSchema, zodErrors, type FieldErrors } from "@/lib/validators";
import { useToast } from "@/components/overlays";
import { Button, Input, Logo } from "@/components/ui";

export default function LoginPage() {
  const { loginWith } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const state = location.state as { from?: string; msg?: string } | null;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    const res = loginWith(form.email, form.password);
    setBusy(false);
    if (!res.ok || !res.data) {
      toast.error("Sign-in failed", res.error ?? "Unknown error");
      return;
    }
    toast.success(`Welcome back, ${res.data.profile.name.split(" ")[0]}`);
    const target = state?.from && state.from !== "/login" ? state.from : dashboardPathFor(res.data.profile.role);
    navigate(target, { replace: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="absolute -left-32 top-1/4 size-96 rounded-full bg-violet-600/20 blur-3xl" aria-hidden />
      <div className="absolute -right-32 bottom-1/4 size-96 rounded-full bg-cyan-500/15 blur-3xl" aria-hidden />

      <div className="relative w-full max-w-md animate-rise">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="glass rounded-3xl p-8">
          <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted">Sign in to your CampusSphere account.</p>

          {state?.msg && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/8 px-4 py-3 text-sm text-cyan-200" role="alert">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {state.msg}
            </div>
          )}

          <form onSubmit={submit} noValidate className="mt-6 space-y-5">
            <Input label="Email" name="email" type="email" autoComplete="email" icon={Mail} placeholder="you@campussphere.edu" value={form.email} error={errors.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Input label="Password" name="password" type="password" autoComplete="current-password" icon={KeyRound} placeholder="••••••••" value={form.password} error={errors.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            <Button type="submit" className="w-full" size="lg" loading={busy} icon={LogIn}>
              Sign in
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link to="/reset-password" className="font-medium text-cyan-300 hover:text-cyan-200">
              Forgot password?
            </Link>
            <Link to="/register" className="font-medium text-violet-300 hover:text-violet-200">
              Create student account
            </Link>
          </div>
        </div>

        <div className="glass mt-5 rounded-2xl p-5">
          <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-dim">Demo accounts — tap to fill</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts().map((a) => (
              <button
                key={a.email}
                onClick={() => setForm({ email: a.email, password: a.password })}
                className={cn(
                  "rounded-xl border border-line px-3 py-2.5 text-left transition-colors hover:border-violet-500/50 hover:bg-violet-500/8",
                  form.email === a.email && "border-violet-500/60 bg-violet-500/10",
                )}
              >
                <span className="block text-xs font-semibold text-ink">{a.label}</span>
                <span className="block truncate text-[10px] text-dim">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
