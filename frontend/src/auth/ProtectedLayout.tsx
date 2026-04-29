import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/layouts/AppShell";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

export function ProtectedLayout() {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/role" replace state={{ from: location.pathname }} />;
  }

  // Teachers have their own portal — redirect them out of the student shell
  if (user && user.role === "teacher") {
    return <Navigate to="/teacher" replace />;
  }

  return (
    <AppShell>
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
    </AppShell>
  );
}
