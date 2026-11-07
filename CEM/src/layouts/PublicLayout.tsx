import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { CalendarDays, Compass, Home, Info, LogOut, Mail, Menu, X, LayoutDashboard, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, LinkButton, Logo } from "@/components/ui";
import { dashboardPathFor, useApp } from "@/context/AppContext";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/events", label: "Explore Events", icon: Compass },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/about", label: "About", icon: Info },
  { to: "/contact", label: "Contact", icon: Mail },
];

export function PublicLayout() {
  const { user, logoutUser } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMobileOpen(false);
    setUserMenu(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-line bg-base/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6" aria-label="Primary">
          <Logo />
          <div className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400",
                    isActive ? "bg-violet-500/12 text-violet-300" : "text-muted hover:bg-white/5 hover:text-ink",
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-line bg-panel px-2.5 py-1.5 transition-colors hover:border-violet-500/40"
                  aria-haspopup="menu"
                  aria-expanded={userMenu}
                >
                  <Avatar name={user.name} size="sm" />
                  <span className="hidden max-w-28 truncate text-sm font-medium text-ink sm:block">{user.name.split(" ")[0]}</span>
                  <ChevronDown className="size-3.5 text-muted" aria-hidden />
                </button>
                {userMenu && (
                  <div className="absolute right-0 top-12 w-52 animate-rise rounded-xl border border-line bg-panel-2 p-1.5 shadow-2xl shadow-black/60" role="menu">
                    <Link to={dashboardPathFor(user.role)} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-white/5" role="menuitem">
                      <LayoutDashboard className="size-4 text-violet-300" aria-hidden /> My dashboard
                    </Link>
                    <button onClick={logoutUser} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10" role="menuitem">
                      <LogOut className="size-4" aria-hidden /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <LinkButton to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Sign in
                </LinkButton>
                <LinkButton to="/register" size="sm">
                  Register
                </LinkButton>
              </>
            )}
            <button onClick={() => setMobileOpen((v) => !v)} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-ink lg:hidden" aria-label="Toggle menu" aria-expanded={mobileOpen}>
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>
        {mobileOpen && (
          <div className="border-t border-line bg-panel/95 px-4 py-3 backdrop-blur-xl lg:hidden">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"} className={({ isActive }) => cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium", isActive ? "bg-violet-500/12 text-violet-300" : "text-muted hover:text-ink")}>
                <n.icon className="size-4" aria-hidden />
                {n.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-panel/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              The all-in-one platform for college events — discovery, registration, teams, QR attendance, judging, certificates and analytics in one sphere.
            </p>
            <p className="mt-4 text-xs text-dim">Demo deployment with seeded sample data. Production runs on Supabase.</p>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-dim">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="text-muted transition-colors hover:text-cyan-300">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-dim">Campus</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li>Pristine Institute of Technology</li>
              <li>events@campussphere.edu</li>
              <li>Student Activity Centre, Block A</li>
              <li>Mon–Sat, 9:00–17:00</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line py-5 text-center text-xs text-dim">© {new Date().getFullYear()} CampusSphere · Built for campus communities</div>
      </footer>
    </div>
  );
}
