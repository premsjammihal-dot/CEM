import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { publishedEvents } from "@/services/events";
import type { EventItem } from "@/services/types";
import { cn, fmtDate, fmtTime, todayIso } from "@/lib/utils";
import { CategoryBadge } from "@/components/eventBits";
import { Badge, EmptyState, Select } from "@/components/ui";
import { EVENT_CATEGORIES } from "@/assets/posters";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthKey(y: number, m: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const today = todayIso();
  const [cursor, setCursor] = useState(() => today.slice(0, 7)); // YYYY-MM
  const [selected, setSelected] = useState(today);
  const [category, setCategory] = useState("");

  const events = useMemo(() => {
    const all = publishedEvents();
    return category ? all.filter((e) => e.category === category) : all;
  }, [category]);

  const byDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of events) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events]);

  const [cy, cm] = cursor.split("-").map(Number);
  const first = new Date(cy, cm - 1, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(cy, cm, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${monthKey(cy, cm - 1)}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (dir: number) => {
    const d = new Date(cy, cm - 1 + dir, 1);
    setCursor(monthKey(d.getFullYear(), d.getMonth()));
  };

  const selectedEvents = byDate.get(selected) ?? [];
  const monthLabel = new Date(cy, cm - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Calendar</p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink">Event calendar</h1>
          <p className="mt-3 text-muted">Every published event on one board. Pick a day to see what's on.</p>
        </div>
        <div className="w-52">
          <Select aria-label="Filter category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="All categories" options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">{monthLabel}</h2>
            <div className="flex gap-2">
              <button onClick={() => shift(-1)} className="rounded-lg border border-line p-2 text-muted transition-colors hover:text-ink" aria-label="Previous month">
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => {
                  setCursor(today.slice(0, 7));
                  setSelected(today);
                }}
                className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-ink"
              >
                Today
              </button>
              <button onClick={() => shift(1)} className="rounded-lg border border-line p-2 text-muted transition-colors hover:text-ink" aria-label="Next month">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label={`Events in ${monthLabel}`}>
            {WEEKDAYS.map((w) => (
              <div key={w} className="pb-2 text-center text-[11px] font-bold uppercase tracking-wider text-dim">
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              if (!day) return <div key={`x-${i}`} aria-hidden />;
              const dayEvents = byDate.get(day) ?? [];
              const isToday = day === today;
              const isSelected = day === selected;
              return (
                <button
                  key={day}
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-label={`${fmtDate(day)} — ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`}
                  onClick={() => setSelected(day)}
                  className={cn(
                    "flex min-h-16 flex-col items-center gap-1.5 rounded-xl border p-2 text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400 sm:min-h-20",
                    isSelected
                      ? "border-violet-500/70 bg-violet-500/15 text-violet-100"
                      : isToday
                        ? "border-cyan-500/50 bg-cyan-500/8 text-cyan-100"
                        : "border-line/60 text-muted hover:border-slate-500/40 hover:bg-white/[0.03]",
                  )}
                >
                  <span className={cn("font-display font-semibold", isToday && "flex size-6 items-center justify-center rounded-full bg-cyan-500/90 text-xs text-base")}>{Number(day.slice(-2))}</span>
                  <span className="flex flex-wrap justify-center gap-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className={cn("size-1.5 rounded-full", e.date < today ? "bg-slate-500" : "bg-violet-400")} />
                    ))}
                  </span>
                  {dayEvents.length > 0 && <span className="hidden text-[9px] font-bold uppercase tracking-wide text-dim sm:block">{dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="glass rounded-2xl p-5">
            <h3 className="flex items-center gap-2 font-display font-bold text-ink">
              <CalendarDays className="size-4 text-cyan-300" aria-hidden /> {fmtDate(selected)}
            </h3>
            <div className="mt-4 space-y-3">
              {selectedEvents.length === 0 ? (
                <EmptyState title="Nothing scheduled" body="Pick a day with a violet dot to see its events." />
              ) : (
                selectedEvents.map((e) => (
                  <Link key={e.id} to={`/events/${e.id}`} className="glass card-hover block rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{e.title}</p>
                      <CategoryBadge category={e.category} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      {fmtTime(e.startTime)} – {fmtTime(e.endTime)} · {e.fee === 0 ? "Free" : `₹${e.fee}`}
                    </p>
                    {e.date < today && <Badge tone="slate" className="mt-2">Concluded</Badge>}
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="glass rounded-2xl p-5 text-xs leading-relaxed text-muted">
            <p className="font-semibold text-ink">Legend</p>
            <p className="mt-2 flex items-center gap-2"><span className="size-1.5 rounded-full bg-violet-400" /> Upcoming event</p>
            <p className="mt-1 flex items-center gap-2"><span className="size-1.5 rounded-full bg-slate-500" /> Concluded event</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
