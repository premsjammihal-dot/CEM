import { useState } from "react";
import { Link } from "react-router-dom";
import { Award, Ban, CalendarDays, Compass, MapPin, QrCode, Star, UsersRound } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cancelRegistration, myRegistrations, type MyRegistration } from "@/services/registrations";
import { myCertificates } from "@/services/results";
import { downloadCertificatePdf } from "@/lib/pdf";
import { fmtCurrency, fmtDate, fmtTime, isPast, todayIso } from "@/lib/utils";
import { db } from "@/services/db";
import { PosterThumb, QRTicketModal } from "@/components/eventBits";
import { Badge, Button, EmptyState } from "@/components/ui";
import { ConfirmDialog, useToast } from "@/components/overlays";
import { Tabs } from "@/components/data";

export default function MyEventsPage() {
  const { user } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState("upcoming");
  const [ticket, setTicket] = useState<MyRegistration | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MyRegistration | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const regs = myRegistrations(user.id);
  const certs = myCertificates(user.id);

  const upcoming = regs.filter((r) => r.reg.status === "confirmed" && !isPast(r.event.date));
  const past = regs.filter((r) => r.reg.status === "attended" || (r.reg.status === "confirmed" && isPast(r.event.date)));
  const cancelled = regs.filter((r) => r.reg.status === "cancelled");
  const shown = tab === "upcoming" ? upcoming : tab === "past" ? past : cancelled;

  const doCancel = () => {
    if (!cancelTarget) return;
    setBusy(true);
    const res = cancelRegistration(cancelTarget.reg.id, user.id);
    setBusy(false);
    setCancelTarget(null);
    if (res.ok) toast.success("Registration cancelled", "The seat has been released.");
    else toast.error("Could not cancel", res.error);
  };

  const downloadCert = (eventId: string) => {
    const view = certs.find((c) => c.event.id === eventId);
    const cert = view?.cert;
    if (!cert || !view) {
      toast.info("No certificate yet", "Certificates are issued after attendance is confirmed.");
      return;
    }
    downloadCertificatePdf({
      cert,
      event: view.event,
      studentName: user.name,
      usn: db().students.find((s) => s.profileId === user.id)?.usn ?? "",
      collegeName: db().settings.collegeName,
    });
    toast.success("Certificate downloaded", cert.certUid);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">My Events</h1>
        <p className="mt-1 text-sm text-muted">Tickets, attendance and cancellation in one place.</p>
      </div>

      <Tabs
        tabs={[
          { id: "upcoming", label: "Upcoming", count: upcoming.length },
          { id: "past", label: "Attended / past", count: past.length },
          { id: "cancelled", label: "Cancelled", count: cancelled.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {shown.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={tab === "upcoming" ? "Nothing upcoming" : tab === "past" ? "No past events" : "No cancellations"}
          body={tab === "upcoming" ? "Browse the catalog and grab your next event." : undefined}
          action={tab === "upcoming" ? <Button icon={Compass} onClick={() => { window.location.hash = "#/events"; }}>Explore events</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((mr) => {
            const { reg, event, team } = mr;
            const canCancel = reg.status === "confirmed" && event.date >= todayIso();
            const myCert = certs.filter((c) => c.event.id === event.id);
            return (
              <div key={reg.id} className="glass card-hover overflow-hidden rounded-2xl">
                <div className="flex gap-4 p-4">
                  <PosterThumb poster={event.poster} title={event.title} className="h-20 w-32 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/events/${event.id}`} className="line-clamp-1 font-display font-semibold text-ink hover:text-violet-300">
                      {event.title}
                    </Link>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                      <MapPin className="size-3 text-violet-300" aria-hidden />
                      {fmtDate(event.date)} · {fmtTime(event.startTime)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone={reg.status === "attended" ? "green" : reg.status === "cancelled" ? "rose" : "cyan"}>{reg.status}</Badge>
                      {team && (
                        <Badge tone="violet">
                          <UsersRound className="size-3" aria-hidden /> {team.name}
                        </Badge>
                      )}
                      {event.fee > 0 && <Badge tone="slate">{fmtCurrency(event.fee)}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-line/60 px-4 py-3">
                  {reg.status !== "cancelled" && (
                    <Button size="sm" variant="secondary" icon={QrCode} onClick={() => setTicket(mr)}>
                      QR ticket
                    </Button>
                  )}
                  {canCancel && (
                    <Button size="sm" variant="ghost" icon={Ban} className="text-rose-300 hover:bg-rose-500/10" onClick={() => setCancelTarget(mr)}>
                      Cancel
                    </Button>
                  )}
                  {myCert.length > 0 && (
                    <Button size="sm" variant="outline" icon={Award} onClick={() => downloadCert(event.id)}>
                      Certificate
                    </Button>
                  )}
                  {reg.status === "attended" && (
                    <Link to="/app/student/feedback" className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-amber-500/40 px-3 text-xs font-semibold text-amber-300 hover:bg-amber-500/10">
                      <Star className="size-3.5" aria-hidden /> Rate
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ticket && <QRTicketModal reg={ticket.reg} eventTitle={ticket.event.title} open onClose={() => setTicket(null)} />}
      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel registration?"
        body={`This will release your seat at “${cancelTarget?.event.title ?? ""}”. Paid fees are refunded per policy. This cannot be undone.`}
        confirmLabel="Cancel registration"
        danger
        loading={busy}
        onConfirm={doCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
