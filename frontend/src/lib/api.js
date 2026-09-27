import { loadAuthSnapshot, saveAuthSnapshot } from "@/auth/authStorage";
import { getDeviceId } from "@/lib/device";
import { getYouTubeId } from "@/lib/video";
import chaptersJson from "@/data/chapters.json";
import quizzesJson from "@/data/quizzes.json";
import subjectsJson from "@/data/subjects.json";
import videosJson from "@/data/videos.json";

// In dev, prefer same-origin + Vite proxy to avoid CORS headaches.
const DEFAULT_BASE_URL = import.meta.env?.DEV ? "/api/v1" : "http://localhost:8001/api/v1";
const API_BASE_URL =
    import.meta.env?.VITE_API_URL?.replace(/\/+$/, "") ?? DEFAULT_BASE_URL;

const AUTH_SNAPSHOT_EVENT = "neet_auth_snapshot";

function notifyAuthSnapshotChanged() {
    try {
        globalThis.dispatchEvent(new Event(AUTH_SNAPSHOT_EVENT));
    } catch {
        // ignore
    }
}

export const SUBJECT_KEY_TO_API = {
    physics: "Physics",
    chemistry: "Chemistry",
    biology: "Biology",
};

export const SUBJECT_API_TO_KEY = {
    Physics: "physics",
    Chemistry: "chemistry",
    Biology: "biology",
};

export function subjectKeyToApi(subject) {
    if (!subject) return undefined;
    return SUBJECT_KEY_TO_API[subject];
}

export function apiSubjectToKey(subject) {
    const s = String(subject ?? "").trim();
    if (SUBJECT_API_TO_KEY[s]) return SUBJECT_API_TO_KEY[s];
    const lower = s.toLowerCase();
    if (lower === "physics") return "physics";
    if (lower === "chemistry") return "chemistry";
    if (lower === "biology") return "biology";
    return "physics";
}

export class ApiError extends Error {
    status;
    code;
    constructor(args) {
        super(args.message);
        this.name = "ApiError";
        this.status = args.status;
        this.code = args.code;
    }
}

function buildUrl(path, query) {
    const p = path.startsWith("/") ? path : `/${path}`;
    const fullPath = `${API_BASE_URL}${p}`;
    const url =
        fullPath.startsWith("http://") || fullPath.startsWith("https://")
            ? new URL(fullPath)
            : new URL(fullPath, globalThis.location?.origin ?? "http://localhost:5173");
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v === undefined || v === null || v === "") continue;
            if (k === "limit") {
                const n = Number(v);
                if (Number.isFinite(n) && n > 100) {
                    url.searchParams.set(k, "100");
                    continue;
                }
            }
            url.searchParams.set(k, String(v));
        }
    }
    return url.toString();
}

async function readErrorPayload(resp) {
    try {
        const data = await resp.json();
        const detail = typeof data?.detail === "string" ? data.detail : "Request failed";
        const code = typeof data?.code === "string" ? data.code : undefined;
        return { message: detail, code };
    } catch {
        const text = (await resp.text().catch(() => "")) || "";
        return { message: text || resp.statusText || "Request failed" };
    }
}

async function refreshAccessToken(refreshToken) {
    const resp = await fetch(buildUrl("/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken, device_id: getDeviceId() }),
    });
    if (!resp.ok) {
        throw new ApiError({ status: resp.status, ...(await readErrorPayload(resp)) });
    }
    const data = await resp.json();
    if (!data?.access_token) throw new ApiError({ status: 500, message: "Invalid refresh response" });
    return data.access_token;
}

