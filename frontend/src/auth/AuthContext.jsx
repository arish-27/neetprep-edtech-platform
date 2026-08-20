import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { loadAuthSnapshot, saveAuthSnapshot, } from "@/auth/authStorage";
import { api, ApiError } from "@/lib/api";
import { getDeviceId } from "@/lib/device";
const AuthContext = createContext(null);
function toAuthUser(user) {
    return {
        id: String(user.id ?? ""),
        name: String(user.username ?? "Student"),
        email: String(user.email ?? ""),
        role: user.role === "admin" ? "admin" : user.role === "teacher" ? "teacher" : "student",
        isPaidUser: Boolean(user.is_paid ?? false),
        createdAt: String(user.created_at ?? ""),
    };
}
/** Try /auth/me; if 401 and we have a refresh token, refresh first then retry. */
async function fetchMe(refreshToken) {
    try {
        return await api.auth.me();
    }
    catch (err) {
        if (!(err instanceof ApiError))
            return null; // network error — treat as "unknown, stay logged in"
        if (err.status !== 401 || !refreshToken)
            throw err; // definitive failure
        // Access token expired — try refresh
        try {
            const refreshResp = await fetch("/api/v1/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken, device_id: getDeviceId() }),
            });
            if (!refreshResp.ok)
                throw new Error("refresh_failed");
            const data = await refreshResp.json();
            if (!data.access_token)
                throw new Error("refresh_failed");
            // Save new access token and retry /auth/me
            const current = loadAuthSnapshot();
            saveAuthSnapshot({ ...current, accessToken: data.access_token, token: data.access_token });
            return await api.auth.me();
        }
        catch {
            throw err; // refresh failed — caller will clear session
        }
    }
}
export function AuthProvider({ children }) {
    const [snapshot, setSnapshot] = useState(() => loadAuthSnapshot());
    const snapshotRef = useRef(snapshot);
    useEffect(() => {
        snapshotRef.current = snapshot;
    }, [snapshot]);
    useEffect(() => {
        const onSnapshotChanged = (_e) => {
            const next = loadAuthSnapshot();
            snapshotRef.current = next;
            setSnapshot(next);
        };
        globalThis.addEventListener("neet_auth_snapshot", onSnapshotChanged);
        return () => {
            globalThis.removeEventListener("neet_auth_snapshot", onSnapshotChanged);
        };
    }, []);
    const update = useCallback((next) => {
        const prev = snapshotRef.current;
        const resolved = typeof next === "function" ? next(prev) : next;
        snapshotRef.current = resolved;
        saveAuthSnapshot(resolved);
        setSnapshot(resolved);
    }, []);
    const value = useMemo(() => {
        return {
            token: snapshot.token,
            accessToken: snapshot.accessToken,
            refreshToken: snapshot.refreshToken,
            user: snapshot.user,
            pendingOtpTarget: snapshot.pendingOtpTarget,
            async signIn({ email, password }) {
                const resp = await api.auth.login({ email, password, role: "student", device_id: getDeviceId() });
                const user = toAuthUser(resp.user);
                update((prev) => ({
                    ...prev,
                    token: resp.access_token,
                    accessToken: resp.access_token,
                    refreshToken: resp.refresh_token,
                    user,
                }));
            },
            async signInTeacher({ email, password, teacherCode }) {
                const resp = await api.auth.login({ email, password, role: "teacher", device_id: getDeviceId(), teacher_code: teacherCode });
                const user = toAuthUser(resp.user);
                update((prev) => ({
                    ...prev,
                    token: resp.access_token,
                    accessToken: resp.access_token,
                    refreshToken: resp.refresh_token,
                    user,
                }));
            },
            async signInAdmin({ email, password }) {
                const resp = await api.auth.login({ email, password, role: "admin", device_id: getDeviceId() });
                const user = toAuthUser(resp.user);
                update((prev) => ({
                    ...prev,
                    token: resp.access_token,
                    accessToken: resp.access_token,
                    refreshToken: resp.refresh_token,
                    user,
                }));
            },
            async signUp({ name, email, password }) {
                const resp = await api.auth.register({ name, email, password, device_id: getDeviceId() });
                const user = toAuthUser(resp.user);
                update((prev) => ({
                    ...prev,
                    token: resp.access_token,
                    accessToken: resp.access_token,
                    refreshToken: resp.refresh_token,
                    user,
                }));
            },
            signOut() {
                update({
                    token: null,
                    accessToken: null,
                    refreshToken: null,
                    user: null,
                });
                // Clear any cached data and redirect to teacher login
                try {
                    globalThis.dispatchEvent(new Event("neet_auth_snapshot"));
                }
                catch { /* ignore */ }
            },
            async updateProfile({ name }) {
                const nextName = name.trim();
                if (!snapshot.user)
                    return;
                if (!nextName)
                    throw new Error("Name cannot be empty.");
                update({
                    ...snapshot,
                    user: { ...snapshot.user, name: nextName },
                });
            },
            async requestOtp({ target }) {
                if (!target.trim())
                    throw new Error("Enter email or phone.");
                update({ ...snapshot, pendingOtpTarget: target });
            },
            async verifyOtp({ code }) {
                if (!code.trim() || code.trim().length < 4) {
                    throw new Error("Enter a valid OTP.");
                }
                const target = snapshot.pendingOtpTarget ?? "";
                update({
                    token: snapshot.token,
                    accessToken: snapshot.accessToken,
                    refreshToken: snapshot.refreshToken,
                    user: {
                        id: snapshot.user?.id ?? "",
                        name: snapshot.user?.name ?? "Student",
                        email: target.includes("@") ? target : "student@example.com",
                        role: snapshot.user?.role ?? "student",
                        isPaidUser: snapshot.user?.isPaidUser ?? false,
                    },
                });
            },
            async refreshMe() {
                const me = await api.auth.me();
                const mapped = toAuthUser(me);
                update((prev) => ({ ...prev, user: mapped }));
            },
        };
    }, [snapshot, update]);
    useEffect(() => {
        const token = snapshot.accessToken ?? snapshot.token;
        if (!token)
            return;
        // If we already have user data, don't call /auth/me on every render
        if (snapshot.user)
            return;
        fetchMe(snapshot.refreshToken ?? null)
            .then((me) => {
            if (!me)
                return;
            const mapped = toAuthUser(me);
            update((prev) => ({ ...prev, user: mapped }));
        })
            .catch((err) => {
            if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
                update({ token: null, accessToken: null, refreshToken: null, user: null });
            }
        });
    }, [snapshot.accessToken, snapshot.token, snapshot.refreshToken, snapshot.user, update]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
