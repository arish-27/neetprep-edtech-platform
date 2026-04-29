export type AuthRole = "student" | "teacher";

const KEY = "neet_role_v1";

export function hasAuthRole() {
  try {
    return localStorage.getItem(KEY) != null;
  } catch {
    return false;
  }
}

export function loadAuthRole(): AuthRole {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "teacher") return "teacher";
    return "student";
  } catch {
    return "student";
  }
}

export function saveAuthRole(role: AuthRole) {
  try {
    localStorage.setItem(KEY, role);
  } catch {
    // ignore
  }
}
