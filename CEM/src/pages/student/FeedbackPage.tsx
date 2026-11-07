import { useState } from "react";
import { MessageSquareQuote, Send, Star } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { myRegistrations } from "@/services/registrations";
import { myFeedback, submitFeedback } from "@/services/engage";
import { feedbackSchema, zodErrors, type FieldErrors } from "@/lib/validators";
import { cn, fmtDate, relTime } from "@/lib/utils";
import { Badge, Button, Card, EmptyState, Textarea } from "@/components/ui";
import { useToast } from "@/components/overlays";

function RatingPicker({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onClick={() => onChange(i)}
            className="rounded-lg p-1 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <Star className={cn("size-6", i <= value ? "fill-amber-400 text-amber-400" : "text-slate-600")} aria-hidden />
          </button>
        ))}
      </div>
      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

export default function FeedbackPage() {
  const { user } = useApp();
  const toast = useToast();
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  if (!user) return null;

  const attended = myRegistrations(user.id).filter((r) => r.reg.status === "attended");
  const given = myFeedback(user.id);
  const pending = attended.filter((r) => !given.some((g) => g.eventId === r.event.id));

  const submit = (eventId: string) => {
    const parsed = feedbackSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    const res = submitFeedback(user.id, eventId, parsed.data.rating, parsed.data.comment);
    if (!res.ok) {
      toast.error("Could not save feedback", res.error);
      return;
    }
    toast.success("Feedback submitted", "Thank you — organizers read every word.");
    setOpenFor(null);
    setRating(0);
    setComment("");
    setErrors({});
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Feedback</h1>
        <p className="mt-1 text-sm text-muted">Rate the events you attended. Reports go straight to coordinators and admins.</p>
      </div>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Awaiting your rating</h2>
        {pending.length === 0 ? (
          <EmptyState icon={MessageSquareQuote} title="All caught up" body="Attend an event and the feedback form unlocks automatically." />
        ) : (
          <div className="space-y-4">
            {pending.map(({ reg, event }) => (
              <Card key={reg.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold text-ink">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted">Attended on {fmtDate(event.date)}</p>
                  </div>
                  <Button size="sm" variant={openFor === event.id ? "secondary" : "outline"} onClick={() => setOpenFor(openFor === event.id ? null : event.id)}>
                    {openFor === event.id ? "Close" : "Share feedback"}
                  </Button>
                </div>
                {openFor === event.id && (
                  <div className="mt-5 space-y-4 border-t border-line/60 pt-5">
                    <RatingPicker value={rating} onChange={setRating} error={errors.rating} />
                    <Textarea
                      label="What went well? What should improve?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      error={errors.comment}
                      placeholder="Organization, venue, judging, food — anything counts."
                    />
                    <Button icon={Send} onClick={() => submit(event.id)}>
                      Submit feedback
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Your previous feedback</h2>
        {given.length === 0 ? (
          <p className="text-sm text-dim">Nothing submitted yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {given.map((g) => {
              const ev = attended.find((r) => r.event.id === g.eventId)?.event ?? myRegistrations(user.id).find((r) => r.event.id === g.eventId)?.event;
              return (
                <Card key={g.id}>
                  <div className="flex items-center justify-between">
                    <p className="font-display text-sm font-semibold text-ink">{ev?.title ?? "Event"}</p>
                    <Badge tone="amber">{g.rating} / 5</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">“{g.comment}”</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wider text-dim">{relTime(g.createdAt)}</p>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
