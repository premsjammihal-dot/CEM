import { HashRouter, Route, Routes } from "react-router-dom";
import { Link } from "react-router-dom";
import { Ghost } from "lucide-react";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider } from "@/components/overlays";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireRole } from "@/components/guards";
import { PublicLayout } from "@/layouts/PublicLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";

import HomePage from "@/pages/public/Home";
import AboutPage from "@/pages/public/About";
import ExplorePage from "@/pages/public/Explore";
import EventDetailsPage from "@/pages/public/EventDetails";
import CalendarPage from "@/pages/public/CalendarPage";
import ContactPage from "@/pages/public/Contact";

import LoginPage from "@/pages/auth/Login";
import RegisterPage from "@/pages/auth/Register";
import ResetPasswordPage from "@/pages/auth/ResetPassword";

import StudentOverview from "@/pages/student/StudentOverview";
import MyEventsPage from "@/pages/student/MyEvents";
import TeamsPage from "@/pages/student/Teams";
import CertificatesPage from "@/pages/student/Certificates";
import FeedbackPage from "@/pages/student/FeedbackPage";
import ProfilePage from "@/pages/shared/ProfilePage";

import CoordinatorOverview from "@/pages/coordinator/CoordinatorOverview";
import MyEventsList from "@/pages/coordinator/MyEventsList";
import EventFormPage from "@/pages/coordinator/EventForm";
import EventManagePage from "@/pages/coordinator/EventManage";

import FacultyOverview from "@/pages/faculty/FacultyOverview";
import JudgeEventPage from "@/pages/faculty/JudgeEvent";

import AdminOverview from "@/pages/admin/AdminOverview";
import ApprovalsPage from "@/pages/admin/Approvals";
import UsersAdminPage from "@/pages/admin/UsersAdmin";
import FinanceReportsPage from "@/pages/admin/FinanceReports";
import OrgAdminPage from "@/pages/admin/OrgAdmin";

function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-300">
        <Ghost className="size-8" aria-hidden />
      </div>
      <h1 className="font-display text-3xl font-bold text-ink">404 — off the map</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">That page drifted out of the sphere. Head back to solid ground.</p>
      <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 text-sm font-semibold text-white">
        Back to home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <HashRouter>
            <Routes>
              {/* ------------------------------ Public ------------------------------ */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/events" element={<ExplorePage />} />
                <Route path="/events/:id" element={<EventDetailsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* ------------------------------- Auth ------------------------------- */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* ------------------------------ Student ------------------------------ */}
              <Route
                path="/app/student"
                element={
                  <RequireRole role="student">
                    <DashboardLayout role="student" />
                  </RequireRole>
                }
              >
                <Route index element={<StudentOverview />} />
                <Route path="events" element={<MyEventsPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="certificates" element={<CertificatesPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* ---------------------------- Coordinator ---------------------------- */}
              <Route
                path="/app/coordinator"
                element={
                  <RequireRole role="coordinator">
                    <DashboardLayout role="coordinator" />
                  </RequireRole>
                }
              >
                <Route index element={<CoordinatorOverview />} />
                <Route path="events" element={<MyEventsList />} />
                <Route path="events/new" element={<EventFormPage />} />
                <Route path="events/:id" element={<EventManagePage />} />
                <Route path="events/:id/edit" element={<EventFormPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* ------------------------------ Faculty ------------------------------ */}
              <Route
                path="/app/faculty"
                element={
                  <RequireRole role="faculty">
                    <DashboardLayout role="faculty" />
                  </RequireRole>
                }
              >
                <Route index element={<FacultyOverview />} />
                <Route path="events/:id" element={<JudgeEventPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* ------------------------------- Admin ------------------------------- */}
              <Route
                path="/app/admin"
                element={
                  <RequireRole role="admin">
                    <DashboardLayout role="admin" />
                  </RequireRole>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="approvals" element={<ApprovalsPage />} />
                <Route path="users" element={<UsersAdminPage />} />
                <Route path="finance" element={<FinanceReportsPage />} />
                <Route path="org" element={<OrgAdminPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Routes>
          </HashRouter>
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
