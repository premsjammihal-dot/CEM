import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CalendarDays, Clock, Copy, Crown, IndianRupee, MapPin, Plus, Ticket, UserPlus, Users, X } from "lucide-react";
import type { EventItem, Registration } from "@/services/types";
import { CATEGORY_STYLE, resolvePoster } from "@/assets/posters";
import { cn, daysUntil, fmtCurrency, fmtDate, fmtTime } from "@/lib/utils";
import { eventDetail } from "@/services/events";
import { registerIndividual, registerTeam } from "@/services/registrations";
import { teamRegisterSchema, zodErrors, type FieldErrors } from "@/lib/validators";
import { useApp } from "@/context/AppContext";
import { Badge, Button, Input, Progress } from "./ui";
import { Modal, useToast } from "./overlays";

/* ------------------------------- Poster thumb ------------------------------- */

export function PosterThumb({ poster, title, className }: { poster: string; title: string; className?: string }) {
  const ref = resolvePoster(poster);
  if (ref.kind === "img") {
    return <img src={ref.src} alt={`${title} poster`} className={cn("object-cover", className)} loading="lazy" />;
  }
  return (
    <div className={cn("bg-grid relative flex items-center justify-center overflow-hidden bg-gradient-to-br", ref.cls, className)} role="img" aria-label={`${title} poster`}>
      <span className="font-display text-2xl font-extrabold uppercase tracking-[0.3em] text-white/25">{title.slice(0, 2)}</span>
    </div>
  );
}

/* ------------------------------ Category badge ------------------------------ */

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider", CATEGORY_STYLE[category] ?? "text-slate-300 bg-slate-500/10 border-slate-400/25")}>
      {category}
    </span>
  );
}

/* --------------------------------- Event card ------------------------------- */

