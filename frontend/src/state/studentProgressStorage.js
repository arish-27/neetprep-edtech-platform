const KEY = "neet_students_v1";
export function loadStudentsProgress() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw)
            return {};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object")
            return {};
        return parsed;
    }
    catch {
        return {};
    }
}
export function saveStudentsProgress(next) {
    try {
        localStorage.setItem(KEY, JSON.stringify(next));
    }
    catch {
        // ignore
    }
}
export function computeStudentProgressSnapshot(user, source) {
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
            if (a.type === "quiz")
                quizAttempts += 1;
            else
                mockTestAttempts += 1;
            totalScore += a.score;
            totalPossible += a.total;
            lastActiveAt = Math.max(lastActiveAt, a.finishedAt || a.startedAt);
        }
    }
    for (const p of Object.values(source.videoProgress)) {
        lastActiveAt = Math.max(lastActiveAt, p.updatedAt || 0);
    }
    const avgScorePct = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : null;
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
export function upsertStudentProgressSnapshot(user, source) {
    const email = user.email?.trim().toLowerCase();
    if (!email)
        return;
    const existing = loadStudentsProgress();
    const snapshot = computeStudentProgressSnapshot(user, source);
    saveStudentsProgress({ ...existing, [email]: snapshot });
}
