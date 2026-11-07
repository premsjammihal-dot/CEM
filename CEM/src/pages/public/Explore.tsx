import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarX2, Search } from "lucide-react";
import { EVENT_CATEGORIES } from "@/assets/posters";
import { publishedEvents } from "@/services/events";
import { useDbTick } from "@/services/db";
import { cn, todayIso } from "@/lib/utils";
import { EventCard } from "@/components/eventBits";
import { EmptyState, Input, Select } from "@/components/ui";

type SortKey = "date-asc" | "date-desc" | "fee-asc" | "fee-desc" | "capacity";
type When = "upcoming" | "all" | "past";

export default function ExplorePage() {
  useDbTick();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "";
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date-asc");
  const [when, setWhen] = useState<When>("upcoming");

  const events = useMemo(() => {
    let list = publishedEvents();
    const today = todayIso();
    if (when === "upcoming") list = list.filter((e) => e.date >= today);
    if (when === "past") list = list.filter((e) => e.date < today);
    if (category) list = list.filter((e) => e.category === category);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
    switch (sort) {
      case "date-desc":
        return [...list].sort((a, b) => b.date.localeCompare(a.date));
      case "fee-asc":
        return [...list].sort((a, b) => a.fee - b.fee);
      case "fee-desc":
        return [...list].sort((a, b) => b.fee - a.fee);
      case "capacity":
        return [...list].sort((a, b) => b.capacity - a.capacity);
      default:
        return [...list].sort((a, b) => a.date.localeCompare(b.date));
    }
  }, [category, search, sort, when]);

  const pickCategory = (c: string) => {
    if (!c) params.delete("category");
    else params.set("category", c);
    setParams(params, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="max-w-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Explore</p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink">Find your next event</h1>
        <p className="mt-3 text-muted">Search every published event on campus — filter by category, window and budget.</p>
      </div>

      <div className="sticky top-16 z-30 mt-9 space-y-4 rounded-2xl border border-line bg-panel/90 p-4 backdrop-blur-xl">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events, keywords…" icon={Search} aria-label="Search events" />
          <Select
            aria-label="Time window"
            value={when}
            onChange={(e) => setWhen(e.target.value as When)}
            options={[
              { value: "upcoming", label: "Upcoming" },
              { value: "all", label: "All events" },
              { value: "past", label: "Past events" },
            ]}
          />
          <Select
            aria-label="Sort by"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            options={[
              { value: "date-asc", label: "Date · soonest" },
              { value: "date-desc", label: "Date · latest" },
              { value: "fee-asc", label: "Fee · low to high" },
              { value: "fee-desc", label: "Fee · high to low" },
              { value: "capacity", label: "Largest capacity" },
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Category filter">
          <button
            onClick={() => pickCategory("")}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
              !category ? "border-violet-500/60 bg-violet-500/15 text-violet-200" : "border-line text-muted hover:border-slate-500/40 hover:text-ink",
            )}
          >
            All
          </button>
          {EVENT_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => pickCategory(c)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                category === c ? "border-violet-500/60 bg-violet-500/15 text-violet-200" : "border-line text-muted hover:border-slate-500/40 hover:text-ink",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-8 text-sm text-muted" role="status">
        {events.length} event{events.length === 1 ? "" : "s"} found
      </p>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="No events match"
          body="Try widening the time window, clearing the search, or picking a different category."
          action={
            <button
              onClick={() => {
                setSearch("");
                setWhen("upcoming");
                pickCategory("");
              }}
              className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Reset all filters
            </button>
          }
        />
      ) : (
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