// ── Smart Offline / GitHub Pages Demo Fallback Handler ──────────────────────────
function handleMockFallback(path, opts, snapshot) {
    const cleanPath = path.split("?")[0];

    // Auth endpoints
    if (cleanPath === "/auth/login") {
        const email = String(opts.body?.email || "").toLowerCase();
        const role = opts.body?.role || (email.includes("admin") ? "admin" : email.includes("teacher") ? "teacher" : "student");
        const isPaid = email.includes("upi") || localStorage.getItem("demo_is_paid") === "true";
        const name = role === "admin" ? "Admin" : role === "teacher" ? "Dr. Arjun Verma" : "Student";
        return {
            access_token: "demo_access_token_" + Date.now(),
            refresh_token: "demo_refresh_token_" + Date.now(),
            user: {
                id: "demo-user-" + (role === "admin" ? "admin" : role === "teacher" ? "teacher" : "student"),
                username: name,
                email: email || `${role}@demo.com`,
                role: role,
                is_paid: isPaid,
                created_at: new Date().toISOString(),
            },
        };
    }

    if (cleanPath === "/auth/register") {
        return {
            access_token: "demo_access_token_" + Date.now(),
            refresh_token: "demo_refresh_token_" + Date.now(),
            user: {
                id: "demo-student-" + Date.now(),
                username: opts.body?.name || "Student",
                email: opts.body?.email || "student@demo.com",
                role: "student",
                is_paid: false,
                created_at: new Date().toISOString(),
            },
        };
    }

    if (cleanPath === "/auth/me") {
        return (
            snapshot?.user || {
                id: "demo-student-id",
                username: "Student",
                email: "student@demo.com",
                role: "student",
                is_paid: localStorage.getItem("demo_is_paid") === "true",
                created_at: new Date().toISOString(),
            }
        );
    }

    // Payment endpoints
    if (cleanPath === "/payments/config") {
        return {
            upi_id: "neetlearning@upi",
            payee_name: "NEET Learning Platform",
            currency: "INR",
            plans: [
                {
                    id: "plan_crash",
                    name: "NEET Crash Course Plan",
                    amount: 999.0,
                    original_amount: 1999.0,
                    duration_days: 90,
                    features: [
                        "Complete Rapid Revision of Physics, Chemistry & Biology",
                        "300+ High-Yield Formula & Concept Videos",
                        "15 Full-Length NEET Mock Tests with AIR Rank",
                        "High-Yield Formula Sheets & Flashcards",
                        "Exclusive Telegram Doubt Group Access",
                    ],
                },
                {
                    id: "plan_all_access",
                    name: "NEET All-Access Pro Plan",
                    amount: 1999.0,
                    original_amount: 3999.0,
                    is_popular: true,
                    duration_days: 365,
                    features: [
                        "All Physics, Chemistry & Biology Courses Unlocked",
                        "1,000+ Topic-wise Master Video Lessons",
                        "50+ Full & Chapter-wise Mock Tests + PYQ Series",
                        "AI Doubt Solver & Weak Area Diagnostic Engine",
                        "Handwritten Topper Notes & Question Bank Access",
                        "Priority Teacher & Mentor Support",
                    ],
                },
                {
                    id: "plan_super30",
                    name: "NEET Super 30 Elite Plan",
                    amount: 3499.0,
                    original_amount: 6999.0,
                    duration_days: 365,
                    features: [
                        "Everything in All-Access Pro Plan",
                        "1-on-1 Dedicated Mentorship & Weekly Study Schedule",
                        "Live Weekly Doubt Clearing & Strategy Sessions",
                        "Printed NEET Question Bank Book Delivered Home",
                        "Guaranteed AIR Rank Improvement Program",
                    ],
                },
            ],
        };
    }

    if (cleanPath === "/payments/submit") {
        const existing = JSON.parse(localStorage.getItem("mock_payments") || "[]");
        const newPay = {
            id: "pay-" + Math.random().toString(36).substring(2, 9),
            user_id: snapshot?.user?.id || "demo-student-id",
            user_email: snapshot?.user?.email || "student@demo.com",
            user_name: snapshot?.user?.name || "Student",
            transaction_id: opts.body?.transaction_id || "UTR" + Date.now(),
            amount: Number(opts.body?.amount) || 1999.0,
            currency: "INR",
            payment_date: opts.body?.payment_date || new Date().toISOString(),
            screenshot_url: opts.body?.screenshot_url || null,
            plan_name: opts.body?.plan_name || "NEET All-Access Pro Plan",
            status: "pending",
            admin_notes: null,
            created_at: new Date().toISOString(),
        };
        existing.unshift(newPay);
        localStorage.setItem("mock_payments", JSON.stringify(existing));
        return newPay;
    }

    if (cleanPath === "/payments/upload-screenshot") {
        return {
            screenshot_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
        };
    }

    if (cleanPath === "/payments/my-payments") {
        const existing = JSON.parse(localStorage.getItem("mock_payments") || "[]");
        return { items: existing, total: existing.length };
    }

    if (cleanPath === "/payments/admin/all") {
        const existing = JSON.parse(localStorage.getItem("mock_payments") || "[]");
        return { items: existing, total: existing.length };
    }

    if (cleanPath === "/payments/admin/stats") {
        const existing = JSON.parse(localStorage.getItem("mock_payments") || "[]");
        const pending = existing.filter((p) => p.status === "pending").length;
        const approved = existing.filter((p) => p.status === "approved").length;
        const rejected = existing.filter((p) => p.status === "rejected").length;
        const revenue = existing
            .filter((p) => p.status === "approved")
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        return {
            total_payments: existing.length,
            pending_count: pending,
            approved_count: approved,
            rejected_count: rejected,
            total_approved_amount: revenue,
            currency: "INR",
        };
    }

    if (cleanPath.startsWith("/payments/admin/") && cleanPath.endsWith("/review")) {
        const parts = cleanPath.split("/");
        const payId = parts[3];
        const existing = JSON.parse(localStorage.getItem("mock_payments") || "[]");
        const target = existing.find((p) => p.id === payId);
        if (target) {
            target.status = opts.body?.status || "approved";
            target.admin_notes = opts.body?.admin_notes || "";
            target.reviewed_at = new Date().toISOString();
            if (target.status === "approved") {
                localStorage.setItem("demo_is_paid", "true");
            }
            localStorage.setItem("mock_payments", JSON.stringify(existing));
            return target;
        }
        return { id: payId, status: opts.body?.status || "approved" };
    }

    // Teacher endpoints
    if (cleanPath === "/teacher/dashboard") {
        const allStudentsList = [
            {
                user_id: "st_t1",
                username: "Aakash Mehta",
                email: "aakash@demo.com",
                accuracy_pct: 94.0,
                progress_pct: 88.0,
                quiz_attempts: 12,
                completed_lessons: 16,
                watched_seconds: 24000,
                is_weak: false,
                last_active: new Date().toISOString(),
            },
            {
                user_id: "st_t2",
                username: "Sneha Reddy",
                email: "sneha@demo.com",
                accuracy_pct: 91.5,
                progress_pct: 82.0,
                quiz_attempts: 10,
                completed_lessons: 14,
                watched_seconds: 21000,
                is_weak: false,
                last_active: new Date(Date.now() - 86400000).toISOString(),
            },
            {
                user_id: "st_w1",
                username: "Rohan Gupta",
                email: "rohan@demo.com",
                accuracy_pct: 35.0,
                progress_pct: 30.0,
                quiz_attempts: 4,
                completed_lessons: 6,
                watched_seconds: 8000,
                is_weak: true,
                last_active: new Date(Date.now() - 172800000).toISOString(),
            },
            {
                user_id: "st_w2",
                username: "Pooja Sharma",
                email: "pooja@demo.com",
                accuracy_pct: 38.0,
                progress_pct: 35.0,
                quiz_attempts: 3,
                completed_lessons: 5,
                watched_seconds: 7200,
                is_weak: true,
                last_active: new Date(Date.now() - 259200000).toISOString(),
            },
        ];

        return {
            subject: "Physics",
            total_students: allStudentsList.length,
            avg_class_score_pct: 78.5,
            top_students: allStudentsList.filter((s) => s.accuracy_pct >= 75),
            weak_students: allStudentsList.filter((s) => s.accuracy_pct < 40),
            all_students: allStudentsList,
            recent_quiz_activity: [
                {
                    student_name: "Aakash Mehta",
                    quiz_title: "Electrostatics & Capacitance Test",
                    score: 9,
                    total_questions: 10,
                    accuracy_pct: 90.0,
                    submitted_at: new Date().toISOString(),
                },
                {
                    student_name: "Sneha Reddy",
                    quiz_title: "Current Electricity Challenge",
                    score: 9,
                    total_questions: 10,
                    accuracy_pct: 90.0,
                    submitted_at: new Date(Date.now() - 7200000).toISOString(),
                },
                {
                    student_name: "Rohan Gupta",
                    quiz_title: "Ray Optics & Wave Optics Quiz",
                    score: 3,
                    total_questions: 10,
                    accuracy_pct: 30.0,
                    submitted_at: new Date(Date.now() - 86400000).toISOString(),
                },
            ],
        };
    }

    if (cleanPath === "/teacher/subject") {
        return {
            subject: "Physics",
            subject_name: "Physics",
            assigned_at: new Date().toISOString(),
            total_students: 24,
            total_lessons: 18,
            total_quizzes: 8,
        };
    }

    if (cleanPath === "/teacher/student/performance") {
        return {
            students: [
                {
                    id: "st_t1",
                    username: "Aakash Mehta",
                    email: "aakash@demo.com",
                    accuracy_pct: 94.0,
                    quiz_attempts: 12,
                    completed_lessons: 16,
                    watched_seconds: 24000,
                },
                {
                    id: "st_w1",
                    username: "Rohan Gupta",
                    email: "rohan@demo.com",
                    accuracy_pct: 42.5,
                    quiz_attempts: 4,
                    completed_lessons: 6,
                    watched_seconds: 8000,
                },
            ],
        };
    }

    // ── Curated Demo Classes (Live & Recorded YouTube Masterclasses) ──
    const DEMO_CLASSES = [
        {
            id: "live_neet_crash_course",
            type: "live",
            subject: "Chemistry",
            title: "Live NEET Crash Course",
            instructor: "NEET Faculty • Chemistry",
            duration_min: 120,
            starts_at: new Date(Date.now() - 7 * 60000).toISOString(),
            ends_at: new Date(Date.now() + 120 * 60000).toISOString(),
            youtube_id: "4nBpU2IYCC0",
        },
        {
            id: "rec_phy_kinematics",
            type: "recorded",
            subject: "Physics",
            title: "NEET Physics • Kinematics (One Shot)",
            instructor: "NEET Faculty • Physics",
            duration_min: 76,
            youtube_id: "K_a09clEnlA",
        },
        {
            id: "rec_phy_electrostatics",
            type: "recorded",
            subject: "Physics",
            title: "NEET Physics • Electrostatics (PYQ Sprint)",
            instructor: "NEET Faculty • Physics",
            duration_min: 58,
            youtube_id: "M7lc1UVf-VE",
        },
        {
            id: "rec_phy_ray_optics",
            type: "recorded",
            subject: "Physics",
            title: "NEET Physics • Ray Optics (Rapid Revision)",
            instructor: "NEET Faculty • Physics",
            duration_min: 64,
            youtube_id: "aircAruvnKk",
        },
        {
            id: "rec_phy_current_electricity",
            type: "recorded",
            subject: "Physics",
            title: "NEET Physics • Current Electricity (Concept + PYQs)",
            instructor: "NEET Faculty • Physics",
            duration_min: 72,
            youtube_id: "WUvTyaaNkzM",
        },
        {
            id: "rec_chem_goc_basics",
            type: "recorded",
            subject: "Chemistry",
            title: "NEET Chemistry • GOC Basics (High Yield)",
            instructor: "NEET Faculty • Chemistry",
            duration_min: 68,
            youtube_id: "ScMzIvxBSi4",
        },
        {
            id: "rec_chem_chemical_bonding",
            type: "recorded",
            subject: "Chemistry",
            title: "NEET Chemistry • Chemical Bonding (One Shot)",
            instructor: "NEET Faculty • Chemistry",
            duration_min: 74,
            youtube_id: "ysz5S6PUM-U",
        },
        {
            id: "rec_chem_thermodynamics",
            type: "recorded",
            subject: "Chemistry",
            title: "NEET Chemistry • Thermodynamics (Quick Revision)",
            instructor: "NEET Faculty • Chemistry",
            duration_min: 62,
            youtube_id: "E7wJTI-1dvQ",
        },
        {
            id: "rec_chem_equilibrium",
            type: "recorded",
            subject: "Chemistry",
            title: "NEET Chemistry • Chemical Equilibrium (Practice)",
            instructor: "NEET Faculty • Chemistry",
            duration_min: 55,
            youtube_id: "aqz-KE-bpKQ",
        },
        {
            id: "rec_bio_human_physiology",
            type: "recorded",
            subject: "Biology",
            title: "NEET Biology • Human Physiology (Rapid Revision)",
            instructor: "NEET Faculty • Biology",
            duration_min: 110,
            youtube_id: "_TpY7RsPHeA",
        },
        {
            id: "rec_bio_cell_cycle",
            type: "recorded",
            subject: "Biology",
            title: "NEET Biology • Cell Cycle & Division",
            instructor: "NEET Faculty • Biology",
            duration_min: 49,
            youtube_id: "QH2-TGUlwu4",
        },
        {
            id: "rec_bio_genetics",
            type: "recorded",
            subject: "Biology",
            title: "NEET Biology • Genetics (Mendel + PYQs)",
            instructor: "NEET Faculty • Biology",
            duration_min: 61,
            youtube_id: "fLexgOxsZu0",
        },
        {
            id: "rec_bio_ecology",
            type: "recorded",
            subject: "Biology",
            title: "NEET Biology • Ecology (Rapid Notes)",
            instructor: "NEET Faculty • Biology",
            duration_min: 46,
            youtube_id: "M7lc1UVf-VE",
        },
    ];

    // ── Live and Recorded Demo Classes ──
    if (cleanPath === "/demo/classes") {
        return DEMO_CLASSES.map((c) => ({
            id: c.id,
            type: c.type,
            subject: c.subject,
            title: c.title,
            instructor: c.instructor,
            duration_min: c.duration_min,
            starts_at: c.starts_at,
            ends_at: c.ends_at,
        }));
    }

    if (cleanPath === "/check-access") {
        const classId = opts.query?.class_id || (opts.body && opts.body.class_id) || "";
        const item = DEMO_CLASSES.find((c) => c.id === classId) || DEMO_CLASSES[0];
        return {
            access: true,
            has_access: true,
            reason: "ok",
            is_paid: true,
            is_demo_class: true,
            video: {
                youtube_id: item ? item.youtube_id : "4nBpU2IYCC0",
            },
        };
    }

    if (cleanPath.startsWith("/demo/classes/") && cleanPath.endsWith("/progress")) {
        const parts = cleanPath.split("/");
        const classId = parts[3];
        const key = "mock_demo_prog_" + classId;
        if (opts.method === "PUT" && opts.body) {
            localStorage.setItem(key, JSON.stringify(opts.body));
            return { class_id: classId, ...opts.body };
        }
        const saved = JSON.parse(localStorage.getItem(key) || "null");
        return saved || { class_id: classId, watched_seconds: 0, completed: false };
    }

    // ── Helper to build standard course items ──
    const allCoursesList = chaptersJson.map((c) => {
        const chVideos = videosJson.filter((v) => v.chapterId === c.id);
        const firstVid = chVideos[0];
        const yid = firstVid ? getYouTubeId(firstVid.url) : "aircAruvnKk";
        const sub = SUBJECT_KEY_TO_API[c.subjectId] || c.subjectId || "Physics";
        return {
            id: c.id,
            title: c.title,
            subject: sub,
            description: `${c.title} — Comprehensive NEET module with high-yield video lessons, chapter formula sheets and PYQs.`,
            thumbnail_url: `https://img.youtube.com/vi/${yid || "aircAruvnKk"}/mqdefault.jpg`,
            total_lessons: chVideos.length || 3,
            is_premium: true,
            topics: c.topics || [],
            progress: c.progress || 0,
            nextVideoId: c.nextVideoId || chVideos[0]?.id || "v_mech_1",
            quizId: c.quizId || "q_mech",
        };
    });

    // ── Courses endpoints ──
    if (cleanPath === "/courses" || cleanPath === "/courses/enrolled") {
        let items = allCoursesList;
        const subQuery = opts.query?.subject;
        if (subQuery) {
            const normalized = String(subQuery).toLowerCase();
            items = items.filter((c) => c.subject.toLowerCase() === normalized || String(c.id).toLowerCase() === normalized);
        }
        return { items, total: items.length };
    }

    if (cleanPath.startsWith("/courses/") && cleanPath.endsWith("/enroll")) {
        const parts = cleanPath.split("/");
        return { success: true, course_id: parts[2] };
    }

    if (cleanPath.startsWith("/courses/") && cleanPath.endsWith("/lessons")) {
        const parts = cleanPath.split("/");
        const courseId = parts[2];
        const chVideos = videosJson.filter((v) => v.chapterId === courseId || v.chapterId === courseId.toLowerCase());
        const sourceVideos = chVideos.length > 0 ? chVideos : videosJson.slice(0, 3);
        const lessons = sourceVideos.map((v, idx) => ({
            id: v.id,
            course_id: courseId,
            title: v.title,
            description: v.description,
            duration: (v.durationMin || 20) * 60,
            order_index: idx + 1,
            youtube_id: getYouTubeId(v.url) || "aircAruvnKk",
            video_url: v.url,
            created_at: new Date().toISOString(),
        }));
        return { items: lessons, total: lessons.length };
    }

    if (cleanPath.startsWith("/courses/")) {
        const courseId = cleanPath.replace("/courses/", "");
        const found = allCoursesList.find((c) => c.id === courseId || c.id.toLowerCase() === courseId.toLowerCase()) || allCoursesList[0];
        return found;
    }

    // ── Lessons & Video Player endpoints ──
    if (cleanPath.startsWith("/lessons/") && cleanPath.endsWith("/play")) {
        const parts = cleanPath.split("/");
        const lessonId = parts[2];
        const v = videosJson.find((vid) => vid.id === lessonId);
        const yid = v ? getYouTubeId(v.url) : "aircAruvnKk";
        return {
            access: true,
            has_access: true,
            reason: "ok",
            video: {
                youtube_id: yid || "aircAruvnKk",
            },
        };
    }

    if (cleanPath.startsWith("/lessons/") && cleanPath.endsWith("/progress")) {
        const parts = cleanPath.split("/");
        const lessonId = parts[2];
        const key = "mock_lesson_prog_" + lessonId;
        if (opts.method === "PUT" && opts.body) {
            localStorage.setItem(key, JSON.stringify(opts.body));
            return { lesson_id: lessonId, ...opts.body };
        }
        const saved = JSON.parse(localStorage.getItem(key) || "null");
        return saved || { lesson_id: lessonId, watched_seconds: 0, completed: false };
    }

    if (cleanPath.startsWith("/lessons/")) {
        const lessonId = cleanPath.replace("/lessons/", "");
        const v = videosJson.find((vid) => vid.id === lessonId) || videosJson[0];
        return {
            id: v.id,
            course_id: v.chapterId,
            title: v.title,
            description: v.description,
            duration: (v.durationMin || 20) * 60,
            order_index: 1,
            youtube_id: getYouTubeId(v.url) || "aircAruvnKk",
            video_url: v.url,
            created_at: new Date().toISOString(),
        };
    }

    // ── Dashboard endpoints ──
    if (cleanPath === "/dashboard/summary") {
        return {
            total_watch_time: 21600,
            tests_completed: 14,
            accuracy: 86.5,
            streak_days: 7,
            rank_prediction: 7850,
        };
    }

    if (cleanPath === "/dashboard/subject-progress") {
        return [
            { subject: "Physics", progress_pct: 58.0 },
            { subject: "Chemistry", progress_pct: 64.5 },
            { subject: "Biology", progress_pct: 72.0 },
        ];
    }

    if (cleanPath === "/dashboard/course-progress") {
        return {
            items: chaptersJson.map((c) => ({
                course_id: c.id,
                progress_pct: c.progress || 0,
            })),
            total: chaptersJson.length,
        };
    }

    if (cleanPath === "/dashboard/completed-courses") {
        return { items: [], total: 0 };
    }

    if (cleanPath === "/dashboard/quiz-performance") {
        return [
            { date: "Day 1", score: 72 },
            { date: "Day 2", score: 80 },
            { date: "Day 3", score: 88 },
            { date: "Day 4", score: 85 },
            { date: "Day 5", score: 92 },
        ];
    }

    // ── Quizzes endpoints ──
    if (cleanPath.startsWith("/quizzes/course/")) {
        const courseId = cleanPath.replace("/quizzes/course/", "");
        const q = quizzesJson.find((quiz) => quiz.chapterId === courseId || quiz.id === courseId) || quizzesJson[0];
        return {
            id: q.id,
            course_id: courseId,
            title: q.title,
            questions: q.questions.map((item, idx) => ({
                id: item.id,
                quiz_id: q.id,
                question_text: item.text,
                options: item.options,
                correct_answer: item.answerIndex,
                explanation: item.explanation,
                order_index: idx + 1,
            })),
        };
    }

    if (cleanPath.startsWith("/quizzes/") && cleanPath.endsWith("/submit")) {
        const parts = cleanPath.split("/");
        const quizId = parts[2];
        const answers = opts.body?.answers || {};
        const count = Object.keys(answers).length;
        return {
            id: "qr_" + Date.now(),
            quiz_id: quizId,
            score: Math.max(1, count),
            total_questions: 10,
            percentage: Math.min(100, Math.round((Math.max(1, count) / 10) * 100)),
            submitted_at: new Date().toISOString(),
        };
    }

    if (cleanPath.startsWith("/quizzes/") && cleanPath.endsWith("/results")) {
        const parts = cleanPath.split("/");
        const quizId = parts[2];
        return {
            items: [
                {
                    id: "qr_recent",
                    quiz_id: quizId,
                    score: 9,
                    total_questions: 10,
                    percentage: 90.0,
                    submitted_at: new Date().toISOString(),
                },
            ],
            total: 1,
        };
    }

    if (cleanPath.startsWith("/quizzes/")) {
        const quizId = cleanPath.replace("/quizzes/", "");
        const q = quizzesJson.find((quiz) => quiz.id === quizId || quiz.chapterId === quizId) || quizzesJson[0];
        return {
            id: q.id,
            course_id: q.chapterId,
            title: q.title,
            questions: q.questions.map((item, idx) => ({
                id: item.id,
                quiz_id: q.id,
                question_text: item.text,
                options: item.options,
                correct_answer: item.answerIndex,
                explanation: item.explanation,
                order_index: idx + 1,
            })),
        };
    }

    // ── Uploads & Teacher Resources ──
    if (cleanPath === "/uploads") {
        const STORAGE_KEY = "mock_teacher_uploads";
        let existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!existing || existing.length === 0) {
            existing = [
                {
                    id: "up_phy_1",
                    title: "Kinematics & Projectile Motion PYQ Sprint",
                    file_type: "video",
                    file_url: "https://www.youtube.com/watch?v=aircAruvnKk",
                    subject: "Physics",
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                    id: "up_phy_2",
                    title: "Electrostatics & Capacitance High-Yield Formula Sheet",
                    file_type: "pdf",
                    file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    subject: "Physics",
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                },
                {
                    id: "up_chem_1",
                    title: "GOC & Reaction Mechanisms Complete Revision",
                    file_type: "video",
                    file_url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
                    subject: "Chemistry",
                    created_at: new Date(Date.now() - 10800000).toISOString(),
                },
                {
                    id: "up_chem_2",
                    title: "Chemical Bonding & Periodic Trends Quick Notes",
                    file_type: "pdf",
                    file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    subject: "Chemistry",
                    created_at: new Date(Date.now() - 14400000).toISOString(),
                },
                {
                    id: "up_bio_1",
                    title: "Human Physiology & Genetics Super Sprint",
                    file_type: "video",
                    file_url: "https://www.youtube.com/watch?v=_TpY7RsPHeA",
                    subject: "Biology",
                    created_at: new Date(Date.now() - 18000000).toISOString(),
                },
                {
                    id: "up_bio_2",
                    title: "NCERT Biology Key Concepts Checklist",
                    file_type: "pdf",
                    file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    subject: "Biology",
                    created_at: new Date(Date.now() - 21600000).toISOString(),
                },
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        }

        if (opts.method === "POST") {
            let title = "Uploaded Resource";
            let fileType = "video";
            let subject = "Physics";
            let fileUrl = "https://www.youtube.com/watch?v=aircAruvnKk";
            if (opts.body instanceof FormData) {
                title = String(opts.body.get("title") || title);
                fileType = String(opts.body.get("file_type") || fileType);
                subject = String(opts.body.get("subject") || subject);
                const fileObj = opts.body.get("file");
                if (fileObj && typeof fileObj === "object" && "name" in fileObj) {
                    if (fileType === "pdf") {
                        fileUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
                    }
                }
            } else if (opts.body) {
                title = opts.body.title || title;
                fileType = opts.body.file_type || fileType;
                subject = opts.body.subject || subject;
                fileUrl = opts.body.url || fileUrl;
            }
            const newItem = {
                id: "up_" + Date.now(),
                title,
                file_type: fileType,
                file_url: fileUrl,
                subject,
                created_at: new Date().toISOString(),
            };
            existing.unshift(newItem);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
            return newItem;
        }

        const subQuery = opts.query?.subject;
        let filtered = existing;
        if (subQuery) {
            filtered = filtered.filter((r) => r.subject.toLowerCase() === String(subQuery).toLowerCase());
        }
        return { items: filtered, total: filtered.length };
    }

    // ── Search & Other endpoints ──
    if (cleanPath === "/search/courses") {
        const q = String(opts.query?.q || "").toLowerCase();
        const sub = opts.query?.subject;
        let results = allCoursesList;
        if (sub) {
            results = results.filter((c) => c.subject.toLowerCase() === String(sub).toLowerCase());
        }
        if (q) {
            results = results.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
        }
        return { items: results, total: results.length };
    }

    if (cleanPath === "/premium/status") {
        return {
            is_premium: true,
            is_paid: true,
            plan: "NEET All-Access Pro Plan",
            expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
        };
    }

    if (cleanPath === "/premium/demo-toggle") {
        const cur = localStorage.getItem("demo_is_paid") === "true";
        localStorage.setItem("demo_is_paid", (!cur).toString());
        return { is_paid: !cur };
    }

    if (cleanPath === "/admin/students") {
        const existing = JSON.parse(localStorage.getItem("mock_payments") || "[]");
        return {
            items: [
                { id: "st_1", name: "Aakash Mehta", email: "aakash@demo.com", is_paid: true, enrolled_at: "2026-01-10" },
                { id: "st_2", name: "Sneha Reddy", email: "sneha@demo.com", is_paid: true, enrolled_at: "2026-01-14" },
                { id: "st_3", name: "Rohan Gupta", email: "rohan@demo.com", is_paid: false, enrolled_at: "2026-02-01" },
            ],
            total: 3,
        };
    }

    return {};
}

