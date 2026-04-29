import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { AdminShell } from "@/layouts/AdminShell";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

export function AdminLayout() {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/role" replace state={{ from: location.pathname }} />;
  }

  // Wait for /auth/me to populate the user before role-gating.
  if (!user) return <PageSkeleton />;

  if (user.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return (
    <AdminShell>
      <Suspense fallback={<PageSkeleton />}>
        <Outlet />
      </Suspense>
    </AdminShell>
  );
}
