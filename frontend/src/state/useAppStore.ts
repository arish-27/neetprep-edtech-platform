import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";
export type AssessmentType = "quiz" | "mock_test";

export type VideoProgress = {
  seconds: number;
  durationSeconds?: number;
  updatedAt: number;
};

export type ActiveAttempt = {
  assessmentId: string;
  type: AssessmentType;
  startedAt: number;
  durationSeconds: number;
  secondsLeft: number;
  currentIndex: number;
  questionOrder: string[];
  answers: Record<string, number | null>;
  markedForReview: Record<string, boolean>;
};

export type AttemptResult = {
  attemptId: string;
  assessmentId: string;
  type: AssessmentType;
  startedAt: number;
  finishedAt: number;
  durationSeconds: number;
  timeTakenSeconds: number;
  questionOrder: string[];
  answers: Record<string, number | null>;
  markedForReview: Record<string, boolean>;
  score: number;
  total: number;
};

type AppState = {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  defaultPlaybackRate: number;
  videoBookmarks: Record<string, { addedAt: number }>;
  questionBookmarks: Record<string, { addedAt: number; title: string }>;
  recentVideoIds: string[];
  videoProgress: Record<string, VideoProgress>;
  activeAttempts: Record<string, ActiveAttempt>;
  attemptHistory: Record<string, AttemptResult[]>;

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;

  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;

  setDefaultPlaybackRate: (rate: number) => void;

  toggleVideoBookmark: (videoId: string) => void;
  toggleQuestionBookmark: (questionId: string, title: string) => void;
  clearBookmarks: () => void;
  touchRecentVideo: (videoId: string) => void;

  setVideoProgress: (
    videoId: string,
    progress: Omit<VideoProgress, "updatedAt"> & { updatedAt?: number },
  ) => void;
  clearVideoProgress: (videoId: string) => void;

  startAttempt: (args: {
    assessmentId: string;
    type: AssessmentType;
    durationSeconds: number;
    questionOrder: string[];
  }) => void;
  answer: (assessmentId: string, questionId: string, optionIndex: number) => void;
  toggleMarkForReview: (assessmentId: string, questionId: string) => void;
  setCurrentIndex: (assessmentId: string, index: number) => void;
  decrementSecond: (assessmentId: string) => void;
  setSecondsLeft: (assessmentId: string, secondsLeft: number) => void;
  submitAttempt: (assessmentId: string, result: Omit<AttemptResult, "attemptId">) => void;
  clearAttempt: (assessmentId: string) => void;
  clearHistory: (assessmentId: string) => void;
};

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      sidebarCollapsed: false,
      defaultPlaybackRate: 1.25,
      videoBookmarks: {},
      questionBookmarks: {},
      recentVideoIds: [],
      videoProgress: {},
      activeAttempts: {},
      attemptHistory: {},

      setTheme(theme) {
        set({ theme });
        applyTheme(theme);
      },
      toggleTheme() {
        const next = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
        applyTheme(next);
      },

      setSidebarCollapsed(collapsed) {
        set({ sidebarCollapsed: Boolean(collapsed) });
      },
      toggleSidebarCollapsed() {
        set({ sidebarCollapsed: !get().sidebarCollapsed });
      },

      setDefaultPlaybackRate(rate) {
        const next = Number.isFinite(rate) ? Math.max(0.25, Math.min(2, rate)) : 1;
        set({ defaultPlaybackRate: next });
      },

      toggleVideoBookmark(videoId) {
        if (!videoId) return;
        const prev = get().videoBookmarks;
        if (prev[videoId]) {
          const { [videoId]: _, ...rest } = prev;
          set({ videoBookmarks: rest });
        } else {
          set({ videoBookmarks: { ...prev, [videoId]: { addedAt: Date.now() } } });
        }
      },
      toggleQuestionBookmark(questionId, title) {
        if (!questionId) return;
        const prev = get().questionBookmarks;
        if (prev[questionId]) {
          const { [questionId]: _, ...rest } = prev;
          set({ questionBookmarks: rest });
        } else {
          set({
            questionBookmarks: {
              ...prev,
              [questionId]: { addedAt: Date.now(), title: title || "Saved question" },
            },
          });
        }
      },
      clearBookmarks() {
        set({ videoBookmarks: {}, questionBookmarks: {} });
      },
      touchRecentVideo(videoId) {
        if (!videoId) return;
        const prev = get().recentVideoIds;
        const next = [videoId, ...prev.filter((id) => id !== videoId)].slice(0, 12);
        set({ recentVideoIds: next });
      },

      setVideoProgress(videoId, progress) {
        if (!videoId) return;
        const prev = get().videoProgress;
        set({
          videoProgress: {
            ...prev,
            [videoId]: {
              seconds: Math.max(0, progress.seconds),
              durationSeconds:
                progress.durationSeconds != null
                  ? Math.max(0, progress.durationSeconds)
                  : prev[videoId]?.durationSeconds,
              updatedAt: progress.updatedAt ?? Date.now(),
            },
          },
        });
      },
      clearVideoProgress(videoId) {
        const prev = get().videoProgress;
        if (!prev[videoId]) return;
        const { [videoId]: _, ...rest } = prev;
        set({ videoProgress: rest });
      },

      startAttempt({ assessmentId, type, durationSeconds, questionOrder }) {
        const id = assessmentId;
        if (!id) return;
        const existing = get().activeAttempts[id];
        const answers: Record<string, number | null> = existing?.answers ?? {};
        const markedForReview: Record<string, boolean> = existing?.markedForReview ?? {};
        set({
          activeAttempts: {
            ...get().activeAttempts,
            [id]: {
              assessmentId: id,
              type,
              startedAt: Date.now(),
              durationSeconds,
              secondsLeft: durationSeconds,
              currentIndex: 0,
              questionOrder,
              answers,
              markedForReview,
            },
          },
        });
      },
      answer(assessmentId, questionId, optionIndex) {
        const active = get().activeAttempts[assessmentId];
        if (!active) return;
        set({
          activeAttempts: {
            ...get().activeAttempts,
            [assessmentId]: {
              ...active,
              answers: { ...active.answers, [questionId]: optionIndex },
            },
          },
        });
      },
      toggleMarkForReview(assessmentId, questionId) {
        const active = get().activeAttempts[assessmentId];
        if (!active) return;
        const prev = active.markedForReview[questionId] ?? false;
        set({
          activeAttempts: {
            ...get().activeAttempts,
            [assessmentId]: {
              ...active,
              markedForReview: { ...active.markedForReview, [questionId]: !prev },
            },
          },
        });
      },
      setCurrentIndex(assessmentId, index) {
        const active = get().activeAttempts[assessmentId];
        if (!active) return;
        set({
          activeAttempts: {
            ...get().activeAttempts,
            [assessmentId]: { ...active, currentIndex: Math.max(0, index) },
          },
        });
      },
      decrementSecond(assessmentId) {
        const active = get().activeAttempts[assessmentId];
        if (!active) return;
        if (active.secondsLeft <= 0) return;
        set({
          activeAttempts: {
            ...get().activeAttempts,
            [assessmentId]: { ...active, secondsLeft: active.secondsLeft - 1 },
          },
        });
      },
      setSecondsLeft(assessmentId, secondsLeft) {
        const active = get().activeAttempts[assessmentId];
        if (!active) return;
        set({
          activeAttempts: {
            ...get().activeAttempts,
            [assessmentId]: { ...active, secondsLeft: Math.max(0, secondsLeft) },
          },
        });
      },
      submitAttempt(assessmentId, result) {
        const attempt: AttemptResult = {
          ...result,
          attemptId: `${assessmentId}_${Date.now()}`,
        };
        const prevHistory = get().attemptHistory[assessmentId] ?? [];
        const { [assessmentId]: _, ...restActive } = get().activeAttempts;
        set({
          activeAttempts: restActive,
          attemptHistory: {
            ...get().attemptHistory,
            [assessmentId]: [attempt, ...prevHistory].slice(0, 20),
          },
        });
      },
      clearAttempt(assessmentId) {
        const prev = get().activeAttempts;
        if (!prev[assessmentId]) return;
        const { [assessmentId]: _, ...rest } = prev;
        set({ activeAttempts: rest });
      },
      clearHistory(assessmentId) {
        set({
          attemptHistory: { ...get().attemptHistory, [assessmentId]: [] },
        });
      },
    }),
    {
      name: "neet_app_v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        defaultPlaybackRate: state.defaultPlaybackRate,
        videoBookmarks: state.videoBookmarks,
        questionBookmarks: state.questionBookmarks,
        recentVideoIds: state.recentVideoIds,
        videoProgress: state.videoProgress,
        activeAttempts: state.activeAttempts,
        attemptHistory: state.attemptHistory,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        applyTheme(state.theme);

        // Seed mock bookmarks if the user has none yet.
        // Must use the store's set() — direct mutation of `state` is not tracked.
        const hasVideoBookmarks = Object.keys(state.videoBookmarks ?? {}).length > 0;
        const hasQuestionBookmarks = Object.keys(state.questionBookmarks ?? {}).length > 0;

        if (!hasVideoBookmarks && !hasQuestionBookmarks) {
          const now = Date.now();
          // Mutate the rehydrated state object directly — Zustand merges this
          // into the store as part of the rehydration process
          state.videoBookmarks = {
            v_mech_1:     { addedAt: now - 1  * 60 * 60_000 },
            v_electro_1:  { addedAt: now - 3  * 60 * 60_000 },
            v_physical_1: { addedAt: now - 6  * 60 * 60_000 },
            v_human_1:    { addedAt: now - 24 * 60 * 60_000 },
            v_genetics_1: { addedAt: now - 48 * 60 * 60_000 },
          };
          state.questionBookmarks = {
            q_mech_1:     { addedAt: now - 2 * 60 * 60_000, title: "A body is moving with uniform velocity. What is the net force?" },
            q_physical_1: { addedAt: now - 5 * 60 * 60_000, title: "What is the SI unit of thermodynamic temperature?" },
          };
        }
      },
    },
  ),
);
