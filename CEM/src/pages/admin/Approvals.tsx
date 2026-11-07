import { useState } from "react";
import { CheckCircle2, Eye, Hourglass, XCircle } from "lucide-react";
import { approveEvent, pendingEvents, rejectEvent } from "@/services/events";
import { profileById, venueById } from "@/services/lookups";
import { fmtCurrency, fmtDate, fmtTime } from "@/lib/utils";
import { CategoryBadge, PosterThumb } from "@/components/eventBits";
import { Badge, Button, Card, EmptyState, Textarea } from "@/components/ui";
import { Modal, useToast } from "@/components/overlays";
import type { EventItem } from "@/services/types";

export default function ApprovalsPage() {
  const toast = useToast();
  const [viewing, setViewing] = useState<EventItem | null>(null);
  const [rejecting, setRejecting] = useState<EventItem | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const queue = pendingEvents();

  const approve = (id: string) => {
    const res = approveEvent(id);
    if (res.ok) toast.success("Event published", "The coordinator was notified; registration opens per its deadline.");
    else toast.error("Approval failed", res.error);
  };

  const reject = () => {
    if (!rejecting) return;
    if (reason.trim().length < 5) {
      toast.error("Reason required", "Tell the coordinator what to fix (min 5 characters).");
      return;
    }
    setBusy(true);
    const res = rejectEvent(rejecting.id, reason.trim());
    setBusy(false);
    setRejecting(null);
    setReason("");
    if (res.ok) toast.success("Event rejected", "The coordinator was notified with your reason.");
    else toast.error("Failed", res.error);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Event approvals</h1>
        <p className="mt-1 text-sm text-muted">Coordinator drafts publish only after your sign-off.</p>
      </div>

      {queue.length === 0 ? (
        <EmptyState icon={Hourglass} title="Queue is clear" body="New submissions appear here the moment a coordinator clicks “Submit for approval”." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {queue.map((e) => (
            <Card key={e.id} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <PosterThumb poster={e.poster} title={e.title} className="h-24 w-40 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-lg font-semibold text-ink">{e.title}</p>
                    <CategoryBadge category={e.category} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {fmtDate(e.date)} · {fmtTime(e.startTime)} · {venueById(e.venueId)?.name ?? "TBA"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Coordinator: <span className="text-ink">{profileById(e.coordinatorId)?.name}</span> · Judge: <span className="text-ink">{profileById(e.facultyId)?.name}</span>
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Badge tone="violet">{fmtCurrency(e.fee)}</Badge>
                    <Badge tone="slate">{e.capacity} seats</Badge>
                    <Badge tone="cyan">{e.teamSizeMax > 1 ? `Teams ${e.teamSizeMin}–${e.teamSizeMax}` : "Solo"}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-line/60 pt-4">
                <Button size="sm" icon={CheckCircle2} onClick={() => approve(e.id)}>
                  Approve & publish
                </Button>
                <Button size="sm" variant="danger" icon={XCircle} onClick={() => setRejecting(e)}>
                  Reject
                </Button>
                <Button size="sm" variant="secondary" icon={Eye} onClick={() => setViewing(e)}>
                  Review details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={viewing !== null} onClose={() => setViewing(null)} title={viewing?.title ?? ""} size="lg">
        {viewing && (
          <div className="space-y-4 text-sm">
            <PosterThumb poster={viewing.poster} title={viewing.title} className="h-44 w-full rounded-xl" />
            <p className="leading-relaxed text-muted">{viewing.description}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <p className="text-muted">Deadline: <span className="text-ink">{fmtDate(viewing.regDeadline)}</span></p>
              <p className="text-muted">Eligibility: <span className="text-ink">{viewing.eligibility}</span></p>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-dim">Rules</p>
              <ul className="list-inside list-disc space-y-1 text-muted">
                {viewing.rules.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={rejecting !== null} onClose={() => setRejecting(null)} title={`Reject — ${rejecting?.title ?? ""}`} size="sm">
        <Textarea label="Reason for rejection" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Venue clashes with the IA schedule, move to week 8…" />
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setRejecting(null)}>
            Keep in queue
          </Button>
          <Button variant="danger" loading={busy} onClick={reject}>
            Reject with reason
          </Button>
        </div>
      </Modal>
    </div>
  );
}
