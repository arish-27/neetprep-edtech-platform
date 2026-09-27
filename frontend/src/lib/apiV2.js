/**
 * V2 API client — all new endpoints under /api/v1/v2/
 * The backend mounts everything under /api/v1, so v2 routes live at /api/v1/v2/.
 * Completely separate from the existing api.ts — no modifications.
 */
import { loadAuthSnapshot } from "@/auth/authStorage";
const BASE = import.meta.env?.DEV ? "/api/v1/v2" : "http://localhost:8001/api/v1/v2";
function handleV2MockFallback(path, opts = {}) {
    const cleanPath = path.split("?")[0];

    // ── Resources & Imported Videos ──
    if (cleanPath.startsWith("/resources")) {
        const STORAGE_KEY = "mock_v2_resources";
        let existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!existing || existing.length === 0) {
            existing = [
                {
                    id: "res_1",
                    title: "NEET Physics • Kinematics & Laws of Motion (Complete Lecture)",
                    subject: "Physics",
                    topic: "Kinematics",
                    resource_type: "video",
                    url: "https://www.youtube.com/watch?v=aircAruvnKk",
                    description: "Full YouTube video masterclass covering displacement, velocity, acceleration and PYQ tricks.",
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                    id: "res_2",
                    title: "Electrostatics & Capacitance — High Yield Revision Formula Sheet",
                    subject: "Physics",
                    topic: "Electrostatics",
                    resource_type: "pdf",
                    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    description: "Handwritten formula booklet with all key derivations and sign conventions.",
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                },
                {
                    id: "res_3",
                    title: "NEET Chemistry • GOC Basics & Mechanisms (One Shot)",
                    subject: "Chemistry",
                    topic: "Organic Chemistry",
                    resource_type: "video",
                    url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
                    description: "Inductive effect, resonance, hyperconjugation and acid-base patterns explained with MCQs.",
                    created_at: new Date(Date.now() - 10800000).toISOString(),
                },
                {
                    id: "res_4",
                    title: "Chemical Bonding & Molecular Structure Quick Capsule",
                    subject: "Chemistry",
                    topic: "Chemical Bonding",
                    resource_type: "video",
                    url: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
                    description: "Hybridization tricks, VSEPR theory shortcuts and dipole moment questions.",
                    created_at: new Date(Date.now() - 14400000).toISOString(),
                },
                {
                    id: "res_5",
                    title: "NEET Biology • Human Physiology & Circulation Marathon",
                    subject: "Biology",
                    topic: "Human Physiology",
                    resource_type: "video",
                    url: "https://www.youtube.com/watch?v=_TpY7RsPHeA",
                    description: "Rapid NCERT line-by-line revision with diagram-based high-probability MCQs.",
                    created_at: new Date(Date.now() - 18000000).toISOString(),
                },
                {
                    id: "res_6",
                    title: "Genetics & Molecular Basis of Inheritance NCERT Short Notes",
                    subject: "Biology",
                    topic: "Genetics",
                    resource_type: "pdf",
                    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    description: "Mendelian ratios, DNA replication enzymes and pedigree analysis cheat sheet.",
                    created_at: new Date(Date.now() - 21600000).toISOString(),
                },
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
        }

        if (opts.method === "POST") {
            let body = opts.body;
            if (typeof body === "string") {
                try { body = JSON.parse(body); } catch {}
            }
            const newItem = {
                id: "res_" + Date.now(),
                title: body?.title || "Imported Video Resource",
                subject: body?.subject || "Physics",
                topic: body?.topic || "",
                resource_type: body?.resource_type || "video",
                url: body?.url || "https://www.youtube.com/watch?v=aircAruvnKk",
                description: body?.description || "",
                created_at: new Date().toISOString(),
            };
            existing.unshift(newItem);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
            return newItem;
        }

        if (opts.method === "DELETE") {
            const id = cleanPath.replace("/resources/", "");
            existing = existing.filter((r) => r.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
            return { success: true };
        }

        let res = existing;
        if (opts.query?.subject) {
            res = res.filter((r) => r.subject.toLowerCase() === String(opts.query.subject).toLowerCase());
        }
        if (opts.query?.resource_type) {
            res = res.filter((r) => r.resource_type.toLowerCase() === String(opts.query.resource_type).toLowerCase());
        }
        return res;
    }

    // ── Doubts ──
    if (cleanPath.startsWith("/doubts")) {
        const STORAGE_KEY = "mock_v2_doubts";
        let doubts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!doubts) {
            doubts = [
                {
                    id: "d_1",
                    student_name: "Sneha Reddy",
                    subject: "Physics",
                    topic: "Ray Optics",
                    title: "Why does total internal reflection occur only from denser to rarer medium?",
                    description: "In Snell's law, when angle of incidence exceeds critical angle, why is there no refracted ray in the second medium?",
                    upvotes: 8,
                    status: "answered",
                    answer: "When light travels from denser to rarer medium, it bends away from normal. At critical angle, angle of refraction is 90°. For any i > c, sin(r) > 1 which is mathematically impossible, so all light reflects back into the denser medium.",
                    created_at: new Date(Date.now() - 7200000).toISOString(),
                },
                {
                    id: "d_2",
                    student_name: "Rohan Gupta",
                    subject: "Chemistry",
                    topic: "Thermodynamics",
                    title: "Gibbs free energy change vs standard Gibbs energy change",
                    description: "What is the difference between Delta G and Delta G° at equilibrium?",
                    upvotes: 5,
                    status: "open",
                    answer: null,
                    created_at: new Date(Date.now() - 14400000).toISOString(),
                },
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(doubts));
        }

        if (opts.method === "POST") {
            let body = opts.body;
            if (typeof body === "string") {
                try { body = JSON.parse(body); } catch {}
            }
            if (cleanPath.endsWith("/answer")) {
                const parts = cleanPath.split("/");
                const id = parts[2];
                const d = doubts.find((it) => it.id === id);
                if (d) {
                    d.answer = body?.answer || "";
                    d.status = "answered";
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(doubts));
                    return d;
                }
            }
            if (cleanPath.endsWith("/upvote")) {
                const parts = cleanPath.split("/");
                const id = parts[2];
                const d = doubts.find((it) => it.id === id);
                if (d) {
                    d.upvotes = (d.upvotes || 0) + 1;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(doubts));
                    return d;
                }
            }
            const newDoubt = {
                id: "d_" + Date.now(),
                student_name: "Student",
                subject: body?.subject || "Physics",
                topic: body?.topic || "General",
                title: body?.title || "Question",
                description: body?.description || "",
                upvotes: 0,
                status: "open",
                answer: null,
                created_at: new Date().toISOString(),
            };
            doubts.unshift(newDoubt);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(doubts));
            return newDoubt;
        }

        return doubts;
    }

    // ── Announcements ──
    if (cleanPath.startsWith("/announcements")) {
        const STORAGE_KEY = "mock_v2_announcements";
        let list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!list) {
            list = [
                {
                    id: "ann_1",
                    subject: "Physics",
                    title: "Electrostatics Live Doubt Marathon Tomorrow at 6:00 PM",
                    message: "Bring your doubts from Coulomb's law to Capacitance. We will solve 30 top PYQs live.",
                    teacher_name: "Dr. Arjun Verma",
                    created_at: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                    id: "ann_2",
                    subject: "Chemistry",
                    title: "Organic GOC Formula Sheet Uploaded",
                    message: "Check the Resources tab for the high-yield reaction mechanism notes.",
                    teacher_name: "Dr. Priya Nair",
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                },
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
        if (opts.method === "POST") {
            let body = opts.body;
            if (typeof body === "string") {
                try { body = JSON.parse(body); } catch {}
            }
            const item = {
                id: "ann_" + Date.now(),
                subject: body?.subject || "All",
                title: body?.title || "Announcement",
                message: body?.message || "",
                teacher_name: "Teacher",
                created_at: new Date().toISOString(),
            };
            list.unshift(item);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            return item;
        }
        if (opts.method === "DELETE") {
            const id = cleanPath.replace("/announcements/", "");
            list = list.filter((a) => a.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            return { success: true };
        }
        return list;
    }

    // ── Live Classes ──
    if (cleanPath.startsWith("/live-classes")) {
        const STORAGE_KEY = "mock_v2_live_classes";
        let classes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!classes) {
            classes = [
                {
                    id: "lc_1",
                    title: "NEET Crash Course • Organic Mechanisms",
                    subject: "Chemistry",
                    scheduled_at: new Date(Date.now() + 3600000).toISOString(),
                    duration_min: 90,
                    status: "scheduled",
                    instructor: "Dr. Priya Nair",
                    stream_url: "https://www.youtube.com/watch?v=4nBpU2IYCC0",
                },
                {
                    id: "lc_2",
                    title: "Physics Mechanics • High Yield Numericals",
                    subject: "Physics",
                    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
                    duration_min: 120,
                    status: "scheduled",
                    instructor: "Dr. Arjun Verma",
                    stream_url: "https://www.youtube.com/watch?v=K_a09clEnlA",
                },
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
        }
        if (opts.method === "POST") {
            let body = opts.body;
            if (typeof body === "string") {
                try { body = JSON.parse(body); } catch {}
            }
            const item = {
                id: "lc_" + Date.now(),
                title: body?.title || "Live Class",
                subject: body?.subject || "Physics",
                scheduled_at: body?.scheduled_at || new Date().toISOString(),
                duration_min: Number(body?.duration_min) || 60,
                status: "scheduled",
                instructor: "Faculty",
                stream_url: body?.stream_url || "https://www.youtube.com/watch?v=4nBpU2IYCC0",
            };
            classes.unshift(item);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
            return item;
        }
        return classes;
    }

    // ── Question Bank & Mock Tests ──
    if (cleanPath.startsWith("/question-bank")) {
        return [
            {
                id: "qb_1",
                subject: "Physics",
                topic: "Kinematics",
                question_text: "A particle starts from rest with uniform acceleration a. The distance traveled in the n-th second is given by:",
                options: ["u + a/2 (2n - 1)", "a/2 (2n - 1)", "a n^2 / 2", "a(2n - 1)"],
                correct_answer: 1,
                explanation: "S_n = u + a/2(2n - 1). Since u = 0, S_n = a/2(2n - 1).",
                difficulty: "medium",
            },
            {
                id: "qb_2",
                subject: "Chemistry",
                topic: "Chemical Bonding",
                question_text: "Which of the following molecules has a zero dipole moment?",
                options: ["NH3", "NF3", "BF3", "H2O"],
                correct_answer: 2,
                explanation: "BF3 has trigonal planar geometry with 120° bond angles; individual B-F dipole vectors cancel out to zero.",
                difficulty: "easy",
            },
            {
                id: "qb_3",
                subject: "Biology",
                topic: "Human Physiology",
                question_text: "The bundle of His is a specialized part of which tissue in human beings?",
                options: ["Muscular tissue in heart", "Nervous tissue in brain", "Connective tissue in liver", "Epithelial tissue in lungs"],
                correct_answer: 0,
                explanation: "Bundle of His is specialized cardiac muscle tissue that conducts electrical impulses in the ventricular septum.",
                difficulty: "easy",
            },
        ];
    }

    if (cleanPath.startsWith("/mock-tests-v2")) {
        return [
            {
                id: "mt_v2_1",
                title: "NEET All-India Grand Mock Test 01",
                duration_min: 180,
                total_marks: 720,
                is_published: true,
                total_questions: 180,
                created_at: new Date().toISOString(),
            },
            {
                id: "mt_v2_2",
                title: "NEET Physics & Chemistry Sectional Speed Booster",
                duration_min: 90,
                total_marks: 360,
                is_published: true,
                total_questions: 90,
                created_at: new Date().toISOString(),
            },
        ];
    }

    // ── Content Plans ──
    if (cleanPath.startsWith("/content-plans")) {
        return [
            {
                id: "cp_1",
                week_number: 1,
                subject: "Physics",
                topic: "Kinematics & Vector Algebra",
                target_lessons: 4,
                target_quizzes: 2,
                status: "in_progress",
            },
            {
                id: "cp_2",
                week_number: 2,
                subject: "Chemistry",
                topic: "GOC & Reaction Intermediates",
                target_lessons: 5,
                target_quizzes: 2,
                status: "planned",
            },
        ];
    }

    // ── AI Tutor, Adaptive & Rank Predictor ──
    if (cleanPath.startsWith("/ai/generate-questions")) {
        return {
            questions: [
                {
                    question_text: "In a photoelectric experiment, if frequency of incident radiation is doubled, the stopping potential will:",
                    options: ["Be doubled", "Become more than double", "Become less than double", "Remain unchanged"],
                    correct_answer: 1,
                    explanation: "eV_0 = hν - φ. When ν is doubled, eV_0' = 2hν - φ = 2(eV_0 + φ) - φ = 2eV_0 + φ > 2eV_0.",
                },
            ],
        };
    }

    if (cleanPath.startsWith("/adaptive/start")) {
        return {
            session_id: "adapt_" + Date.now(),
            total_questions: 10,
            first_question: {
                id: "ad_q1",
                subject: "Physics",
                topic: "Kinematics",
                text: "The acceleration-time graph of a particle is a straight line parallel to time axis. The velocity-time graph must be a:",
                options: ["Straight line inclined to time axis", "Parabola", "Circle", "Hyperbola"],
                difficulty: "medium",
            },
        };
    }

    if (cleanPath.startsWith("/adaptive/next-question")) {
        return {
            question: {
                id: "ad_q2",
                subject: "Physics",
                topic: "Kinematics",
                text: "A projectile has maximum range of 100 m. The maximum height reached is:",
                options: ["25 m", "50 m", "100 m", "12.5 m"],
                difficulty: "medium",
            },
            completed: false,
        };
    }

    if (cleanPath.startsWith("/adaptive/answer")) {
        return {
            is_correct: true,
            score: 4,
            explanation: "For maximum range, θ = 45°. H_max = u^2 sin^2(45) / 2g = R_max / 4 = 25 m.",
        };
    }

    if (cleanPath.startsWith("/adaptive/end") || cleanPath.startsWith("/adaptive/my-stats")) {
        return {
            accuracy_pct: 88.0,
            completed_questions: 10,
            streak: 6,
            mastery_level: "Advanced",
        };
    }

    if (cleanPath.startsWith("/adaptive/leaderboard")) {
        return [
            { rank: 1, name: "Aakash Mehta", score: 685, accuracy: 96.5 },
            { rank: 2, name: "Sneha Reddy", score: 670, accuracy: 94.0 },
            { rank: 3, name: "Ananya Iyer", score: 655, accuracy: 92.5 },
            { rank: 4, name: "Student (You)", score: 640, accuracy: 90.0 },
            { rank: 5, name: "Rohan Gupta", score: 615, accuracy: 86.0 },
        ];
    }

    if (cleanPath.startsWith("/chat/message")) {
        return {
            reply: "Hello! As your AI NEET Mentor, I can help you solve doubts in Physics, Chemistry, and Biology, explain formulas, or guide you through previous year questions. What would you like to master today?",
        };
    }

    if (cleanPath.startsWith("/rank/predict")) {
        return {
            predicted_rank: 7420,
            current_score: 635,
            percentile: 99.1,
            top_weak_areas: ["Ray Optics", "Chemical Equilibrium", "Ecology"],
        };
    }

    if (cleanPath.startsWith("/rank/study-plan")) {
        return {
            target_date: "2026-05-03",
            daily_schedule: [
                { time: "06:00 - 08:30", subject: "Biology", task: "NCERT Human Physiology Revision + 50 MCQs" },
                { time: "10:00 - 13:00", subject: "Physics", task: "Kinematics & Modern Physics PYQ Sprint" },
                { time: "16:00 - 19:00", subject: "Chemistry", task: "Organic Reaction Mechanisms & Physical Numericals" },
                { time: "20:30 - 22:00", subject: "Full Syllabus", task: "Timed Speed Challenge & Doubt Review" },
            ],
        };
    }

    if (cleanPath.startsWith("/teacher-settings")) {
        return {
            notifications_enabled: true,
            email_alerts: true,
            office_hours: "5:00 PM - 8:00 PM",
            auto_publish_tests: false,
        };
    }

    return [];
}

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
    try {
        const resp = await fetch(url, { ...opts, headers });
        if (!resp.ok) {
            return handleV2MockFallback(path, opts);
        }
        if (resp.status === 204)
            return undefined;
        return await resp.json();
    } catch {
        // Fallback for offline / static hosting (e.g. GitHub Pages)
        return handleV2MockFallback(path, opts);
    }
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
