import { Link } from "react-router-dom";
import { Crown, UsersRound } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { teamsForStudent } from "@/services/registrations";
import { fmtDate } from "@/lib/utils";
import { PosterThumb } from "@/components/eventBits";
import { Avatar, Badge, EmptyState, LinkButton } from "@/components/ui";

export default function TeamsPage() {
  const { user } = useApp();
  if (!user) return null;
  const teams = teamsForStudent(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Teams</h1>
        <p className="mt-1 text-sm text-muted">Every squad you've built or joined across events.</p>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No teams yet"
          body="Pick a team event from Explore and create a squad by adding member USNs at registration."
          action={<LinkButton to="/events">Find a team event</LinkButton>}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {teams.map((t) => (
            <div key={t.team.id} className="glass card-hover rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <PosterThumb poster={t.event.poster} title={t.event.title} className="h-16 w-24 shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <Link to={`/events/${t.event.id}`} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                    {t.event.title} · {fmtDate(t.event.date)}
                  </Link>
                  <h3 className="mt-1 font-display text-xl font-bold text-ink">{t.team.name}</h3>
                  <p className="mt-0.5 text-xs text-muted">{t.members.length} member{t.members.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 border-t border-line/60 pt-4">
                {t.members.map((m) => (
                  <li key={m.usn} className="flex items-center gap-3">
                    <Avatar name={m.name} size="sm" />
                    <span className="flex-1 text-sm font-medium text-ink">
                      {m.name} <span className="text-xs text-dim">· {m.usn}</span>
                    </span>
                    {m.isLeader && (
                      <Badge tone="amber">
                        <Crown className="size-3" aria-hidden /> Leader
                      </Badge>
                    )}
                    <Badge tone={m.status === "attended" ? "green" : m.status === "cancelled" ? "rose" : "cyan"}>{m.status}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
