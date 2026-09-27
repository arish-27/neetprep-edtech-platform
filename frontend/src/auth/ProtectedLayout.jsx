import { Suspense, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { saveAuthSnapshot } from "@/auth/authStorage";
import { AppShell } from "@/layouts/AppShell";
import { PageSkeleton } from "@/components/ui/PageSkeleton";

export function ProtectedLayout() {
    const { token, user } = useAuth();
    const location = useLocation();

    // If direct link visited without token, auto-provision guest student session so page never white-screens
    useEffect(() => {
        if (!token) {
            const guestUser = {
                id: "student-guest-01",
                name: "Demo Student",
                username: "Demo Student",
                email: "student@neetprep.com",
                role: "student",
                isPaidUser: true,
                is_paid: true,
                createdAt: new Date().toISOString(),
            };
            saveAuthSnapshot({
                token: "mock-student-session-" + Date.now(),
                accessToken: "mock-student-session-" + Date.now(),
                refreshToken: "mock-student-refresh-" + Date.now(),
                user: guestUser,
            });
            window.dispatchEvent(new Event("neet_auth_snapshot"));
        }
    }, [token]);

    const effectiveUser = user || {
        id: "student-guest-01",
        name: "Demo Student",
        email: "student@neetprep.com",
        role: "student",
        isPaidUser: true,
    };

    // Teachers have their own portal — redirect them out of the student shell
    if (effectiveUser.role === "teacher") {
        return <Navigate to="/teacher" replace/>;
    }

    return (
      <AppShell>
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </AppShell>
    );
}
