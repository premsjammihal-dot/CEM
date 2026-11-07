import { useState } from "react";
import { useParams } from "react-router-dom";
import { Lock, Medal, Save, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { eventDetail } from "@/services/events";
import { judgingSheet, saveScore, standings, submitScores } from "@/services/results";
import { clamp, fmtDate, fmtTime } from "@/lib/utils";
import { PosterThumb } from "@/components/eventBits";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { DataTable } from "@/components/data";
import { ConfirmDialog, useToast } from "@/components/overlays";

interface DraftScore {
  innovation: number;
  execution: number;
  presentation: number;
}

export default function JudgeEventPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();
  const toast = useToast();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const detail = id ? eventDetail(id) : null;
  // computed per render (context tick re-renders on every table write)
  const sheet = id ? judgingSheet(id) : [];
  const [drafts, setDrafts] = useState<Record<string, DraftScore>>(() => {
    const init: Record<string, DraftScore> = {};
    for (const row of sheet) {
      init[row.registrationId] = row.score
        ? { innovation: row.score.innovation, execution: row.score.execution, presentation: row.score.presentation }
        : { innovation: 0, execution: 0, presentation: 0 };
    }
    return init;
  });

  if (!detail || !user) return <EmptyState title="Event not found" />;
  const { event } = detail;

  if (event.facultyId !== user.id) {
    return <EmptyState title="Not your judging desk" body={`This event is judged by ${detail.facultyName}.`} />;
  }

  const locked = event.scoresSubmitted;
  const scoredCount = sheet.filter((r) => r.score !== null).length;
  const table = locked ? standings(event.id) : [];

  const setDraft = (regId: string, key: keyof DraftScore, value: number) => {
    setDrafts((d) => ({ ...d, [regId]: { ...d[regId], [key]: clamp(Math.round(value), 0, 10) } }));
  };

  const saveRow = (regId: string) => {
    const d = drafts[regId];
    if (!d) return;
    const res = saveScore(user.id, event.id, regId, d);
    if (res.ok) toast.success("Score saved", `${sheet.find((s) => s.registrationId === regId)?.name} — ${d.innovation + d.execution + d.presentation}/30`);
    else toast.error("Save blocked", res.error);
  };

  const submitAll = () => {
    setBusy(true);
    // persist current drafts first so nothing typed is lost
    for (const [regId, d] of Object.entries(drafts)) {
      if (d.innovation + d.execution + d.presentation > 0) saveScore(user.id, event.id, regId, d);
    }
    const res = submitScores(user.id, event.id);
    setBusy(false);
    setSubmitOpen(false);
    if (res.ok) toast.success("Scores submitted", "Coordinator and Super Admin were notified for approval. The sheet is now locked.");
    else toast.error("Submission blocked", res.error);
  };

  return (
    <div className="space-y-6">
      <div className="glass flex flex-wrap items-center gap-5 rounded-3xl p-6">
        <PosterThumb poster={event.poster} title={event.title} className="h-20 w-32 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold text-ink">{event.title}</h1>
            {locked ? <Badge tone="green"><Lock className="size-3" aria-hidden /> Submitted</Badge> : <Badge tone="amber">Draft mode</Badge>}
            {event.resultsPublished && <Badge tone="cyan">Results published</Badge>}
          </div>
          <p className="mt-1.5 text-sm text-muted">
            {fmtDate(event.date)} · {fmtTime(event.startTime)} · {detail.venueName} · {sheet.length} participants · {scoredCount} scored
          </p>
        </div>
        {!locked && (
          <Button icon={Send} onClick={() => setSubmitOpen(true)} disabled={scoredCount === 0 && !Object.values(drafts).some((d) => d.innovation + d.execution + d.presentation > 0)}>
            Submit all scores
          </Button>
        )}
      </div>

      <Card>
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-semibold text-ink">Rubric:</span> Innovation (0–10) · Execution (0–10) · Presentation (0–10). Totals compute live.{" "}
          {locked ? "Scores are locked — only the Super Admin can unpublish results." : "Save each row as you judge; nothing is final until you submit."}
        </p>
      </Card>

      {locked ? (
        <DataTable
          columns={[
            { key: "pos", header: "Pos", render: (s: (typeof table)[number]) => <span className="font-display font-bold text-ink">#{s.position}</span> },
            { key: "name", header: "Participant", render: (s) => (<div><p className="font-medium text-ink">{s.name}</p><p className="text-xs text-dim">{s.teamName ?? s.usn}</p></div>) },
            { key: "total", header: "Total", render: (s) => <span className="font-mono font-bold text-cyan-300">{s.total}/30</span> },
            { key: "rank", header: "Placement", render: (s) => (s.rankLabel ? <Badge tone="amber"><Medal className="size-3" aria-hidden />{s.rankLabel}</Badge> : <span className="text-xs text-dim">—</span>) },
          ]}
          rows={table}
          rowKey={(s) => s.registrationId}
          empty="No scores recorded."
        />
      ) : (
        <DataTable
          dense
          columns={[
            { key: "name", header: "Participant", render: (r: (typeof sheet)[number]) => (<div><p className="font-medium text-ink">{r.name}</p><p className="text-xs text-dim">{r.teamName ?? r.usn}</p></div>) },
            ...(["innovation", "execution", "presentation"] as const).map((k) => ({
              key: k,
              header: <span className="capitalize">{k}</span>,
              render: (r: (typeof sheet)[number]) => (
                <input
                  type="number"
                  min={0}
                  max={10}
                  aria-label={`${k} score for ${r.name}`}
                  value={drafts[r.registrationId]?.[k] ?? 0}
                  onChange={(e) => setDraft(r.registrationId, k, Number(e.target.value))}
                  className="h-9 w-16 rounded-lg border border-line bg-panel px-2 text-center font-mono text-sm text-ink focus:border-violet-500/60 focus:outline-none"
                />
              ),
            })),
            {
              key: "total",
              header: "Total",
              render: (r: (typeof sheet)[number]) => {
                const d = drafts[r.registrationId];
                return <span className="font-mono text-sm font-bold text-cyan-300">{d ? d.innovation + d.execution + d.presentation : 0}</span>;
              },
            },
            {
              key: "save",
              header: "",
              className: "text-right",
              render: (r: (typeof sheet)[number]) => (
                <Button size="sm" variant="secondary" icon={Save} onClick={() => saveRow(r.registrationId)}>
                  {r.score ? "Update" : "Save"}
                </Button>
              ),
            },
          ]}
          rows={sheet}
          rowKey={(r) => r.registrationId}
          empty="No participants registered."
        />
      )}

      <ConfirmDialog
        open={submitOpen}
        title="Submit final scores?"
        body="The sheet locks, and the coordinator + Super Admin are notified to approve and publish. You cannot edit afterward."
        confirmLabel="Submit & lock"
        loading={busy}
        onConfirm={submitAll}
        onCancel={() => setSubmitOpen(false)}
      />
    </div>
  );
}
