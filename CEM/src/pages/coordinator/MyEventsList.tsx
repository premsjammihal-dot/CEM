import { Link } from "react-router-dom";
import { CalendarPlus, Settings2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { eventsByCoordinator } from "@/services/events";
import { activeRegCount, attendedCount } from "@/services/lookups";
import { fmtDate } from "@/lib/utils";
import { PosterThumb } from "@/components/eventBits";
import { Badge, EmptyState, LinkButton, Progress } from "@/components/ui";

const STATUS_TONE: Record<string, "green" | "amber" | "rose" | "slate" | "cyan"> = {
  published: "green",
  pending: "amber",
  rejected: "rose",
  draft: "slate",
  completed: "cyan",
};

export default function MyEventsList() {
  const { user } = useApp();
  if (!user) return null;
  const events = eventsByCoordinator(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">My events</h1>
          <p className="mt-1 text-sm text-muted">Console per event — registrations, attendance, announcements, results and budget.</p>
        </div>
        <LinkButton to="/app/coordinator/events/new" icon={CalendarPlus}>
          Create event
        </LinkButton>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No events yet" body="Create a draft; the Super Admin approves it before publishing." action={<LinkButton to="/app/coordinator/events/new">Create your first event</LinkButton>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {events.map((e) => {
            const regs = activeRegCount(e.id);
            const attended = attendedCount(e.id);
            return (
              <div key={e.id} className="glass card-hover overflow-hidden rounded-2xl">
                <div className="flex gap-4 p-4">
                  <PosterThumb poster={e.poster} title={e.title} className="h-24 w-40 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display font-semibold text-ink">{e.title}</p>
                      <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">{fmtDate(e.date)} · {e.category}</p>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[11px] text-dim">
                        <span>{regs}/{e.capacity} registered</span>
                        <span>{attended} attended</span>
                      </div>
                      <Progress value={(regs / e.capacity) * 100} tone={e.status === "published" ? "cyan" : "violet"} />
                    </div>
                  </div>
                </div>
                <div className="border-t border-line/60 px-4 py-3">
                  <Link to={`/app/coordinator/events/${e.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-violet-500/40 px-3 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/10">
                    <Settings2 className="size-3.5" aria-hidden /> Open console
                  </Link>
                  <Link to={`/events/${e.id}`} className="ml-2 inline-flex h-8 items-center rounded-xl px-3 text-xs font-semibold text-muted hover:text-ink">
                    Public page
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
