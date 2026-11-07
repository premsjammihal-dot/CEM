import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Award,
  Bell,
  CalendarDays,
  CalendarPlus,
  CheckCheck,
  ClipboardList,
  Globe,
  Landmark,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Star,
  Ticket,
  UserRound,
  Users,
  UsersRound,
  Wallet,
  Building2,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn, relTime } from "@/lib/utils";
import { Avatar, Button, Logo } from "@/components/ui";
import { Drawer } from "@/components/overlays";
import { useApp } from "@/context/AppContext";
import { markAllRead, markRead, myNotifications } from "@/services/notify";
import type { NotificationKind, Role } from "@/services/types";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAVS: Record<Role, NavItem[]> = {
  student: [
    { to: "/app/student", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/app/student/events", label: "My Events", icon: Ticket },
    { to: "/app/student/teams", label: "Teams", icon: UsersRound },
    { to: "/app/student/certificates", label: "Certificates", icon: Award },
    { to: "/app/student/feedback", label: "Feedback", icon: Star },
    { to: "/app/student/profile", label: "Profile", icon: UserRound },
  ],
  coordinator: [
    { to: "/app/coordinator", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/app/coordinator/events", label: "My Events", icon: CalendarDays, end: true },
    { to: "/app/coordinator/events/new", label: "Create Event", icon: CalendarPlus },
    { to: "/app/coordinator/profile", label: "Profile", icon: UserRound },
  ],
  faculty: [
    { to: "/app/faculty", label: "Assigned Events", icon: LayoutDashboard, end: true },
    { to: "/app/faculty/profile", label: "Profile", icon: UserRound },
  ],
  admin: [
    { to: "/app/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/app/admin/approvals", label: "Approvals", icon: CheckCheck },
    { to: "/app/admin/users", label: "Users", icon: Users },
    { to: "/app/admin/finance", label: "Finance & Reports", icon: Wallet },
    { to: "/app/admin/org", label: "Organization", icon: Landmark },
  ],
};

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  registration: Ticket,
  announcement: Bell,
  schedule: CalendarDays,
  deadline: CalendarPlus,
  result: ClipboardList,
  certificate: Award,
  approval: CheckCheck,
  system: Globe,
};

const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  coordinator: "Event Coordinator",
  faculty: "Faculty / Judge",
  admin: "Super Admin",
};

export function DashboardLayout({ role }: { role: Role }) {
  const { user, unread, logoutUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) return null;
  const items = NAVS[role];
  const notes = notifOpen ? myNotifications(user.id) : [];

  const signOut = () => {
    logoutUser();
    navigate("/");
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 items-center border-b border-line px-4", collapsed ? "justify-center" : "justify-between")}>
        <Logo compact={collapsed} />
        <button onClick={() => setCollapsed((v) => !v)} className="hidden rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-ink lg:block" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
        {items.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            title={collapsed ? n.label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400",
                collapsed && "justify-center px-0",
                isActive ? "bg-gradient-to-r from-violet-600/25 to-purple-600/10 text-violet-200 neon-ring" : "text-muted hover:bg-white/5 hover:text-ink",
              )
            }
          >
            <n.icon className="size-[18px] shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{n.label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <div className={cn("flex items-center gap-3 rounded-xl bg-panel-2/70 p-3", collapsed && "justify-center p-2")}>
          <Avatar name={user.name} size="sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="truncate text-[11px] text-cyan-300">{ROLE_LABEL[role]}</p>
            </div>
          )}
        </div>
        <div className={cn("mt-2 flex gap-1.5", collapsed && "flex-col")}>
          <Link to="/" title="Public site" className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg border border-line py-2 text-xs font-medium text-muted transition-colors hover:text-ink", collapsed && "px-0")}>
            <Globe className="size-3.5" aria-hidden />
            {!collapsed && "Site"}
          </Link>
          <button onClick={signOut} title="Sign out" className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-500/25 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/10", collapsed && "px-0")}>
            <LogOut className="size-3.5" aria-hidden />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 border-r border-line bg-panel/60 backdrop-blur-xl transition-all duration-300 lg:block", collapsed ? "w-[76px]" : "w-64")}>
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-base/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-line bg-panel">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-muted hover:text-ink" aria-label="Close menu">
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-line bg-base/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-ink lg:hidden" aria-label="Open menu">
              <PanelLeftOpen className="size-5" />
            </button>
            <div className="hidden items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted sm:flex">
              <Building2 className="size-3.5 text-cyan-300" aria-hidden />
              {ROLE_LABEL[role]} workspace
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setNotifOpen(true)} className="relative rounded-xl border border-line bg-panel p-2.5 text-muted transition-colors hover:border-violet-500/40 hover:text-ink" aria-label={`Notifications, ${unread} unread`}>
              <Bell className="size-[18px]" aria-hidden />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            <Link to={`/app/${role}/profile`} className="hidden sm:block" aria-label="Profile">
              <Avatar name={user.name} size="sm" />
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl animate-rise" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>

      <Drawer open={notifOpen} onClose={() => setNotifOpen(false)} title="Notifications">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-muted">{unread} unread</p>
          <Button variant="ghost" size="sm" onClick={() => markAllRead(user.id)} disabled={unread === 0}>
            Mark all read
          </Button>
        </div>
        {notes.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">You're all caught up.</p>
        ) : (
          <ul className="space-y-2.5">
            {notes.map((n) => {
              const Icon = KIND_ICON[n.kind];
              return (
                <li key={n.id}>
                  <button
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
                      n.read ? "border-line/60 bg-transparent opacity-70" : "border-violet-500/25 bg-violet-500/5 hover:border-violet-500/45",
                    )}
                  >
                    <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", n.read ? "bg-white/5 text-dim" : "bg-violet-500/15 text-violet-300")}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{n.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">{n.body}</span>
                      <span className="mt-1 block text-[10px] uppercase tracking-wider text-dim">{relTime(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Drawer>
    </div>
  );
}
