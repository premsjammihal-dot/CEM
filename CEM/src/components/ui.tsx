import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles, type LucideIcon } from "lucide-react";
import { avatarGradient, cn, initials } from "@/lib/utils";

/* --------------------------------- Buttons --------------------------------- */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "neon";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-purple-500 focus-visible:outline-violet-400",
  neon: "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-900/40 hover:from-cyan-400 hover:to-violet-500 focus-visible:outline-cyan-400",
  secondary: "bg-panel-2 text-ink border border-line hover:bg-panel-3 hover:border-slate-500/40 focus-visible:outline-slate-400",
  outline:
    "border border-violet-500/50 text-violet-300 hover:bg-violet-500/10 hover:border-violet-400 focus-visible:outline-violet-400",
  ghost: "text-muted hover:text-ink hover:bg-white/5 focus-visible:outline-slate-400",
  danger: "bg-rose-600/90 text-white hover:bg-rose-500 focus-visible:outline-rose-400",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2.5",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
}

export function Button({ variant = "primary", size = "md", loading, icon: Icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center rounded-xl font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon ? <Icon className="size-4" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function LinkButton({
  to,
  variant = "primary",
  size = "md",
  className,
  children,
  icon: Icon,
}: {
  to: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-xl font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
    >
      {Icon ? <Icon className="size-4" aria-hidden /> : null}
      {children}
    </Link>
  );
}

/* ---------------------------------- Inputs --------------------------------- */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
}

export function Input({ label, error, hint, icon: Icon, id, className, ...rest }: InputProps) {
  const inputId = id ?? rest.name ?? label;
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {Icon ? <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-dim" aria-hidden /> : null}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 w-full rounded-xl border bg-panel px-3.5 text-sm text-ink placeholder:text-dim transition-colors focus:outline-none focus:ring-2",
            Icon && "pl-10",
            error ? "border-rose-500/60 focus:ring-rose-500/30" : "border-line focus:border-violet-500/60 focus:ring-violet-500/20",
            className,
          )}
          {...rest}
        />
      </div>
      {error ? <p className="text-xs text-rose-400">{error}</p> : hint ? <p className="text-xs text-dim">{hint}</p> : null}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, id, className, ...rest }: TextareaProps) {
  const inputId = id ?? rest.name ?? label;
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-28 w-full resize-y rounded-xl border bg-panel px-3.5 py-3 text-sm text-ink placeholder:text-dim focus:outline-none focus:ring-2",
          error ? "border-rose-500/60 focus:ring-rose-500/30" : "border-line focus:border-violet-500/60 focus:ring-violet-500/20",
          className,
        )}
        {...rest}
      />
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, id, className, ...rest }: SelectProps) {
  const inputId = id ?? rest.name ?? label;
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
      ) : null}
      <select
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-11 w-full appearance-none rounded-xl border bg-panel px-3.5 text-sm text-ink focus:outline-none focus:ring-2 [&>option]:bg-panel-2",
          error ? "border-rose-500/60 focus:ring-rose-500/30" : "border-line focus:border-violet-500/60 focus:ring-violet-500/20",
          className,
        )}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

type Tone = "violet" | "cyan" | "green" | "amber" | "rose" | "slate" | "pink";

const tones: Record<Tone, string> = {
  violet: "bg-violet-500/12 text-violet-300 border-violet-400/30",
  cyan: "bg-cyan-500/12 text-cyan-300 border-cyan-400/30",
  green: "bg-emerald-500/12 text-emerald-300 border-emerald-400/30",
  amber: "bg-amber-500/12 text-amber-300 border-amber-400/30",
  rose: "bg-rose-500/12 text-rose-300 border-rose-400/30",
  slate: "bg-slate-500/12 text-slate-300 border-slate-400/30",
  pink: "bg-pink-500/12 text-pink-300 border-pink-400/30",
};

export function Badge({ tone = "violet", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider", tones[tone], className)}>
      {children}
    </span>
  );
}

/* ----------------------------------- Card ---------------------------------- */

export function Card({ children, className, hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={cn("glass rounded-2xl p-5", hover && "card-hover", className)}>{children}</div>;
}

export function StatCard({ icon: Icon, label, value, sub, accent = "violet" }: { icon: LucideIcon; label: string; value: string | number; sub?: string; accent?: "violet" | "cyan" | "green" | "amber" | "rose" }) {
  const accents: Record<string, string> = {
    violet: "from-violet-500/25 to-transparent text-violet-300",
    cyan: "from-cyan-500/25 to-transparent text-cyan-300",
    green: "from-emerald-500/25 to-transparent text-emerald-300",
    amber: "from-amber-500/25 to-transparent text-amber-300",
    rose: "from-rose-500/25 to-transparent text-rose-300",
  };
  return (
    <div className="glass card-hover rounded-2xl p-5">
      <div className={cn("mb-4 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br", accents[accent])}>
        <Icon className="size-5" aria-hidden />
      </div>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      {sub ? <p className="mt-1 text-[11px] text-dim">{sub}</p> : null}
    </div>
  );
}

/* ---------------------------------- Avatar --------------------------------- */

export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" };
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white", avatarGradient(name), sizes[size], className)}
      aria-label={name}
    >
      {initials(name)}
    </span>
  );
}

/* --------------------------------- Progress -------------------------------- */

export function Progress({ value, tone = "violet", className }: { value: number; tone?: "violet" | "cyan" | "green" | "amber" | "rose"; className?: string }) {
  const t = { violet: "from-violet-500 to-purple-400", cyan: "from-cyan-500 to-sky-400", green: "from-emerald-500 to-teal-400", amber: "from-amber-500 to-orange-400", rose: "from-rose-500 to-pink-400" }[tone];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/8", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", t)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* --------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl", className)} aria-hidden />;
}

/* -------------------------------- EmptyState ------------------------------- */

export function EmptyState({ icon: Icon = Sparkles, title, body, action }: { icon?: LucideIcon; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
        <Icon className="size-7" aria-hidden />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {body ? <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ----------------------------------- Logo ---------------------------------- */

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="CampusSphere home">
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-lg shadow-violet-900/50">
        <span className="absolute size-2.5 rounded-full bg-white/90" />
        <span className="absolute size-6 rounded-full border-2 border-white/35" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight text-ink">
          Campus<span className="gradient-text">Sphere</span>
        </span>
      )}
    </Link>
  );
}

/* ----------------------------- Section heading ----------------------------- */

export function SectionHeading({ kicker, title, sub, center = false }: { kicker?: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {kicker ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">{kicker}</p>
      ) : null}
      <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {sub ? <p className="mt-3 text-muted">{sub}</p> : null}
    </div>
  );
}
