import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { TeacherShell } from "@/layouts/TeacherShell";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

export function TeacherLayout() {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/teacher/login" replace state={{ from: location.pathname }} />;
  }

  // Wait for /auth/me to populate the user before role-gating.
  if (!user) return <PageSkeleton />;

  if (user.role !== "teacher" && user.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return (
    <TeacherShell>
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
    </TeacherShell>
  );
}
