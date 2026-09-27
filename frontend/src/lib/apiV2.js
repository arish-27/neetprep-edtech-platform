/**
 * V2 API client — all new endpoints under /api/v1/v2/
 * The backend mounts everything under /api/v1, so v2 routes live at /api/v1/v2/.
 * Completely separate from the existing api.ts — no modifications.
 */
import { loadAuthSnapshot } from "@/auth/authStorage";
const BASE = import.meta.env?.DEV ? "/api/v1/v2" : "http://localhost:8001/api/v1/v2";
async function req(path, opts = {}) {
    const snap = loadAuthSnapshot();
    const token = snap.accessToken ?? snap.token;
    const headers = new Headers(opts.headers);
    if (token)
        headers.set("Authorization", `Bearer ${token}`);
    if (opts.body && !(opts.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    let url = `${BASE}${path}`;
    if (opts.query) {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(opts.query)) {
            if (v !== undefined && v !== null && v !== "")
                params.set(k, String(v));
        }
        const qs = params.toString();
        if (qs)
            url += `?${qs}`;
    }
    const resp = await fetch(url, { ...opts, headers });
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }));
        throw Object.assign(new Error(err.detail ?? "Request failed"), { status: resp.status });
    }
    if (resp.status === 204)
        return undefined;
    return resp.json();
}
// ── API methods ───────────────────────────────────────────────────────────────
export const apiV2 = {
    ai: {
        generateQuestions: (body) => req("/ai/generate-questions", { method: "POST", body: JSON.stringify(body) }),
    },
    assignments: {
        create: (body) => req("/assignments", { method: "POST", body: JSON.stringify(body) }),
        list: () => req("/assignments"),
        get: (id) => req(`/assignments/${id}`),
        submit: (id, answers) => req(`/assignments/${id}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),
    },
    doubts: {
        create: (body) => req("/doubts", { method: "POST", body: JSON.stringify(body) }),
        list: (params) => req("/doubts", { query: params }),
        answer: (id, answer) => req(`/doubts/${id}/answer`, { method: "POST", body: JSON.stringify({ answer }) }),
        upvote: (id) => req(`/doubts/${id}/upvote`, { method: "POST" }),
    },
    liveClasses: {
        schedule: (body) => req("/live-classes", { method: "POST", body: JSON.stringify(body) }),
        list: () => req("/live-classes"),
        updateStatus: (id, status) => req(`/live-classes/${id}/status?new_status=${status}`, { method: "PATCH" }),
    },
    adaptive: {
        start: (subject, topic) => req("/adaptive/start", { method: "POST", body: JSON.stringify({ subject, topic: topic ?? "" }) }),
        answer: (body) => req("/adaptive/answer", { method: "POST", body: JSON.stringify(body) }),
        next: (sessionId) => req(`/adaptive/next-question/${sessionId}`),
        end: (sessionId) => req(`/adaptive/end/${sessionId}`, { method: "POST" }),
        revision: () => req("/adaptive/revision"),
        markReviewed: (id) => req(`/adaptive/revision/${id}/reviewed`, { method: "POST" }),
        leaderboard: (limit) => req("/adaptive/leaderboard", { query: { limit } }),
        myStats: () => req("/adaptive/my-stats"),
    },
    chat: {
        send: (message, subject) => req("/chat/message", { method: "POST", body: JSON.stringify({ message, subject: subject ?? "" }) }),
        history: (limit) => req("/chat/history", { query: { limit } }),
        clear: () => req("/chat/history", { method: "DELETE" }),
    },
    rank: {
        predict: () => req("/rank/predict"),
        studyPlan: (targetDate, dailyHours) => req("/rank/study-plan", { query: { target_date_str: targetDate, daily_hours: dailyHours } }),
    },
    // ── Advanced teacher APIs ───────────────────────────────────────────────────
    contentPlans: {
        list: () => req("/content-plans"),
        create: (body) => req("/content-plans", { method: "POST", body: JSON.stringify(body) }),
        update: (id, body) => req(`/content-plans/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
        delete: (id) => req(`/content-plans/${id}`, { method: "DELETE" }),
    },
    questionBank: {
        list: (params) => req("/question-bank", { query: params }),
        add: (body) => req("/question-bank", { method: "POST", body: JSON.stringify(body) }),
        bulkAdd: (questions) => req("/question-bank/bulk", { method: "POST", body: JSON.stringify(questions) }),
        delete: (id) => req(`/question-bank/${id}`, { method: "DELETE" }),
    },
    mockTestsV2: {
        list: () => req("/mock-tests-v2"),
        create: (body) => req("/mock-tests-v2", { method: "POST", body: JSON.stringify(body) }),
        togglePublish: (id) => req(`/mock-tests-v2/${id}/publish`, { method: "PATCH" }),
        delete: (id) => req(`/mock-tests-v2/${id}`, { method: "DELETE" }),
    },
    announcements: {
        list: (subject) => req("/announcements", { query: { subject } }),
        create: (body) => req("/announcements", { method: "POST", body: JSON.stringify(body) }),
        delete: (id) => req(`/announcements/${id}`, { method: "DELETE" }),
    },
    resources: {
        list: (params) => req("/resources", { query: params }),
        add: (body) => req("/resources", { method: "POST", body: JSON.stringify(body) }),
        delete: (id) => req(`/resources/${id}`, { method: "DELETE" }),
    },
    teacherSettings: {
        get: () => req("/teacher-settings"),
        update: (body) => req("/teacher-settings", { method: "PUT", body: JSON.stringify(body) }),
    },
};
