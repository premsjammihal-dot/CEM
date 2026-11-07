import { useMemo, useState } from "react";
import { Download, IndianRupee, Receipt, Star, TicketPercent } from "lucide-react";
import { db } from "@/services/db";
import { paymentRows } from "@/services/engage";
import { feedbackReport } from "@/services/engage";
import { downloadCsv, fmtMoney, relTime } from "@/lib/utils";
import { Badge, Button, Progress, Select, StatCard } from "@/components/ui";
import { DataTable } from "@/components/data";
import { useToast } from "@/components/overlays";

export default function FinanceReportsPage() {
  const toast = useToast();
  const [eventFilter, setEventFilter] = useState("");
  const events = db().events;

  const allPayments = paymentRows();
  const payments = useMemo(() => {
    return eventFilter ? allPayments.filter((p) => p.eventId === eventFilter) : allPayments;
  }, [allPayments, eventFilter]);

  const total = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const avg = payments.length ? Math.round(total / payments.length) : 0;
 const report = feedbackReport().sort((a, b) => b.avg - a.avg);

  const exportCsv = () => {
    downloadCsv(
      "campussphere-payments.csv",
      ["Student", "USN", "Event", "Amount", "Status", "Date"],
      payments.map((p) => [p.studentName, p.usn, p.eventTitle, String(p.amount), p.status, p.createdAt.slice(0, 10)]),
    );
    toast.success("Export ready", `${payments.length} payment rows exported.`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Finance & reports</h1>
        <p className="mt-1 text-sm text-muted">Registration payments, fee revenue and the campus feedback ledger.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Collected revenue" value={fmtMoney(total)} accent="green" />
        <StatCard icon={Receipt} label="Transactions" value={payments.length} accent="violet" />
        <StatCard icon={TicketPercent} label="Avg. ticket" value={fmtMoney(avg)} accent="cyan" />
        <StatCard icon={Star} label="Avg. event rating" value={report.length ? (report.reduce((s, r) => s + r.avg, 0) / report.length).toFixed(1) : "—"} accent="amber" />
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink">Payments</h2>
          <div className="flex gap-2">
            <div className="w-56">
              <Select aria-label="Filter by event" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} placeholder="All events" options={events.map((e) => ({ value: e.id, label: e.title }))} />
            </div>
            <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv} disabled={payments.length === 0}>
              CSV
            </Button>
          </div>
        </div>
        <DataTable
          dense
          columns={[
            { key: "student", header: "Student", render: (p: (typeof payments)[number]) => (<div><p className="font-medium text-ink">{p.studentName}</p><p className="text-xs text-dim">{p.usn}</p></div>) },
            { key: "event", header: "Event", render: (p) => <span className="text-muted">{p.eventTitle}</span> },
            { key: "amount", header: "Amount", render: (p) => <span className="font-mono font-bold text-emerald-300">{fmtMoney(p.amount)}</span> },
            { key: "status", header: "Status", render: (p) => <Badge tone={p.status === "paid" ? "green" : "slate"}>{p.status}</Badge> },
            { key: "at", header: "When", render: (p) => <span className="text-xs text-muted">{relTime(p.createdAt)}</span> },
          ]}
          rows={payments}
          rowKey={(p) => p.id}
          empty="No payments recorded for this filter."
        />
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Feedback report</h2>
        <DataTable
          columns={[
            { key: "event", header: "Event", render: (r: (typeof report)[number]) => <span className="font-medium text-ink">{r.title}</span> },
            { key: "count", header: "Responses", render: (r) => <span className="font-mono text-cyan-300">{r.count}</span> },
            {
              key: "avg",
              header: "Average rating",
              className: "w-64",
              render: (r) => (
                <div className="flex items-center gap-3">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  <Progress value={(r.avg / 5) * 100} tone="amber" className="w-32" />
                  <span className="font-mono text-sm font-bold text-amber-300">{r.avg.toFixed(1)}</span>
                </div>
              ),
            },
          ]}
          rows={report}
          rowKey={(r) => r.eventId}
          empty="No feedback submitted yet."
        />
      </section>
    </div>
  );
}
