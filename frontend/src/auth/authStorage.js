const KEY = "neet_auth_v1";
export function loadAuthSnapshot() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) {
            return { token: null, accessToken: null, refreshToken: null, user: null };
        }
        const parsed = JSON.parse(raw);
        const accessToken = typeof parsed.accessToken === "string"
            ? String(parsed.accessToken)
            : typeof parsed.token === "string"
                ? parsed.token
                : null;
        const refreshToken = typeof parsed.refreshToken === "string" ? String(parsed.refreshToken) : null;
        return {
            token: accessToken,
            accessToken,
            refreshToken,
            user: parsed.user && typeof parsed.user === "object"
                ? {
                    id: String(parsed.user.id ?? ""),
                    name: String(parsed.user.name ?? parsed.user.username ?? "Student"),
                    email: String(parsed.user.email ?? ""),
                    role: parsed.user.role === "admin"
                        ? "admin"
                        : parsed.user.role === "teacher"
                            ? "teacher"
                            : "student",
                    isPaidUser: Boolean(parsed.user.isPaidUser ?? parsed.user.is_paid ?? false),
                    createdAt: String(parsed.user.createdAt ?? parsed.user.created_at ?? ""),
                }
                : null,
            pendingOtpTarget: typeof parsed.pendingOtpTarget === "string"
                ? parsed.pendingOtpTarget
                : undefined,
        };
    }
    catch {
        return { token: null, accessToken: null, refreshToken: null, user: null };
    }
}
export function saveAuthSnapshot(snapshot) {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
}
export function clearAuthSnapshot() {
    localStorage.removeItem(KEY);
}
