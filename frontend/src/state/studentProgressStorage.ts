import type { AuthUser } from "@/auth/authStorage";
import type { AttemptResult, VideoProgress } from "@/state/useAppStore";

export type StudentProgressSnapshot = {
  email: string;
  name: string;
  updatedAt: number;
  lastActiveAt: number | null;
  lastVideoId: string | null;
  watchedVideos: number;
  watchedSeconds: number;
  videoBookmarks: number;
  questionBookmarks: number;
  quizAttempts: number;
  mockTestAttempts: number;
  avgScorePct: number | null;
};

type AppProgressSource = {
  recentVideoIds: string[];
  videoProgress: Record<string, VideoProgress>;
  videoBookmarks: Record<string, { addedAt: number }>;
  questionBookmarks: Record<string, { addedAt: number; title: string }>;
  attemptHistory: Record<string, AttemptResult[]>;
};

const KEY = "neet_students_v1";

export function loadStudentsProgress(): Record<string, StudentProgressSnapshot> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StudentProgressSnapshot>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function saveStudentsProgress(next: Record<string, StudentProgressSnapshot>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function computeStudentProgressSnapshot(user: AuthUser, source: AppProgressSource): StudentProgressSnapshot {
  const watchedSeconds = Object.values(source.videoProgress).reduce((sum, p) => {
    const duration = p.durationSeconds != null ? Math.max(0, p.durationSeconds) : undefined;
    const seconds = Math.max(0, p.seconds);
    const capped = duration != null ? Math.min(seconds, duration) : seconds;
    return sum + capped;
  }, 0);

  const watchedVideos = Object.values(source.videoProgress).filter((p) => p.seconds > 15).length;
  const videoBookmarks = Object.keys(source.videoBookmarks).length;
  const questionBookmarks = Object.keys(source.questionBookmarks).length;

  let quizAttempts = 0;
  let mockTestAttempts = 0;
  let totalScore = 0;
  let totalPossible = 0;
  let lastActiveAt = 0;

  for (const attempts of Object.values(source.attemptHistory)) {
    for (const a of attempts) {
      if (a.type === "quiz") quizAttempts += 1;
      else mockTestAttempts += 1;
      totalScore += a.score;
      totalPossible += a.total;
      lastActiveAt = Math.max(lastActiveAt, a.finishedAt || a.startedAt);
    }
  }

  for (const p of Object.values(source.videoProgress)) {
    lastActiveAt = Math.max(lastActiveAt, p.updatedAt || 0);
  }

  const avgScorePct =
    totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : null;

  const now = Date.now();
  return {
    email: user.email,
    name: user.name,
    updatedAt: now,
    lastActiveAt: lastActiveAt > 0 ? lastActiveAt : null,
    lastVideoId: source.recentVideoIds[0] ?? null,
    watchedVideos,
    watchedSeconds: Math.round(watchedSeconds),
    videoBookmarks,
    questionBookmarks,
    quizAttempts,
    mockTestAttempts,
    avgScorePct,
  };
}

export function upsertStudentProgressSnapshot(user: AuthUser, source: AppProgressSource) {
  const email = user.email?.trim().toLowerCase();
  if (!email) return;
  const existing = loadStudentsProgress();
  const snapshot = computeStudentProgressSnapshot(user, source);
  saveStudentsProgress({ ...existing, [email]: snapshot });
}

