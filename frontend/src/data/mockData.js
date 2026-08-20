import chaptersJson from "./chapters.json";
import quizzesJson from "./quizzes.json";
import subjectsJson from "./subjects.json";
import videosJson from "./videos.json";
export const subjects = subjectsJson;
export const chapters = chaptersJson;
export const videos = videosJson;
export const quizzes = quizzesJson;
const allQuestions = quizzes.flatMap((q) => q.questions);
export const mockTests = [
    {
        id: "mt_1",
        title: "NEET Mock Test — Full Syllabus 01",
        durationMin: 60,
        questions: allQuestions.slice(0, 30),
    },
    {
        id: "mt_2",
        title: "NEET Mock Test — Full Syllabus 02",
        durationMin: 60,
        questions: allQuestions.slice(18, 48),
    },
];
export const starterNotifications = [
    {
        id: "n1",
        title: "Live class starts in 30 minutes",
        body: "Join today's session: Electrostatics PYQ marathon.",
        createdAt: "Today",
        read: false,
    },
    {
        id: "n2",
        title: "New mock test added",
        body: "Full syllabus mock test is now available.",
        createdAt: "Yesterday",
        read: true,
    },
    {
        id: "n3",
        title: "Streak reminder",
        body: "Do a 10-min quiz to keep your daily streak.",
        createdAt: "2 days ago",
        read: false,
    },
];
export const starterNotes = [
    {
        id: "note1",
        title: "Electrostatics quick formula",
        body: "E = kq/r^2, V = kq/r. Remember units and direction.",
        updatedAt: "Today",
    },
    {
        id: "note2",
        title: "GOC tips",
        body: "Stability: Resonance > Hyperconjugation > Inductive (approx).",
        updatedAt: "3 days ago",
    },
];
export const starterBookmarks = [
    {
        id: "b1",
        type: "video",
        title: "Kinematics: Basics to Exam Patterns",
        refId: "v_mech_1",
        createdAt: "Today",
    },
    {
        id: "b2",
        type: "question",
        title: "Reduce silly mistakes with a checklist",
        refId: "q_mech_4",
        createdAt: "Yesterday",
    },
];
export function getSubject(subjectId) {
    return subjects.find((s) => s.id === subjectId) ?? null;
}
export function getChaptersForSubject(subjectId) {
    return chapters.filter((c) => c.subjectId === subjectId);
}
export function getChapter(chapterId) {
    return chapters.find((c) => c.id === chapterId) ?? null;
}
export function getVideosForChapter(chapterId) {
    return videos.filter((v) => v.chapterId === chapterId);
}
export function getVideosForSubject(subjectId) {
    return videos.filter((v) => v.subjectId === subjectId);
}
export function getVideo(videoId) {
    return videos.find((v) => v.id === videoId) ?? null;
}
export function getQuiz(quizId) {
    return quizzes.find((q) => q.id === quizId) ?? null;
}
export function getMockTest(testId) {
    return mockTests.find((t) => t.id === testId) ?? null;
}
export function searchCatalog(query) {
    const q = query.trim().toLowerCase();
    if (!q)
        return { subjects: [], chapters: [], videos: [] };
    return {
        subjects: subjects.filter((s) => s.name.toLowerCase().includes(q)),
        chapters: chapters.filter((c) => c.title.toLowerCase().includes(q) ||
            c.topics.some((t) => t.toLowerCase().includes(q))),
        videos: videos.filter((v) => v.title.toLowerCase().includes(q) ||
            v.teacher.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q)),
    };
}
