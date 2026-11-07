import { Link } from "react-router-dom";
import { ClipboardCheck, Gavel, Landmark, Trophy, Users } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { eventsForFaculty } from "@/services/events";
import { activeRegCount, attendedCount, venueById } from "@/services/lookups";
import { fmtDate, fmtTime, isPast } from "@/lib/utils";
import { PosterThumb } from "@/components/eventBits";
import { Badge, Card, EmptyState } from "@/components/ui";

export default function FacultyOverview() {
  const { user } = useApp();
  if (!user) return null;
  const events = eventsForFaculty(user.id);
  const pendingJudging = events.filter((e) => isPast(e.date) && !e.scoresSubmitted);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Faculty / Judge</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Assigned events</h1>
        <p className="mt-1.5 text-sm text-muted">Score participants on the shared rubric; submissions go to the coordinator and admin for approval.</p>
      </div>

      {pendingJudging.length > 0 && (
        <Card className="border-amber-500/30">
          <p className="flex items-center gap-2 text-sm text-amber-200">
            <Gavel className="size-4" aria-hidden />
            {pendingJudging.length} event{pendingJudging.length === 1 ? "" : "s"} awaiting your scores: {pendingJudging.map((e) => e.title).join(", ")}
          </p>
        </Card>
      )}

      {events.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Nothing assigned" body="Coordinators assign you as judge when creating events." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((e) => {
            const regs = activeRegCount(e.id);
            const attended = attendedCount(e.id);
            const venue = venueById(e.venueId);
            return (
              <Link key={e.id} to={`/app/faculty/events/${e.id}`} className="glass card-hover flex gap-4 rounded-2xl p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400">
                <PosterThumb poster={e.poster} title={e.title} className="h-24 w-36 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display font-semibold text-ink">{e.title}</p>
                    {e.resultsPublished ? (
                      <Badge tone="green"><Trophy className="size-3" aria-hidden /> Published</Badge>
                    ) : e.scoresSubmitted ? (
                      <Badge tone="cyan">Submitted</Badge>
                    ) : (
                      <Badge tone={isPast(e.date) ? "amber" : "slate"}>{isPast(e.date) ? "Judging due" : "Scheduled"}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {fmtDate(e.date)} · {fmtTime(e.startTime)} – {fmtTime(e.endTime)}
                  </p>
                  <p className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1"><Landmark className="size-3.5 text-violet-300" aria-hidden />{venue?.name ?? "TBA"}</span>
                    <span className="flex items-center gap-1"><Users className="size-3.5 text-violet-300" aria-hidden />{regs} registered · {attended} attended</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
