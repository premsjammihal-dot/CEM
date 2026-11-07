import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  Gauge,
  IndianRupee,
  Landmark,
  ListChecks,
  Megaphone,
  Medal,
  ShieldCheck,
  Star,
  Timer,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { eventDetail, publishedEvents, registrationGate } from "@/services/events";
import { announcementsFor, feedbackForEvent } from "@/services/engage";
import { publishedResults } from "@/services/results";
import { isRegistered } from "@/services/registrations";
import { useApp } from "@/context/AppContext";
import { cn, daysUntil, fmtCurrency, fmtDate, fmtTime, relTime } from "@/lib/utils";
import { CategoryBadge, PosterThumb, RegisterModal } from "@/components/eventBits";
import { Avatar, Badge, Button, EmptyState, Progress } from "@/components/ui";
import { useToast } from "@/components/overlays";

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(size, i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-slate-600")} aria-hidden />
      ))}
    </span>
  );
}

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useApp();
  const toast = useToast();
  const [regOpen, setRegOpen] = useState(false);

  const detail = id ? eventDetail(id) : null;

  if (!detail || (detail.event.status !== "published" && detail.event.status !== "completed")) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          title="Event unavailable"
          body="This event does not exist, or it has not been approved for public viewing yet."
          action={<Link to="/events" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">Browse published events</Link>}
        />
      </div>
    );
  }

  const { event } = detail;
  const gate = registrationGate(event);
  const already = user ? isRegistered(user.id, event.id) : false;
  const feedback = feedbackForEvent(event.id);
  const winners = publishedResults(event.id);
  const podium = winners.slice(0, 3);
  const announcements = announcementsFor(event.id);
  const similar = publishedEvents().filter((e) => e.category === event.category && e.id !== event.id && e.date >= new Date().toISOString().slice(0, 10)).slice(0, 3);
  const pct = Math.min(100, (detail.registered / event.capacity) * 100);
  const days = daysUntil(event.date);

  const startRegister = () => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname, msg: "Sign in to register for this event." } });
      return;
    }
    if (user.role !== "student") {
      toast.info("Students only", "Staff accounts cannot register for events. Use a student account.");
      return;
    }
    setRegOpen(true);
  };

  return (
    <div>
      {/* Banner */}
      <div className="relative h-72 overflow-hidden sm:h-96">
        <PosterThumb poster={event.poster} title={event.title} className="size-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-base via-base/40 to-base/10" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <Link to="/events" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink">
            <ArrowLeft className="size-3.5" aria-hidden /> Back to Explore
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <CategoryBadge category={event.category} />
            {event.featured && <Badge tone="amber">Featured</Badge>}
            {event.resultsPublished && <Badge tone="green">Results published</Badge>}
            {days === 0 && <Badge tone="rose">Happening today</Badge>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">{event.title}</h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px]">
        {/* ------------------------------ Main column ------------------------------ */}
        <div className="min-w-0 space-y-10">
          <section aria-label="About this event">
            <h2 className="font-display text-xl font-bold text-ink">About</h2>
            <p className="mt-3 leading-relaxed text-muted">{event.description}</p>
          </section>

          {/* Winners */}
          {podium.length > 0 && (
            <section aria-label="Results">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                <Trophy className="size-5 text-amber-300" aria-hidden /> Official results
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {podium.map((w, i) => (
                  <div key={w.registrationId} className={cn("glass rounded-2xl p-4 text-center", i === 0 && "neon-ring")}>
                    <Medal className={cn("mx-auto size-7", i === 0 ? "text-amber-300" : i === 1 ? "text-slate-300" : "text-orange-400")} aria-hidden />
                    <p className="mt-2 font-display font-bold text-ink">{w.name}</p>
                    <p className="text-xs text-muted">{w.teamName ?? w.usn}</p>
                    <Badge tone={i === 0 ? "amber" : "slate"} className="mt-2">
                      {w.rankLabel} · {w.total} pts
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Rules */}
          <section aria-label="Rules and eligibility">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
              <ListChecks className="size-5 text-violet-300" aria-hidden /> Rules & eligibility
            </h2>
            <div className="glass mt-4 rounded-2xl p-5">
              <p className="text-sm text-muted">
                <span className="font-semibold text-cyan-300">Eligibility — </span>
                {event.eligibility}
              </p>
              <ul className="mt-4 space-y-2.5">
                {event.rules.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-muted">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Announcements */}
          {announcements.length > 0 && (
            <section aria-label="Announcements">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                <Megaphone className="size-5 text-cyan-300" aria-hidden /> Announcements
              </h2>
              <div className="mt-4 space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="glass rounded-2xl border-l-2 border-l-cyan-400/60 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{a.title}</p>
                      <span className="text-xs text-dim">{relTime(a.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted">{a.body}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Feedback */}
          <section aria-label="Participant feedback">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                <Star className="size-5 text-amber-300" aria-hidden /> Participant feedback
              </h2>
              {detail.avgRating !== null && (
                <span className="flex items-center gap-2 text-sm text-muted">
                  <Stars value={detail.avgRating} /> {detail.avgRating.toFixed(1)} · {feedback.length} review{feedback.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {feedback.length === 0 ? (
              <p className="mt-4 text-sm text-dim">No reviews yet — feedback opens to attendees after the event.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {feedback.map((f) => (
                  <figure key={f.id} className="glass rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                        <Avatar name={f.studentName} size="sm" /> {f.studentName}
                      </span>
                      <Stars value={f.rating} size="size-3.5" />
                    </div>
                    <blockquote className="mt-3 text-sm leading-relaxed text-muted">“{f.comment}”</blockquote>
                  </figure>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ------------------------------- Side rail ------------------------------ */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-3xl font-extrabold text-ink">{event.fee === 0 ? <span className="text-emerald-300">Free</span> : fmtCurrency(event.fee)}</p>
              <Badge tone={gate.open && !already ? "green" : "slate"}>{already ? "Registered" : gate.open ? "Open" : "Closed"}</Badge>
            </div>

            <div className="mt-5 space-y-3.5 text-sm">
              {[
                { icon: CalendarDays, label: "Date", value: fmtDate(event.date) },
                { icon: Clock, label: "Time", value: `${fmtTime(event.startTime)} – ${fmtTime(event.endTime)}` },
                { icon: Landmark, label: "Venue", value: detail.venueName },
                { icon: Timer, label: "Register by", value: fmtDate(event.regDeadline) },
                { icon: Users, label: "Team size", value: event.teamSizeMax > 1 ? `${event.teamSizeMin}–${event.teamSizeMax} members` : "Individual" },
                { icon: Gauge, label: "Capacity", value: `${event.capacity} seats` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 border-b border-line/50 pb-3 last:border-0 last:pb-0">
                  <span className="flex items-center gap-2 text-muted">
                    <row.icon className="size-4 text-violet-300" aria-hidden /> {row.label}
                  </span>
                  <span className="text-right font-medium text-ink">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-[11px] text-dim">
                <span>{detail.registered} registered</span>
                <span>{detail.spotsLeft} left</span>
              </div>
              <Progress value={pct} tone={detail.spotsLeft === 0 ? "rose" : "violet"} />
            </div>

            <Button
              className="mt-6 w-full"
              size="lg"
              variant={already ? "secondary" : "neon"}
              disabled={!gate.open && !already}
              onClick={startRegister}
              icon={already ? BadgeCheck : IndianRupee}
            >
              {already ? "You're registered" : gate.open ? (user?.role === undefined ? "Sign in to register" : "Register now") : "Registration closed"}
            </Button>
            {!gate.open && !already && gate.reason && <p className="mt-2.5 text-center text-xs text-rose-300">{gate.reason}</p>}
            {already && <p className="mt-2.5 text-center text-xs text-emerald-300">Manage your ticket from the student dashboard.</p>}
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-dim">Organized by</h3>
            <div className="mt-3.5 flex items-center gap-3">
              <Avatar name={detail.coordinatorName} />
              <div>
                <p className="text-sm font-semibold text-ink">{detail.coordinatorName}</p>
                <p className="text-xs text-muted">Event Coordinator</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={detail.facultyName} />
              <div>
                <p className="text-sm font-semibold text-ink">{detail.facultyName}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <UserRound className="size-3" aria-hidden /> Faculty Judge
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Similar events */}
      {similar.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <h2 className="font-display text-xl font-bold text-ink">More {event.category.toLowerCase()} events</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {similar.map((s) => (
              <Link key={s.id} to={`/events/${s.id}`} className="glass card-hover flex items-center gap-3 rounded-2xl p-4">
                <PosterThumb poster={s.poster} title={s.title} className="h-14 w-24 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{fmtDate(s.date)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <RegisterModal event={event} open={regOpen} onClose={() => setRegOpen(false)} />
    </div>
  );
}