export function EventCard({ event }: { event: EventItem }) {
  const detail = eventDetail(event.id);
  const days = daysUntil(event.date);
  const pct = event.capacity > 0 ? Math.min(100, ((detail?.registered ?? 0) / event.capacity) * 100) : 0;
  const full = (detail?.spotsLeft ?? 1) <= 0;

  return (
    <Link
      to={`/events/${event.id}`}
      className="glass card-hover group flex h-full flex-col overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <PosterThumb poster={event.poster} title={event.title} className="size-full transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-base/90 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <CategoryBadge category={event.category} />
          {event.featured && <Badge tone="amber">Featured</Badge>}
        </div>
        <div className="absolute bottom-3 right-3 rounded-lg bg-base/80 px-2.5 py-1 text-xs font-bold text-cyan-300 backdrop-blur">
          {days === 0 ? "TODAY" : days < 0 ? "Concluded" : `in ${days}d`}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold text-ink transition-colors group-hover:text-violet-300">{event.title}</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-violet-300" aria-hidden /> {fmtDate(event.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-violet-300" aria-hidden /> {fmtTime(event.startTime)}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-violet-300" aria-hidden /> <span className="truncate">{detail?.venueName ?? "TBA"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <IndianRupee className="size-3.5 text-violet-300" aria-hidden /> {fmtCurrency(event.fee)}
          </span>
        </div>
        <div className="mt-4 flex-1">
          <div className="mb-1.5 flex justify-between text-[11px] text-dim">
            <span className="flex items-center gap-1">
              <Users className="size-3" aria-hidden /> {detail?.registered ?? 0}/{event.capacity}
            </span>
            <span>{full ? "Full" : `${detail?.spotsLeft ?? event.capacity} seats left`}</span>
          </div>
          <Progress value={pct} tone={full ? "rose" : pct > 75 ? "amber" : "cyan"} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            {event.teamSizeMax > 1 ? `Teams ${event.teamSizeMin}–${event.teamSizeMax}` : "Individual"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-300 transition-transform group-hover:translate-x-1">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------ Register modal ------------------------------ */

export function RegisterModal({ event, open, onClose, onRegistered }: { event: EventItem; open: boolean; onClose: () => void; onRegistered?: () => void }) {
  const { user } = useApp();
  const toast = useToast();
  const teamCapable = event.teamSizeMax > 1;
  const [mode, setMode] = useState<"individual" | "team">(event.teamSizeMin > 1 ? "team" : "individual");
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<string[]>([""]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const detail = eventDetail(event.id);

  const memberSlots = useMemo(() => Array.from({ length: Math.max(0, event.teamSizeMax - 1) }, (_, i) => i), [event.teamSizeMax]);
  const minExtra = event.teamSizeMin - 1;

  if (!user) return null;

  const finish = () => {
    setBusy(false);
    onClose();
    onRegistered?.();
  };

  const submitIndividual = () => {
    setBusy(true);
    const res = registerIndividual(user.id, event.id);
    if (!res.ok) {
      toast.error("Registration failed", res.error);
      setBusy(false);
      return;
    }
    toast.success("You're in!", `${event.title} — your QR ticket is ready in My Events.`);
    finish();
  };

  const submitTeam = () => {
    const memberUsns = members.map((m) => m.trim()).filter(Boolean);
    const parsed = teamRegisterSchema.safeParse({ teamName, memberUsns: minExtra > 0 && memberUsns.length === 0 ? [""] : memberUsns });
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    const res = registerTeam(user.id, event.id, teamName, memberUsns);
    if (!res.ok) {
      toast.error("Team registration failed", res.error);
      setBusy(false);
      return;
    }
    toast.success("Team registered", `“${teamName.trim()}” is locked in for ${event.title}.`);
    finish();
  };

  const updateMember = (i: number, v: string) => {
    setMembers((m) => m.map((x, idx) => (idx === i ? v : x)));
  };

  return (
    <Modal open={open} onClose={onClose} title={`Register — ${event.title}`} size="md">
      <div className="mb-5 grid grid-cols-3 gap-3 rounded-xl border border-line bg-panel p-3.5 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-dim">Entry fee</p>
          <p className="mt-0.5 font-display text-sm font-bold text-cyan-300">{fmtCurrency(event.fee)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-dim">Seats left</p>
          <p className="mt-0.5 font-display text-sm font-bold text-ink">{detail?.spotsLeft ?? event.capacity}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-dim">Format</p>
          <p className="mt-0.5 font-display text-sm font-bold text-ink">{teamCapable ? `${event.teamSizeMin}–${event.teamSizeMax} / team` : "Solo"}</p>
        </div>
      </div>

      {teamCapable && (
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-line bg-panel p-1.5">
          {(["individual", "team"] as const).map((m) => {
            const disabled = m === "individual" ? event.teamSizeMin > 1 : false;
            return (
              <button
                key={m}
                disabled={disabled}
                onClick={() => setMode(m)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40",
                  mode === m ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white" : "text-muted hover:text-ink",
                )}
              >
                {m === "individual" ? <Ticket className="size-4" aria-hidden /> : <Users className="size-4" aria-hidden />}
                {m === "individual" ? "Solo entry" : "Team entry"}
              </button>
            );
          })}
        </div>
      )}

      {mode === "individual" ? (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted">
            You are registering as <span className="font-semibold text-ink">{user.name}</span>
            {event.fee > 0 && (
              <>
                {" "}— the demo payment gateway will mark the <span className="font-semibold text-cyan-300">{fmtCurrency(event.fee)}</span> fee as paid instantly.
              </>
            )}
          </p>
          <Button onClick={submitIndividual} loading={busy} className="w-full" icon={Ticket} size="lg">
            Confirm registration
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Byte Bandits"
            error={errors.teamName}
            icon={Crown}
          />
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Member USNs {minExtra > 0 ? `(add at least ${minExtra})` : "(optional)"} — you're automatically the leader
            </p>
            <div className="space-y-2.5">
              {members.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={m} onChange={(e) => updateMember(i, e.target.value.toUpperCase())} placeholder={`USN of member ${i + 1}`} icon={UserPlus} aria-label={`USN of member ${i + 1}`} />
                  <button
                    onClick={() => setMembers((arr) => arr.filter((_, idx) => idx !== i))}
                    className="shrink-0 rounded-xl border border-line px-3 text-muted hover:border-rose-500/40 hover:text-rose-300"
                    aria-label={`Remove member ${i + 1}`}
                    disabled={members.length === 1}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              {members.length < memberSlots.length && (
                <button onClick={() => setMembers((arr) => [...arr, ""])} className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                  <Plus className="size-3.5" aria-hidden /> Add member ({memberSlots.length - members.length} slots left)
                </button>
              )}
            </div>
            {errors.memberUsns ? <p className="mt-1.5 text-xs text-rose-400">{errors.memberUsns}</p> : null}
          </div>
          <Button onClick={submitTeam} loading={busy} className="w-full" icon={Users} size="lg" variant="neon">
            Register team
          </Button>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------- QR ticket modal ---------------------------- */

export function QRTicketModal({ reg, eventTitle, open, onClose }: { reg: Registration; eventTitle: string; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reg.qrCode);
      toast.success("Copied", "QR code value copied to clipboard.");
    } catch {
      toast.info("QR code", reg.qrCode);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Your entry ticket" size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-2xl border border-violet-500/30 bg-panel-2 p-5 neon-ring">
          <QRCodeSVG value={reg.qrCode} size={188} bgColor="transparent" fgColor="#e2e8f0" level="M" aria-label={`QR code ${reg.qrCode}`} />
        </div>
        <p className="mt-4 font-display text-sm font-semibold text-ink">{eventTitle}</p>
        <p className="mt-1 font-mono text-xs tracking-[0.2em] text-cyan-300">{reg.qrCode}</p>
        <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted">Present this QR at the venue entrance. The coordinator scans or enters the code — it works exactly once.</p>
        <Button variant="outline" size="sm" className="mt-4" icon={Copy} onClick={copy}>
          Copy code
        </Button>
      </div>
    </Modal>
  );
}
