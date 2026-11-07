import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Save, Send, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { createEvent, updateEvent } from "@/services/events";
import { eventById } from "@/services/lookups";
import { db } from "@/services/db";
import { EVENT_CATEGORIES, POSTER_OPTIONS } from "@/assets/posters";
import { eventSchema, zodErrors, type EventFormValues, type FieldErrors } from "@/lib/validators";
import { useToast } from "@/components/overlays";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";

export default function EventFormPage() {
  const { user } = useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const editing = id ? eventById(id) : undefined;

  const allVenues = db().venues;
  const facultyList = db().profiles.filter((p) => p.role === "faculty" && p.active);

  const defaults = useMemo<EventFormValues>(() => {
    if (editing) {
      return {
        title: editing.title,
        category: editing.category,
        description: editing.description,
        poster: editing.poster,
        date: editing.date,
        startTime: editing.startTime,
        endTime: editing.endTime,
        venueId: editing.venueId,
        fee: editing.fee,
        capacity: editing.capacity,
        regDeadline: editing.regDeadline,
        eligibility: editing.eligibility,
        rules: editing.rules,
        facultyId: editing.facultyId,
        teamSizeMin: editing.teamSizeMin,
        teamSizeMax: editing.teamSizeMax,
        featured: editing.featured,
      };
    }
    return {
      title: "",
      category: "Technical",
      description: "",
      poster: "grad:aurora",
      date: "",
      startTime: "09:00",
      endTime: "17:00",
      venueId: allVenues[0]?.id ?? "",
      fee: 0,
      capacity: 100,
      regDeadline: "",
      eligibility: "Open to all students.",
      rules: ["College ID card is mandatory at the venue."],
      facultyId: facultyList[0]?.id ?? "",
      teamSizeMin: 1,
      teamSizeMax: 1,
      featured: false,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const [values, setValues] = useState<EventFormValues>(defaults);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  if (id && !editing) {
    return (
      <Card>
        <p className="text-sm text-muted">Event not found. It may have been deleted.</p>
      </Card>
    );
  }
  if (editing && editing.coordinatorId !== user.id) {
    return (
      <Card>
        <p className="text-sm text-rose-300">You can only edit events you coordinate.</p>
      </Card>
    );
  }

  const set = <K extends keyof EventFormValues>(k: K, v: EventFormValues[K]) => setValues((f) => ({ ...f, [k]: v }));

  const addRule = () => set("rules", [...values.rules, ""]);
  const setRule = (i: number, v: string) => set("rules", values.rules.map((r, idx) => (idx === i ? v : r)));
  const removeRule = (i: number) => set("rules", values.rules.filter((_, idx) => idx !== i));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = eventSchema.safeParse({ ...values, rules: values.rules.map((r) => r.trim()).filter(Boolean) });
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      toast.error("Check the form", "Some fields need attention before submitting.");
      return;
    }
    setErrors({});
    setBusy(true);
    const res = editing ? updateEvent(editing.id, parsed.data) : createEvent(user.id, parsed.data);
    setBusy(false);
    if (!res.ok) {
      toast.error(editing ? "Update failed" : "Submission failed", res.error);
      return;
    }
    if (editing) {
      toast.success("Event updated", parsed.data.title);
      navigate(`/app/coordinator/events/${editing.id}`);
    } else {
      toast.success("Submitted for approval", "The Super Admin has been notified. It goes live once approved.");
      navigate("/app/coordinator/events");
    }
  };

  const num = (k: keyof EventFormValues) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as EventFormValues[keyof EventFormValues]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{editing ? `Edit — ${editing.title}` : "Create event"}</h1>
        <p className="mt-1 text-sm text-muted">
          {editing ? "Changes apply instantly. Major edits don't re-trigger approval." : "New events enter the approval queue and publish after Super Admin review."}
        </p>
      </div>

      <form onSubmit={submit} noValidate className="space-y-6">
        <Card className="space-y-5">
          <h2 className="font-display text-lg font-semibold text-ink">Basics</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label="Event title" value={values.title} onChange={(e) => set("title", e.target.value)} error={errors.title} placeholder="NeuraHack 2026" />
            </div>
            <Select label="Category" value={values.category} onChange={(e) => set("category", e.target.value)} error={errors.category} options={EVENT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
            <Select label="Poster artwork" value={values.poster} onChange={(e) => set("poster", e.target.value)} options={POSTER_OPTIONS} />
            <div className="sm:col-span-2">
              <Textarea label="Description" value={values.description} onChange={(e) => set("description", e.target.value)} error={errors.description} placeholder="What happens, who should come, what they'll take away…" />
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <h2 className="font-display text-lg font-semibold text-ink">Schedule & venue</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Event date" type="date" value={values.date} onChange={(e) => set("date", e.target.value)} error={errors.date} />
            <Select label="Venue" value={values.venueId} onChange={(e) => set("venueId", e.target.value)} error={errors.venueId} options={allVenues.map((v) => ({ value: v.id, label: `${v.name} · ${v.capacity} pax` }))} />
            <Input label="Start time" type="time" value={values.startTime} onChange={(e) => set("startTime", e.target.value)} error={errors.startTime} />
            <Input label="End time" type="time" value={values.endTime} onChange={(e) => set("endTime", e.target.value)} error={errors.endTime} />
            <Input label="Registration deadline" type="date" value={values.regDeadline} onChange={(e) => set("regDeadline", e.target.value)} error={errors.regDeadline} />
          </div>
        </Card>

        <Card className="space-y-5">
          <h2 className="font-display text-lg font-semibold text-ink">Capacity, fees & teams</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Entry fee (₹, 0 = free)" type="number" min={0} value={values.fee || ""} onChange={num("fee")} error={errors.fee} placeholder="0" />
            <Input label="Seat capacity" type="number" min={1} value={values.capacity || ""} onChange={num("capacity")} error={errors.capacity} />
            <Input label="Min team size" type="number" min={1} max={12} value={values.teamSizeMin || ""} onChange={num("teamSizeMin")} error={errors.teamSizeMin} hint="1 = solo entries allowed" />
            <Input label="Max team size" type="number" min={1} max={12} value={values.teamSizeMax || ""} onChange={num("teamSizeMax")} error={errors.teamSizeMax} />
          </div>
        </Card>

        <Card className="space-y-5">
          <h2 className="font-display text-lg font-semibold text-ink">Governance</h2>
          <Textarea label="Eligibility" value={values.eligibility} onChange={(e) => set("eligibility", e.target.value)} error={errors.eligibility} className="min-h-20" />
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Rules ({values.rules.filter((r) => r.trim()).length})</p>
            <div className="space-y-2.5">
              {values.rules.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={r} onChange={(e) => setRule(i, e.target.value)} placeholder={`Rule ${i + 1}`} aria-label={`Rule ${i + 1}`} />
                  <button type="button" onClick={() => removeRule(i)} disabled={values.rules.length === 1} className="shrink-0 rounded-xl border border-line px-3 text-muted transition-colors hover:border-rose-500/40 hover:text-rose-300 disabled:opacity-40" aria-label={`Remove rule ${i + 1}`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addRule} className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200">
                <Plus className="size-3.5" aria-hidden /> Add rule
              </button>
              {errors.rules ? <p className="text-xs text-rose-400">{errors.rules}</p> : null}
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Select label="Faculty judge" value={values.facultyId} onChange={(e) => set("facultyId", e.target.value)} error={errors.facultyId} options={facultyList.map((f) => ({ value: f.id, label: f.name }))} />
            <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-line bg-panel px-4 py-3">
              <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 accent-violet-500" />
              <span className="text-sm text-muted">
                Feature on homepage <span className="block text-[11px] text-dim">Subject to admin approval</span>
              </span>
            </label>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" size="lg" loading={busy} icon={editing ? Save : Send}>
            {editing ? "Save changes" : "Submit for approval"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
