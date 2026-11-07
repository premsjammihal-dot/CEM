import { useState } from "react";
import { CheckCircle2, Clock3, Mail, MapPin, Phone, Send } from "lucide-react";
import { db } from "@/services/db";
import { sendContactMessage } from "@/services/engage";
import { contactSchema, zodErrors, type FieldErrors } from "@/lib/validators";
import { useToast } from "@/components/overlays";
import { Button, Input, SectionHeading, Textarea } from "@/components/ui";

export default function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const settings = db().settings;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrors(parsed.error));
      return;
    }
    setErrors({});
    setBusy(true);
    const res = sendContactMessage(parsed.data);
    setBusy(false);
    if (res.ok) {
      setSent(true);
      toast.success("Message sent", "The event office will reply within one working day.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <SectionHeading kicker="Contact" title="Talk to the event office" sub="Questions about registrations, sponsorships, or hosting your own event — we reply fast." />

      <div className="mt-12 grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          {[
            { icon: MapPin, label: "Visit", value: "Student Activity Centre, Block A, Pristine Institute of Technology" },
            { icon: Mail, label: "Email", value: settings.contactEmail },
            { icon: Phone, label: "Call", value: "+91 98100 10001 (Mon–Sat)" },
            { icon: Clock3, label: "Office hours", value: "9:00 AM – 5:00 PM" },
          ].map((c) => (
            <div key={c.label} className="glass card-hover flex items-start gap-4 rounded-2xl p-5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/40 to-cyan-500/25 text-violet-200">
                <c.icon className="size-5" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-dim">{c.label}</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-ink">{c.value}</p>
              </div>
            </div>
          ))}
          <div className="glass rounded-2xl p-5 text-xs leading-relaxed text-muted">
            Coordinators: submit event drafts from your dashboard — Super Admin approval is required before publishing. Students: queries about specific events
            should mention the event name in the subject.
          </div>
        </div>

        <div className="glass rounded-2xl p-7">
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <CheckCircle2 className="size-8" aria-hidden />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-ink">Message received</h3>
              <p className="mt-2 max-w-sm text-sm text-muted">Thanks, {form.name.split(" ")[0]}. Your message is in the admin inbox — expect a reply at {form.email}.</p>
              <Button
                variant="secondary"
                className="mt-6"
                onClick={() => {
                  setSent(false);
                  setForm({ name: "", email: "", subject: "", message: "" });
                }}
              >
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
              <Input label="Your name" value={form.name} onChange={set("name")} error={errors.name} placeholder="Aarav Kumar" autoComplete="name" />
              <Input label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="you@college.edu" autoComplete="email" />
              <div className="sm:col-span-2">
                <Input label="Subject" value={form.subject} onChange={set("subject")} error={errors.subject} placeholder="Sponsorship for NeuraHack 2025" />
              </div>
              <div className="sm:col-span-2">
                <Textarea label="Message" value={form.message} onChange={set("message")} error={errors.message} placeholder="Tell us what you need — include event names and dates where relevant." />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" loading={busy} icon={Send}>
                  Send message
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
