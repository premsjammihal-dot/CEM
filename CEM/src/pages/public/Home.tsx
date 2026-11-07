import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, CalendarCheck2, Compass, QrCode, Quote, Sparkles, Trophy, UserRound, UsersRound, Zap } from "lucide-react";
import { HERO_IMG, EVENT_CATEGORIES } from "@/assets/posters";
import { featuredEvents, platformStats, upcomingPublished } from "@/services/events";
import { useDbTick } from "@/services/db";
import { fmtMoney } from "@/lib/utils";
import { EventCard } from "@/components/eventBits";
import { Avatar, Badge, LinkButton, SectionHeading } from "@/components/ui";

const STEPS = [
  { icon: Compass, title: "Discover", body: "Browse hackathons, fests, workshops and meets — filter by category, date or fee." },
  { icon: UsersRound, title: "Register", body: "Go solo or build a team by USN. Capacity, deadlines and duplicates are handled for you." },
  { icon: QrCode, title: "Check in", body: "Every ticket carries a unique QR. One scan at the door and your attendance is locked." },
  { icon: Trophy, title: "Celebrate", body: "Judged events publish verified results and downloadable certificates moments after approval." },
];

const TESTIMONIALS = [
  { name: "Shruti K", role: "CSE · 6th sem", quote: "Registered for three fests in five minutes. The QR check-in at RoboWars actually worked at the door — no queues." },
  { name: "Aditya R", role: "Event Coordinator", quote: "Approvals, budgets, attendance and results in one panel. I stopped maintaining spreadsheets entirely." },
  { name: "Prof. Latha M", role: "Faculty Judge", quote: "Scoring from my dashboard with instant approval workflow made result day completely stress-free." },
];

export default function HomePage() {
  useDbTick();
  const stats = platformStats();
  const featured = featuredEvents().slice(0, 3);
  const upcoming = upcomingPublished().filter((e) => !featured.some((f) => f.id === e.id)).slice(0, 4);

  return (
    <div>
      {/* ------------------------------- HERO ------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="size-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-b from-base/60 via-base/70 to-base" />
          <div className="bg-grid absolute inset-0" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 sm:pt-32">
          <div className="max-w-3xl animate-rise">
            <Badge tone="cyan" className="mb-6">
              <Sparkles className="size-3" aria-hidden /> The campus event operating system
            </Badge>
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-7xl">
              Discover.
              <br />
              <span className="gradient-text">Participate.</span>
              <br />
              Celebrate.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              CampusSphere unifies every college event — registrations, teams, QR attendance, judging, certificates and budgets — into one luminous dashboard.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <LinkButton to="/events" size="lg" icon={Compass}>
                Explore events
              </LinkButton>
              <LinkButton to="/register" variant="outline" size="lg">
                Create account
              </LinkButton>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-line/60 pt-8">
              {[
                { v: `${stats.liveEvents}`, l: "Live events" },
                { v: `${stats.totalRegistrations}`, l: "Registrations" },
                { v: fmtMoney(stats.revenue), l: "Ticket revenue" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{s.v}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-dim">{s.l} · demo data</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- CATEGORY MARQUEE --------------------------- */}
      <section className="overflow-hidden border-y border-line bg-panel/30 py-4" aria-hidden>
        <div className="flex w-max animate-marquee gap-3">
          {[...EVENT_CATEGORIES, ...EVENT_CATEGORIES, ...EVENT_CATEGORIES].map((c, i) => (
            <span key={i} className="flex items-center gap-2 rounded-full border border-line bg-panel px-5 py-2 text-sm font-semibold text-muted">
              <Zap className="size-3.5 text-cyan-300" /> {c}
            </span>
          ))}
        </div>
      </section>

      {/* ---------------------------- FEATURED ---------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading kicker="Handpicked" title="Featured events" sub="Flagship experiences curated by the student council." />
          <LinkButton to="/events" variant="ghost" icon={ArrowRight}>
            View all
          </LinkButton>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>

      {/* ----------------------------- UPCOMING ----------------------------- */}
      {upcoming.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <SectionHeading kicker="Next up" title="Coming soon to campus" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {upcoming.map((e) => (
              <Link
                key={e.id}
                to={`/events/${e.id}`}
                className="glass card-hover flex items-center gap-4 rounded-2xl p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400"
              >
                <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 text-center">
                  <span className="font-display text-lg font-extrabold leading-none text-ink">{new Date(e.date + "T00:00:00").getDate()}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">{new Date(e.date + "T00:00:00").toLocaleDateString("en-IN", { month: "short" })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold text-ink">{e.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{e.category} · {e.teamSizeMax > 1 ? "Team" : "Solo"}</p>
                </div>
                <Badge tone={e.fee === 0 ? "green" : "violet"}>{e.fee === 0 ? "Free" : `₹${e.fee}`}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------- HOW IT WORKS ---------------------------- */}
      <section className="border-y border-line bg-panel/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading kicker="The flow" title="How CampusSphere works" sub="Four steps between you and your next campus memory." center />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="glass card-hover relative rounded-2xl p-6">
                <span className="absolute right-5 top-4 font-display text-4xl font-extrabold text-white/5">0{i + 1}</span>
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/40 to-cyan-500/25 text-violet-200">
                  <s.icon className="size-5" aria-hidden />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- CATEGORIES GRID --------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading kicker="Browse" title="Event categories" sub="Jump straight into your scene." />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {EVENT_CATEGORIES.map((c) => (
            <Link
              key={c}
              to={`/events?category=${encodeURIComponent(c)}`}
              className="glass card-hover group flex items-center justify-between rounded-2xl px-5 py-4"
            >
              <span className="font-display text-sm font-semibold text-ink group-hover:text-cyan-200">{c}</span>
              <ArrowRight className="size-4 text-dim transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------- TESTIMONIALS ----------------------------- */}
      <section className="border-y border-line bg-panel/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading kicker="Voices" title="Loved across campus" sub="Sample quotes shown for demo purposes." center />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="glass card-hover rounded-2xl p-6">
                <Quote className="size-6 text-violet-400" aria-hidden />
                <blockquote className="mt-4 text-sm leading-relaxed text-muted">“{t.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <Avatar name={t.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-dim">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- CTA -------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="glass relative overflow-hidden rounded-3xl p-10 text-center sm:p-16">
          <div className="absolute -left-20 -top-20 size-64 rounded-full bg-violet-600/25 blur-3xl" aria-hidden />
          <div className="absolute -bottom-20 -right-20 size-64 rounded-full bg-cyan-500/20 blur-3xl" aria-hidden />
          <Badge tone="violet" className="relative mb-5">
            <BadgeCheck className="size-3" aria-hidden /> Free for students
          </Badge>
          <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-bold text-ink sm:text-4xl">
            Your next campus story starts with <span className="gradient-text">one registration</span>.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted">Create your student account in under a minute and get your first QR ticket today.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-4">
            <LinkButton to="/register" size="lg" icon={UserRound}>
              Register now
            </LinkButton>
            <LinkButton to="/calendar" variant="secondary" size="lg" icon={CalendarCheck2}>
              Open event calendar
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
