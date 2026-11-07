import { Link } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Award, BadgeIndianRupee, CalendarDays, CheckCheck, ClipboardList, Gauge, Users } from "lucide-react";
import { eventsByCategory, platformStats, registrationsByMonth, revenueByCategory } from "@/services/events";
import { recentActivity } from "@/services/admin";
import { relTime } from "@/lib/utils";
import { Badge, Card, LinkButton, StatCard } from "@/components/ui";
import { CHART_COLORS, ChartCard, tooltipStyle } from "@/components/data";

export default function AdminOverview() {
  const stats = platformStats();
  const monthly = registrationsByMonth();
  const categories = eventsByCategory();
  const revenue = revenueByCategory();
  const activity = recentActivity(9);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Super Admin</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Platform control</h1>
          <p className="mt-1.5 text-sm text-muted">Live figures from the demo dataset — every number below is computed from real tables.</p>
        </div>
        {stats.pendingApprovals > 0 && (
          <LinkButton to="/app/admin/approvals" variant="neon" icon={CheckCheck}>
            {stats.pendingApprovals} event{stats.pendingApprovals === 1 ? "" : "s"} awaiting approval
          </LinkButton>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} sub={`${stats.students} students · ${stats.coordinators} coordinators · ${stats.faculty} faculty`} accent="violet" />
        <StatCard icon={CalendarDays} label="Events" value={stats.totalEvents} sub={`${stats.liveEvents} live & upcoming`} accent="cyan" />
        <StatCard icon={ClipboardList} label="Registrations" value={stats.totalRegistrations} accent="amber" />
        <StatCard icon={BadgeIndianRupee} label="Revenue" value={`₹${stats.revenue.toLocaleString("en-IN")}`} sub={`${stats.certificatesIssued} certificates issued`} accent="green" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Registrations — last 6 months" sub="Confirmed + attended, demo timeline">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly} margin={{ left: -18, right: 8, top: 6 }}>
              <defs>
                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#regGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Events by category">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categories} margin={{ left: -18, right: 8, top: 6 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {categories.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by category" sub="Paid registration fees">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={revenue} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3} stroke="none">
                {revenue.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Health snapshot">
          <div className="flex h-full flex-col justify-center gap-5">
            {[
              { icon: Gauge, label: "Attendance rate", value: `${stats.attendanceRate}%`, tone: "text-cyan-300" },
              { icon: CheckCheck, label: "Pending approvals", value: `${stats.pendingApprovals}`, tone: "text-amber-300" },
              { icon: Award, label: "Certificates issued", value: `${stats.certificatesIssued}`, tone: "text-violet-300" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between rounded-xl border border-line bg-panel px-5 py-4">
                <span className="flex items-center gap-3 text-sm text-muted">
                  <r.icon className={`size-5 ${r.tone}`} aria-hidden /> {r.label}
                </span>
                <span className={`font-display text-xl font-bold ${r.tone}`}>{r.value}</span>
              </div>
            ))}
            <Link to="/app/admin/finance" className="text-center text-xs font-semibold text-cyan-300 hover:text-cyan-200">
              Open finance & reports →
            </Link>
          </div>
        </ChartCard>
      </div>

      <Card>
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-ink">
          <Activity className="size-4 text-violet-300" aria-hidden /> Recent activity
        </h3>
        <ul className="mt-4 divide-y divide-line/60">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-muted">{a.text}</span>
              <Badge tone="slate">{relTime(a.at)}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
