import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, CalendarPlus, CheckCircle2, ClipboardList, Hourglass } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { eventsByCoordinator } from "@/services/events";
import { activeRegCount } from "@/services/lookups";
import { coordinationStats } from "@/services/admin";
import { cn, fmtDate, relTime } from "@/lib/utils";
import { PosterThumb } from "@/components/eventBits";
import { Avatar, Badge, Card, LinkButton, StatCard } from "@/components/ui";
import { db } from "@/services/db";
import { participantsForEvent } from "@/services/registrations";

const STATUS_TONE: Record<string, "green" | "amber" | "rose" | "slate" | "cyan"> = {
  published: "green",
  pending: "amber",
  rejected: "rose",
  draft: "slate",
  completed: "cyan",
};

export default function CoordinatorOverview() {
  const { user } = useApp();
  if (!user) return null;
  const stats = coordinationStats(user.id);
  const events = eventsByCoordinator(user.id);
  const recent = db()
    .registrations.filter((r) => events.some((e) => e.id === r.eventId) && r.status !== "cancelled")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Coordinator workspace</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="mt-1.5 text-sm text-muted">Draft events go live after Super Admin approval.</p>
        </div>
        <LinkButton to="/app/coordinator/events/new" icon={CalendarPlus}>
          New event
        </LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="My events" value={stats.events} accent="violet" />
        <StatCard icon={CheckCircle2} label="Live now" value={stats.live} accent="green" />
        <StatCard icon={ClipboardList} label="Total registrations" value={stats.registrations} accent="cyan" />
        <StatCard icon={Hourglass} label="Awaiting approval" value={stats.pending} sub={stats.pending > 0 ? "Super Admin review" : undefined} accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Event console</h2>
            <Link to="/app/coordinator/events" className="flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200">
              All events <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="space-y-3">
            {events.slice(0, 5).map((e) => {
              const count = activeRegCount(e.id);
              return (
                <Link key={e.id} to={`/app/coordinator/events/${e.id}`} className="glass card-hover flex items-center gap-4 rounded-2xl p-4">
                  <PosterThumb poster={e.poster} title={e.title} className="h-14 w-24 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-semibold text-ink">{e.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {fmtDate(e.date)} · {count}/{e.capacity} registered
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                </Link>
              );
            })}
            {events.length === 0 && (
              <Card>
                <p className="text-sm text-muted">No events yet. Create your first draft — the Super Admin reviews and publishes it.</p>
              </Card>
            )}
          </div>
        </section>

        <aside>
          <h2 className="mb-4 font-display text-lg font-bold text-ink">Latest registrations</h2>
          <div className="space-y-2.5">
            {recent.length === 0 && <Card className="text-sm text-muted">Registrations will stream in once events are live.</Card>}
            {recent.map((r) => {
              const ev = events.find((e) => e.id === r.eventId);
              const p = participantsForEvent(r.eventId).find((x) => x.reg.id === r.id);
              return (
                <div key={r.id} className="glass flex items-center gap-3 rounded-xl p-3.5">
                  <Avatar name={p?.name ?? "?"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{p?.name ?? "Student"}</p>
                    <p className="truncate text-xs text-muted">{ev?.title ?? "Event"}</p>
                  </div>
                  <span className={cn("text-[10px] uppercase tracking-wider text-dim")}>{relTime(r.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
