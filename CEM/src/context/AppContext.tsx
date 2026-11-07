import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Profile, Role, Student } from "@/services/types";
import { currentUser, login as svcLogin, logout as svcLogout, registerStudent as svcRegister, type ServiceResult, type SessionUser, type StudentRegistrationInput } from "@/services/auth";
import { unreadCount } from "@/services/notify";
import { useDbTick } from "@/services/db";

interface AppState {
  user: Profile | null;
  student: Student | null;
  unread: number;
  refreshSession: () => void;
  loginWith: (email: string, password: string) => ServiceResult<SessionUser>;
  registerWith: (input: StudentRegistrationInput) => ServiceResult<SessionUser>;
  logoutUser: () => void;
}

const AppCtx = createContext<AppState | null>(null);

export function dashboardPathFor(role: Role): string {
  switch (role) {
    case "coordinator":
      return "/app/coordinator";
    case "faculty":
      return "/app/faculty";
    case "admin":
      return "/app/admin";
    default:
      return "/app/student";
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const tick = useDbTick(); // any table write re-evaluates the session snapshot
  const [session, setSession] = useState<SessionUser | null>(() => currentUser());

  const resolved = useMemo(() => {
    void tick;
    const fresh = currentUser();
    return fresh ?? session;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, session]);

  const refreshSession = useCallback(() => setSession(currentUser()), []);

  const loginWith = useCallback((email: string, password: string) => {
    const res = svcLogin(email, password);
    if (res.ok && res.data) setSession(res.data);
    return res;
  }, []);

  const registerWith = useCallback((input: StudentRegistrationInput) => {
    const res = svcRegister(input);
    if (res.ok && res.data) setSession(res.data);
    return res;
  }, []);

  const logoutUser = useCallback(() => {
    svcLogout();
    setSession(null);
  }, []);

  const state: AppState = {
    user: resolved?.profile ?? null,
    student: resolved?.student ?? null,
    unread: resolved ? unreadCount(resolved.profile.id) : 0,
    refreshSession,
    loginWith,
    registerWith,
    logoutUser,
  };

  return <AppCtx.Provider value={state}>{children}</AppCtx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
