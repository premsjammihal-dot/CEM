import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui";

/* ---------------------------------- Tabs ---------------------------------- */

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-panel p-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400",
            active === t.id ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-950/40" : "text-muted hover:bg-white/5 hover:text-ink",
          )}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", active === t.id ? "bg-white/20 text-white" : "bg-white/8 text-muted")}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- DataTable -------------------------------- */

export interface Column<T> {
  key: string;
  header: ReactNode;
  className?: string;
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  empty = "No records found.",
  dense = false,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: ReactNode;
  dense?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-panel-2/80">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? [0, 1, 2].map((i) => (
                <tr key={`sk-${i}`} className="border-b border-line/50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted">
                    {empty}
                  </td>
                </tr>
              )
              : rows.map((row, idx) => (
                  <tr key={rowKey(row)} className={cn("border-b border-line/50 transition-colors last:border-0 hover:bg-white/[0.03]", idx % 2 === 1 && "bg-white/[0.015]")}>
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4", dense ? "py-2.5" : "py-3.5", c.className)}>
                        {c.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------- Chart card -------------------------------- */

export function ChartCard({ title, sub, children, className }: { title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("glass rounded-2xl p-5", className)}>
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      {sub ? <p className="mb-4 mt-0.5 text-xs text-muted">{sub}</p> : <div className="mb-4" />}
      <div className="h-64 w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted [&_.recharts-cartesian-axis-tick_text]:text-[11px]">{children}</div>
    </div>
  );
}

export const CHART_COLORS = ["#8b5cf6", "#22d3ee", "#34d399", "#fbbf24", "#fb7185", "#a78bfa", "#38bdf8", "#f472b6"];

export const tooltipStyle = {
  backgroundColor: "#171d31",
  border: "1px solid rgba(148,163,184,0.2)",
  borderRadius: "12px",
  color: "#f1f5f9",
  fontSize: "12px",
} as const;
