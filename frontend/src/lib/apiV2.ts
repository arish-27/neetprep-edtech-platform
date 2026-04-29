/**
 * V2 API client — all new endpoints under /api/v1/v2/
 * The backend mounts everything under /api/v1, so v2 routes live at /api/v1/v2/.
 * Completely separate from the existing api.ts — no modifications.
 */
import { loadAuthSnapshot } from "@/auth/authStorage";

const BASE = (import.meta as any).env?.DEV ? "/api/v1/v2" : "http://localhost:8001/api/v1/v2";

async function req<T>(path: string, opts: RequestInit & { query?: Record<string, any> } = {}): Promise<T> {
  const snap = loadAuthSnapshot();
  const token = snap.accessToken ?? snap.token;
  const headers = new Headers(opts.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (opts.body && !(opts.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let url = `${BASE}${path}`;
  if (opts.query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const resp = await fetch(url, { ...opts, headers });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw Object.assign(new Error(err.detail ?? "Request failed"), { status: resp.status });
  }
  if (resp.status === 204) return undefined as any;
  return resp.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MCQOption = { text: string; is_correct: boolean };
export type GeneratedQuestion = {
  id: string; question_text: string; options: MCQOption[];
  explanation: string; difficulty: number; topic: string; subject: string;
};
export type GenerateQuestionsResponse = { questions: GeneratedQuestion[]; source: string };

export type Assignment = {
  id: string; teacher_id: string; title: string; subject: string;
  description: string; questions: GeneratedQuestion[]; due_at: string | null; created_at: string;
};
export type SubmitAssignmentResponse = {
  score: number; total: number; accuracy_pct: number; results: any[];
};

export type Doubt = {
  id: string; student_id: string; student_name: string; subject: string; topic: string;
  question: string; answer: string | null; answered_by_name: string | null;
  upvotes: number; status: string; created_at: string; answered_at: string | null;
};

export type LiveClass = {
  id: string; teacher_id: string; teacher_name: string; title: string; subject: string;
  description: string; meet_link: string; starts_at: string; duration_min: number;
  status: string; created_at: string;
};

export type PracticeQuestion = {
  session_id: string; question_id: string; question_text: string;
  options: string[]; difficulty: number;
};
export type AnswerResponse = {
  is_correct: boolean; explanation: string; next_difficulty: number;
  xp_earned: number; session_correct: number; session_total: number;
};
export type SessionSummary = {
  session_id: string; subject: string; topic: string;
  total: number; correct: number; accuracy_pct: number; xp_earned: number;
};
export type RevisionItem = {
  id: string; question_text: string; subject: string; topic: string;
  explanation: string; review_count: number; next_review_at: string;
};
export type LeaderboardEntry = {
  rank: number; student_id: string; username: string; xp: number;
  streak_days: number; badges: string[];
};
export type MyStats = { xp: number; streak_days: number; badges: string[]; rank: number | null };

export type ChatMessage = { id: string; role: string; content: string; subject: string; created_at: string };
export type ChatResponse = { reply: string; source: string };

export type RankPrediction = {
  estimated_score: number; rank_low: number; rank_high: number;
  percentile: number; message: string; improvement_tips: string[];
};
export type StudyPlan = {
  target_date: string; days_left: number; daily_hours: number; weekly_plan: any[];
};

// ── Advanced teacher types ────────────────────────────────────────────────────

export type TopicItem = { topic: string; status: "pending" | "in_progress" | "done"; notes: string };
export type ContentPlan = {
  id: string; teacher_id: string; subject: string; title: string;
  week_number: number; topics: TopicItem[]; target_date: string | null;
  created_at: string; updated_at: string;
};

export type BankQuestion = {
  id: string; teacher_id: string; subject: string; topic: string;
  question_text: string; options: string[]; correct_index: number;
  explanation: string; difficulty: number; tags: string; source: string; created_at: string;
};

export type MockTestV2 = {
  id: string; teacher_id: string; title: string; subject: string; description: string;
  duration_min: number; total_marks: number; negative_marking: boolean;
  questions: any[]; is_published: boolean; created_at: string;
};

export type Announcement = {
  id: string; teacher_id: string; teacher_name: string; subject: string;
  title: string; body: string; priority: string; pinned: boolean; created_at: string;
};

export type Resource = {
  id: string; teacher_id: string; subject: string; topic: string; title: string;
  resource_type: string; url: string; description: string; tags: string; created_at: string;
};

export type TeacherSettings = {
  teacher_id: string; display_name: string; bio: string;
  notification_doubts: boolean; notification_submissions: boolean;
  notification_announcements: boolean; default_difficulty: number;
  auto_publish_ai_questions: boolean; updated_at: string;
};

// ── API methods ───────────────────────────────────────────────────────────────

export const apiV2 = {
  ai: {
    generateQuestions: (body: { topic: string; subject: string; difficulty?: number; count?: number }) =>
      req<GenerateQuestionsResponse>("/ai/generate-questions", { method: "POST", body: JSON.stringify(body) }),
  },
  assignments: {
    create: (body: any) => req<Assignment>("/assignments", { method: "POST", body: JSON.stringify(body) }),
    list: () => req<Assignment[]>("/assignments"),
    get: (id: string) => req<Assignment>(`/assignments/${id}`),
    submit: (id: string, answers: Record<string, number>) =>
      req<SubmitAssignmentResponse>(`/assignments/${id}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),
  },
  doubts: {
    create: (body: { subject: string; topic?: string; question: string }) =>
      req<Doubt>("/doubts", { method: "POST", body: JSON.stringify(body) }),
    list: (params?: { subject?: string; status?: string }) =>
      req<Doubt[]>("/doubts", { query: params }),
    answer: (id: string, answer: string) =>
      req<Doubt>(`/doubts/${id}/answer`, { method: "POST", body: JSON.stringify({ answer }) }),
    upvote: (id: string) => req<Doubt>(`/doubts/${id}/upvote`, { method: "POST" }),
  },
  liveClasses: {
    schedule: (body: any) => req<LiveClass>("/live-classes", { method: "POST", body: JSON.stringify(body) }),
    list: () => req<LiveClass[]>("/live-classes"),
    updateStatus: (id: string, status: string) =>
      req<LiveClass>(`/live-classes/${id}/status?new_status=${status}`, { method: "PATCH" }),
  },
  adaptive: {
    start: (subject: string, topic?: string) =>
      req<PracticeQuestion>("/adaptive/start", { method: "POST", body: JSON.stringify({ subject, topic: topic ?? "" }) }),
    answer: (body: any) =>
      req<AnswerResponse>("/adaptive/answer", { method: "POST", body: JSON.stringify(body) }),
    next: (sessionId: string) => req<PracticeQuestion>(`/adaptive/next-question/${sessionId}`),
    end: (sessionId: string) => req<SessionSummary>(`/adaptive/end/${sessionId}`, { method: "POST" }),
    revision: () => req<RevisionItem[]>("/adaptive/revision"),
    markReviewed: (id: string) => req<any>(`/adaptive/revision/${id}/reviewed`, { method: "POST" }),
    leaderboard: (limit?: number) => req<LeaderboardEntry[]>("/adaptive/leaderboard", { query: { limit } }),
    myStats: () => req<MyStats>("/adaptive/my-stats"),
  },
  chat: {
    send: (message: string, subject?: string) =>
      req<ChatResponse>("/chat/message", { method: "POST", body: JSON.stringify({ message, subject: subject ?? "" }) }),
    history: (limit?: number) => req<ChatMessage[]>("/chat/history", { query: { limit } }),
    clear: () => req<any>("/chat/history", { method: "DELETE" }),
  },
  rank: {
    predict: () => req<RankPrediction>("/rank/predict"),
    studyPlan: (targetDate?: string, dailyHours?: number) =>
      req<StudyPlan>("/rank/study-plan", { query: { target_date_str: targetDate, daily_hours: dailyHours } }),
  },
  // ── Advanced teacher APIs ───────────────────────────────────────────────────
  contentPlans: {
    list: () => req<ContentPlan[]>("/content-plans"),
    create: (body: { title: string; subject: string; week_number?: number; topics?: TopicItem[]; target_date?: string }) =>
      req<ContentPlan>("/content-plans", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: { title?: string; topics?: TopicItem[]; target_date?: string }) =>
      req<ContentPlan>(`/content-plans/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (id: string) => req<void>(`/content-plans/${id}`, { method: "DELETE" }),
  },
  questionBank: {
    list: (params?: { subject?: string; topic?: string; difficulty?: number }) =>
      req<BankQuestion[]>("/question-bank", { query: params }),
    add: (body: Omit<BankQuestion, "id" | "teacher_id" | "created_at">) =>
      req<BankQuestion>("/question-bank", { method: "POST", body: JSON.stringify(body) }),
    bulkAdd: (questions: Omit<BankQuestion, "id" | "teacher_id" | "created_at">[]) =>
      req<BankQuestion[]>("/question-bank/bulk", { method: "POST", body: JSON.stringify(questions) }),
    delete: (id: string) => req<void>(`/question-bank/${id}`, { method: "DELETE" }),
  },
  mockTestsV2: {
    list: () => req<MockTestV2[]>("/mock-tests-v2"),
    create: (body: Omit<MockTestV2, "id" | "teacher_id" | "is_published" | "created_at">) =>
      req<MockTestV2>("/mock-tests-v2", { method: "POST", body: JSON.stringify(body) }),
    togglePublish: (id: string) => req<MockTestV2>(`/mock-tests-v2/${id}/publish`, { method: "PATCH" }),
    delete: (id: string) => req<void>(`/mock-tests-v2/${id}`, { method: "DELETE" }),
  },
  announcements: {
    list: (subject?: string) => req<Announcement[]>("/announcements", { query: { subject } }),
    create: (body: { subject: string; title: string; body: string; priority?: string; pinned?: boolean }) =>
      req<Announcement>("/announcements", { method: "POST", body: JSON.stringify(body) }),
    delete: (id: string) => req<void>(`/announcements/${id}`, { method: "DELETE" }),
  },
  resources: {
    list: (params?: { subject?: string; resource_type?: string }) =>
      req<Resource[]>("/resources", { query: params }),
    add: (body: Omit<Resource, "id" | "teacher_id" | "created_at">) =>
      req<Resource>("/resources", { method: "POST", body: JSON.stringify(body) }),
    delete: (id: string) => req<void>(`/resources/${id}`, { method: "DELETE" }),
  },
  teacherSettings: {
    get: () => req<TeacherSettings>("/teacher-settings"),
    update: (body: Partial<Omit<TeacherSettings, "teacher_id" | "updated_at">>) =>
      req<TeacherSettings>("/teacher-settings", { method: "PUT", body: JSON.stringify(body) }),
  },
};
