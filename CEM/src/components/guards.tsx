import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import type { Role } from "@/services/types";
import { dashboardPathFor, useApp } from "@/context/AppContext";
import { useToast } from "./overlays";
import { LinkButton } from "./ui";

/** Blocks anonymous visitors — sends them to /login preserving the target. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname, msg: "Please sign in to continue." }} replace />;
  }
  return <>{children}</>;
}

/** Enforces role boundaries client-side (RLS enforces them server-side in prod). */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname, msg: "Please sign in to continue." }} replace />;
  }
  if (user.role !== role) {
    return <AccessDenied role={user.role} />;
  }
  return <>{children}</>;
}

function AccessDenied({ role }: { role: Role }) {
  const toast = useToast();
  useEffect(() => {
    toast.error("Access restricted", "Your role does not have permission to open that area.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-400">
        <ShieldAlert className="size-8" aria-hidden />
      </div>
      <h1 className="font-display text-2xl font-bold text-ink">Restricted area</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        This dashboard belongs to a different role. You are signed in as <span className="font-semibold text-ink">{role}</span>.
      </p>
      <LinkButton to={dashboardPathFor(role)} className="mt-6">
        Go to my dashboard
      </LinkButton>
    </div>
  );
}
