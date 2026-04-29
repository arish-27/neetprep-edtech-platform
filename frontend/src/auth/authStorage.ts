export type UserRole = "student" | "teacher" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isPaidUser?: boolean;
  createdAt?: string;
};

export type AuthSnapshot = {
  /**
   * Back-compat alias for `accessToken`.
   * Prefer `accessToken` for new code.
   */
  token: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  pendingOtpTarget?: string;
};

const KEY = "neet_auth_v1";

export function loadAuthSnapshot(): AuthSnapshot {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      return { token: null, accessToken: null, refreshToken: null, user: null };
    }
    const parsed = JSON.parse(raw) as Partial<AuthSnapshot>;
    const accessToken =
      typeof (parsed as any).accessToken === "string"
        ? String((parsed as any).accessToken)
        : typeof parsed.token === "string"
          ? parsed.token
          : null;
    const refreshToken = typeof (parsed as any).refreshToken === "string" ? String((parsed as any).refreshToken) : null;
    return {
      token: accessToken,
      accessToken,
      refreshToken,
      user:
        parsed.user && typeof parsed.user === "object"
          ? {
              id: String((parsed.user as any).id ?? ""),
              name: String((parsed.user as any).name ?? (parsed.user as any).username ?? "Student"),
              email: String((parsed.user as any).email ?? ""),
              role:
                (parsed.user as any).role === "admin"
                  ? "admin"
                  : (parsed.user as any).role === "teacher"
                    ? "teacher"
                    : "student",
              isPaidUser: Boolean((parsed.user as any).isPaidUser ?? (parsed.user as any).is_paid ?? false),
              createdAt: String((parsed.user as any).createdAt ?? (parsed.user as any).created_at ?? ""),
            }
          : null,
      pendingOtpTarget:
        typeof parsed.pendingOtpTarget === "string"
          ? parsed.pendingOtpTarget
          : undefined,
    };
  } catch {
    return { token: null, accessToken: null, refreshToken: null, user: null };
  }
}

export function saveAuthSnapshot(snapshot: AuthSnapshot) {
  localStorage.setItem(KEY, JSON.stringify(snapshot));
}

export function clearAuthSnapshot() {
  localStorage.removeItem(KEY);
}