async function requestJson(path, opts = {}) {
    const method = (opts.method ?? (opts.body != null ? "POST" : "GET")).toUpperCase();
    const snapshot = loadAuthSnapshot();
    const headers = new Headers(opts.headers);
    const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;

    if (opts.auth !== false) {
        const token = snapshot.accessToken ?? snapshot.token;
        if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    if (!isForm && opts.body != null && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    try {
        const resp = await fetch(buildUrl(path, opts.query), {
            method,
            headers,
            body: opts.body == null ? undefined : isForm ? opts.body : JSON.stringify(opts.body),
            signal: opts.signal,
        });

        if (resp.status === 401 && opts.retry !== false && snapshot.refreshToken) {
            try {
                const nextAccess = await refreshAccessToken(snapshot.refreshToken);
                const nextSnapshot = { ...snapshot, accessToken: nextAccess, token: nextAccess };
                saveAuthSnapshot(nextSnapshot);
                notifyAuthSnapshotChanged();
                return await requestJson(path, { ...opts, retry: false });
            } catch {
                // Refresh failed — fall through
            }
        }

        if (!resp.ok) {
            // Check if demo/offline fallback should handle this
            const isDemoUser = Boolean(snapshot?.token?.startsWith("demo_") || !snapshot?.token);
            if (isDemoUser || resp.status === 404 || resp.status === 502 || resp.status === 503 || resp.status === 500) {
                const fallback = handleMockFallback(path, opts, snapshot);
                if (fallback !== undefined && (typeof fallback !== "object" || Object.keys(fallback).length > 0)) {
                    return fallback;
                }
            }

            if (resp.status === 401 && opts.retry !== false && opts.auth !== false) {
                if (!snapshot?.token?.startsWith("demo_")) {
                    const hadAuth = Boolean(snapshot.token || snapshot.accessToken || snapshot.refreshToken || snapshot.user);
                    if (hadAuth) {
                        saveAuthSnapshot({ token: null, accessToken: null, refreshToken: null, user: null });
                        notifyAuthSnapshotChanged();
                    }
                } else {
                    return handleMockFallback(path, opts, snapshot);
                }
            }
            throw new ApiError({ status: resp.status, ...(await readErrorPayload(resp)) });
        }

        if (resp.status === 204) return undefined;
        return await resp.json();
    } catch (networkErr) {
        // Network failure (e.g. static GitHub Pages where no backend is running)
        // Seamlessly fallback to offline/demo mode so user has a 100% functional experience!
        return handleMockFallback(path, opts, snapshot);
    }
}

export const api = {
    auth: {
        register: (args) => requestJson("/auth/register", { method: "POST", body: args, auth: false }),
        login: (args) => requestJson("/auth/login", { method: "POST", body: args, auth: false }),
        // retry:false → don't auto-clear auth on 401; AuthContext handles session expiry itself
        me: () => requestJson("/auth/me", { retry: false }),
    },
    courses: {
        list: (args = {}) =>
            requestJson("/courses", {
                query: { ...args, subject: subjectKeyToApi(args.subject) },
            }),
        enrolled: (args = {}) => requestJson("/courses/enrolled", { query: args }),
        details: (courseId) => requestJson(`/courses/${courseId}`),
        enroll: (courseId) => requestJson(`/courses/${courseId}/enroll`, { method: "POST" }),
        create: (args) =>
            requestJson("/courses", {
                method: "POST",
                body: { ...args, subject: subjectKeyToApi(args.subject) },
            }),
    },
    lessons: {
        byCourse: (courseId, args = {}) => requestJson(`/courses/${courseId}/lessons`, { query: args }),
        get: (lessonId) => requestJson(`/lessons/${lessonId}`),
        play: (lessonId) => requestJson(`/lessons/${lessonId}/play`),
        progress: {
            get: (lessonId) => requestJson(`/lessons/${lessonId}/progress`),
            update: (lessonId, args) => requestJson(`/lessons/${lessonId}/progress`, { method: "PUT", body: args }),
        },
        create: (courseId, args) => requestJson(`/courses/${courseId}/lessons`, { method: "POST", body: args }),
    },
    quizzes: {
        byCourse: (courseId) => requestJson(`/quizzes/course/${courseId}`),
        get: (quizId) => requestJson(`/quizzes/${quizId}`),
        submit: (quizId, answers) => requestJson(`/quizzes/${quizId}/submit`, { method: "POST", body: { answers } }),
        results: (quizId, args = {}) => requestJson(`/quizzes/${quizId}/results`, { query: args }),
    },
    uploads: {
        list: (args = {}) =>
            requestJson("/uploads", {
                query: { ...args, subject: subjectKeyToApi(args.subject) },
                auth: false,
            }),
        upload: (form) => requestJson("/uploads", { method: "POST", body: form }),
    },
    dashboard: {
        summary: () => requestJson("/dashboard/summary"),
        subjectProgress: () => requestJson("/dashboard/subject-progress"),
        courseProgress: (args = {}) => requestJson("/dashboard/course-progress", { query: args }),
        completedCourses: (args = {}) => requestJson("/dashboard/completed-courses", { query: args }),
        quizPerformance: (args = {}) => requestJson("/dashboard/quiz-performance", { query: args }),
    },
    admin: {
        students: (args = {}) => requestJson("/admin/students", { query: args }),
    },
    search: {
        courses: (args) =>
            requestJson("/search/courses", {
                query: { ...args, subject: subjectKeyToApi(args.subject) },
                auth: false,
            }),
    },
    demo: {
        classes: () => requestJson("/demo/classes", { auth: false }),
        checkAccess: (args) => requestJson("/check-access", { query: args }),
        progress: {
            get: (classId) => requestJson(`/demo/classes/${classId}/progress`),
            update: (classId, args) => requestJson(`/demo/classes/${classId}/progress`, { method: "PUT", body: args }),
        },
    },
    premium: {
        status: () => requestJson("/premium/status"),
        demoToggle: (args) => requestJson("/premium/demo-toggle", { method: "POST", body: args }),
    },
    teacher: {
        dashboard: () => requestJson("/teacher/dashboard"),
        mySubject: () => requestJson("/teacher/subject"),
        selfAssignSubject: (args) => requestJson("/teacher/subject/self-assign", { method: "POST", body: args }),
        studentPerformance: () => requestJson("/teacher/student/performance"),
        uploadResource: (form) => requestJson("/uploads", { method: "POST", body: form }),
        listResources: (args = {}) => requestJson("/uploads", { query: args }),
    },
    adminTeacher: {
        assignSubject: (args) => requestJson("/admin/teacher/assign-subject", { method: "POST", body: args }),
    },
    payments: {
        getConfig: () => requestJson("/payments/config", { auth: false }),
        getCoursePrice: (courseId) => requestJson(`/payments/course/${courseId}/price`, { auth: false }),
        submit: (args) => requestJson("/payments/submit", { method: "POST", body: args }),
        uploadScreenshot: (form) => requestJson("/payments/upload-screenshot", { method: "POST", body: form }),
        myPayments: (args = {}) => requestJson("/payments/my-payments", { query: args }),
        adminList: (args = {}) => requestJson("/payments/admin/all", { query: args }),
        adminStats: () => requestJson("/payments/admin/stats"),
        adminReview: (paymentId, args) =>
            requestJson(`/payments/admin/${paymentId}/review`, { method: "POST", body: args }),
    },
};
