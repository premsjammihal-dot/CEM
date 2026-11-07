import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Mail, RotateCcw, ShieldCheck } from "lucide-react";
import { requestPasswordReset, resetPassword } from "@/services/auth";
import { useToast } from "@/components/overlays";
import { Button, Input, Logo } from "@/components/ui";

export default function ResetPasswordPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [code, setCode] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const request = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = requestPasswordReset(email);
    setBusy(false);
    if (!res.ok || !res.data) {
      toast.error("Reset failed", res.error);
      return;
    }
    // Demo: Supabase would email this link; here it is surfaced in the UI.
    setDemoCode(res.data.demoCode);
    setStep(2);
    toast.info("Reset code generated", "In production this is emailed via Supabase. The demo shows it on screen.");
  };

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) {
      toast.error("Weak password", "New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      toast.error("Mismatch", "Passwords do not match.");
      return;
    }
    setBusy(true);
    const res = resetPassword(email, code, next);
    setBusy(false);
    if (!res.ok) {
      toast.error("Reset failed", res.error);
      return;
    }
    toast.success("Password updated", "Sign in with your new password.");
    navigate("/login");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-md animate-rise">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="glass rounded-3xl p-8">
          <h1 className="font-display text-2xl font-bold text-ink">Reset password</h1>
          <p className="mt-1.5 text-sm text-muted">
            {step === 1 ? "Enter your account email to receive a reset code." : "Enter the 6-digit code and choose a new password."}
          </p>

          {step === 2 && demoCode && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3" role="status">
              <p className="flex items-center gap-2 text-xs font-semibold text-amber-200">
                <ShieldCheck className="size-4" aria-hidden /> Demo mode — your reset code is
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-[0.4em] text-amber-300">{demoCode}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={request} className="mt-6 space-y-5">
              <Input label="Email" type="email" icon={Mail} placeholder="you@campussphere.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" className="w-full" size="lg" loading={busy} icon={RotateCcw}>
                Send reset code
              </Button>
            </form>
          ) : (
            <form onSubmit={apply} className="mt-6 space-y-5">
              <Input label="Reset code" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} required />
              <Input label="New password" type="password" icon={KeyRound} placeholder="Min. 6 characters" value={next} onChange={(e) => setNext(e.target.value)} required />
              <Input label="Confirm new password" type="password" icon={KeyRound} placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              <Button type="submit" className="w-full" size="lg" loading={busy}>
                Update password
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-muted">
            Remember it?{" "}
            <Link to="/login" className="font-medium text-cyan-300 hover:text-cyan-200">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
