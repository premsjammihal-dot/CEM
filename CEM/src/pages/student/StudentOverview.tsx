import { Link } from "react-router-dom";
import { ArrowRight, Award, CalendarDays, CheckCircle2, Compass, QrCode, UsersRound } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { myRegistrations, teamsForStudent } from "@/services/registrations";
import { myCertificates } from "@/services/results";
import { myNotifications } from "@/services/notify";
import { upcomingPublished } from "@/services/events";
import { cn, fmtDate, fmtTime, relTime, todayIso } from "@/lib/utils";
import { PosterThumb } from "@/components/eventBits";
import { Badge, Button, Card, LinkButton, StatCard } from "@/components/ui";

export default function StudentOverview() {
  const { user } = useApp();
  if (!user) return null;
  const regs = myRegistrations(user.id);
  const upcoming = regs.filter((r) => r.reg.status === "confirmed" && r.event.date >= todayIso());
  const attended = regs.filter((r) => r.reg.status === "attended").length;
  const certs = myCertificates(user.id).length;
  const teams = teamsForStudent(user.id).length;
  const notes = myNotifications(user.id).slice(0, 4);
  const suggestions = upcomingPublished().filter((e) => !regs.some((r) => r.event.id === e.id)).slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="glass relative overflow-hidden rounded-3xl p-7 sm:p-9">
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-violet-600/25 blur-3xl" aria-hidden />
        <div className="absolute -bottom-16 left-1/3 size-48 rounded-full bg-cyan-500/15 blur-3xl" aria-hidden />
        <p className="relative text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Student dashboard</p>
        <h1 className="relative mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">Hey, {user.name.split(" ")[0]}.</h1>
        <p className="relative mt-2 max-w-lg text-sm text-muted">
          {upcoming.length > 0 ? `You have ${upcoming.length} upcoming event${upcoming.length === 1 ? "" : "s"}. Keep your QR tickets handy at the door.` : "You haven't locked in any events yet — the calendar is stacked."}
        </p>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <LinkButton to="/events" icon={Compass}>
            Explore events
          </LinkButton>
          <LinkButton to="/app/student/events" variant="secondary">
            My tickets
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Registrations" value={regs.filter((r) => r.reg.status !== "cancelled").length} accent="violet" />
        <StatCard icon={CheckCircle2} label="Attended" value={attended} accent="green" />
        <StatCard icon={Award} label="Certificates" value={certs} accent="cyan" />
        <StatCard icon={UsersRound} label="Teams" value={teams} accent="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section aria-label="Upcoming events">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Upcoming for you</h2>
            <Link to="/app/student/events" className="flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200">
              View all <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">No upcoming registrations. New events publish every week — grab a seat early.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map(({ reg, event }) => (
                <div key={reg.id} className="glass card-hover flex items-center gap-4 rounded-2xl p-4">
                  <PosterThumb poster={event.poster} title={event.title} className="h-16 w-24 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display font-semibold text-ink">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {fmtDate(event.date)} · {fmtTime(event.startTime)}
                    </p>
                    <Badge tone="green" className="mt-2">
                      <QrCode className="size-3" aria-hidden /> QR ticket active
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <>
              <h2 className="mb-4 mt-8 font-display text-lg font-bold text-ink">Suggested for you</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {suggestions.map((e) => (
                  <Link key={e.id} to={`/events/${e.id}`} className="glass card-hover rounded-2xl p-4">
                    <Badge tone="cyan">{e.category}</Badge>
                    <p className="mt-2.5 line-clamp-1 font-display text-sm font-semibold text-ink">{e.title}</p>
                    <p className="mt-1 text-xs text-muted">{fmtDate(e.date)}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        <aside aria-label="Recent notifications">
          <h2 className="mb-4 font-display text-lg font-bold text-ink">Latest updates</h2>
          <div className="space-y-2.5">
            {notes.map((n) => (
              <div key={n.id} className={cn("glass rounded-xl p-4", !n.read && "border-l-2 border-l-violet-400")}>
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{n.body}</p>
                <p className="mt-1.5 text-[10px] uppercase tracking-wider text-dim">{relTime(n.createdAt)}</p>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => undefined} disabled>
            Open the bell for the full inbox
          </Button>
        </aside>
      </div>
    </div>
  );
}
