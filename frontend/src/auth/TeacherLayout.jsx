import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { TeacherShell } from "@/layouts/TeacherShell";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

export function TeacherLayout() {
    const { token, user } = useAuth();
    const location = useLocation();

    // No token or not a teacher → redirect to teacher login
    if (!token || (user && user.role !== "teacher" && user.role !== "admin")) {
        return <Navigate to="/teacher/login" replace state={{ from: location.pathname }} />;
    }

    // Token exists but user not loaded yet → show skeleton
    if (!user) return <PageSkeleton />;

    // All good → render the teacher shell
    return (
        <TeacherShell>
            <Suspense fallback={<PageSkeleton />}>
                <Outlet />
            </Suspense>
        </TeacherShell>
    );
}
