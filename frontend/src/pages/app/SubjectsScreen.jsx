import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search, Sparkles, ChevronRight, Stethoscope, Microscope, Award } from "lucide-react";
import { motion } from "framer-motion";
import { subjects } from "@/data/mockData";
import { api, apiSubjectToKey } from "@/lib/api";
import {
  HeroMedicalVisual,
  PhysicsVisual,
  ChemistryVisual,
  BiologyVisual,
  StudyLoungeVisual,
} from "@/components/coffee/CoffeeVisuals";

// ── Subject Details & Theme Mapping (Exact Match to Template Palette) ───────────
const SUBJECT_THEMES = {
  physics: {
    bg: "#FAD5D8",
    border: "#EAA9AD",
    titleColor: "#52272B",
    tagColor: "#7A3E45",
    pillBg: "rgba(240, 175, 182, 0.65)",
    pillText: "#52272B",
    progressTrack: "#F2BAC0",
    progressBar: "#52272B",
    cursiveTag: "Mechanics, Optics & Electrodynamics",
    metaText: "High-Yield Formulas & Numericals",
    chaptersCount: 3,
    videosCount: 12,
    quizzesCount: 3,
    Component: PhysicsVisual,
  },
  chemistry: {
    bg: "#FBE5CF",
    border: "#E6BF9B",
    titleColor: "#52321C",
    tagColor: "#7A4E30",
    pillBg: "rgba(244, 203, 168, 0.65)",
    pillText: "#52321C",
    progressTrack: "#F4D0B0",
    progressBar: "#52321C",
    cursiveTag: "Organic, Physical & Inorganic",
    metaText: "Reactions & Mechanism Vault",
    chaptersCount: 3,
    videosCount: 10,
    quizzesCount: 3,
    Component: ChemistryVisual,
  },
  biology: {
    bg: "#E3D4E6",
    border: "#C7ADC9",
    titleColor: "#492C51",
    tagColor: "#6F4878",
    pillBg: "rgba(218, 196, 222, 0.65)",
    pillText: "#492C51",
    progressTrack: "#D8C0DC",
    progressBar: "#492C51",
    cursiveTag: "Botany, Zoology & Physiology",
    metaText: "100% NCERT Mastery & Diagrams",
    chaptersCount: 3,
    videosCount: 16,
    quizzesCount: 3,
    Component: BiologyVisual,
  },
};

export function SubjectsScreen() {
  const [q, setQ] = useState("");
  const [progress, setProgress] = useState({
    physics: 58,
    chemistry: 65,
    biology: 72,
  });
  const [progressLoading, setProgressLoading] = useState(true);

  // Filter subjects by search query (preserves original function)
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.tagline.toLowerCase().includes(query)
    );
  }, [q]);

  // Load subject progress from API (preserves original function)
  useEffect(() => {
    setProgressLoading(true);
    api.dashboard
      .subjectProgress()
      .then((rows) => {
        const next = {};
        for (const r of rows ?? []) {
          next[apiSubjectToKey(r.subject)] = r.progress_pct ?? 0;
        }
        setProgress((prev) => ({ ...prev, ...next }));
      })
      .catch(() => {})
      .finally(() => setProgressLoading(false));
  }, []);

  return (
    <div
      className="min-h-screen -m-4 md:-m-6 p-4 md:p-8 font-sans transition-colors duration-300"
      style={{
        backgroundColor: "#FBF7F2",
        color: "#3B2318",
      }}
    >
      {/* ── Top Header Brand / Nav Bar (Preserves template layout with medical branding) ── */}
      <div className="max-w-6xl mx-auto flex items-center justify-between py-2 mb-6 border-b border-[#E8DDD1]/70">
        <div className="flex items-center gap-3">
          <span
            className="text-3xl font-serif font-black tracking-tight select-none"
            style={{ color: "#3B2318" }}
          >
            NEET Prep
          </span>
          <span className="hidden sm:inline-block text-xs uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#EAD8CA] text-[#5A3828] font-bold">
            Medical Academy
          </span>
        </div>

        {/* Center / Right quick nav */}
        <div className="flex items-center gap-6 text-xs md:text-sm font-semibold text-[#6C4A3A]">
          <span className="pb-1 border-b-2 border-[#3B2318] text-[#3B2318] font-bold cursor-pointer">
            Subjects
          </span>
          <Link
            to="/app/recorded-classes"
            className="hover:text-[#3B2318] transition hidden sm:inline"
          >
            Masterclasses
          </Link>
          <Link
            to="/app/quizzes"
            className="hover:text-[#3B2318] transition hidden md:inline"
          >
            Quizzes
          </Link>
          <Link
            to="/app/notes"
            className="hover:text-[#3B2318] transition hidden md:inline"
          >
            NCERT Vault
          </Link>
          <div className="flex items-center gap-2 pl-2 border-l border-[#E2D1C1]">
            <div className="w-8 h-8 rounded-full bg-[#EAD6D8] border border-[#D8BAC0] flex items-center justify-center text-xs font-bold text-[#52272B]">
              🩺
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* ── HERO BANNER: Warm Cocoa with Torn Deckled Edges ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[32px] overflow-hidden text-[#FFFDF9] shadow-[0_20px_50px_rgba(70,40,30,0.2)]"
          style={{
            background:
              "linear-gradient(135deg, #5A3B2F 0%, #6E4637 45%, #845543 100%)",
          }}
        >
          {/* Top Torn Paper Organic Texture Wave */}
          <div className="absolute top-0 left-0 right-0 h-4 pointer-events-none opacity-40">
            <svg
              viewBox="0 0 1200 24"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <path
                d="M0 0 L1200 0 L1200 12 Q1100 24 1000 10 Q900 0 800 14 Q700 24 600 8 Q500 0 400 16 Q300 24 200 10 Q100 0 0 14 Z"
                fill="#FBF7F2"
              />
            </svg>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-center p-6 md:p-12 relative z-10">
            {/* Left Content */}
            <div className="md:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-[#3E2419]/60 border border-[#8C624F] text-[#F3E7DC]">
                <Sparkles className="w-3.5 h-3.5 text-[#EAB5BC]" />
                <span>NEET Medical Preparation · Physics · Chemistry · Biology</span>
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-[1.08]"
                style={{
                  color: "#FFFDF9",
                  textShadow: "0 2px 10px rgba(30,15,10,0.3)",
                }}
              >
                Your Medical Dream
                <br />
                Starts Here.
              </h1>

              <p className="text-sm sm:text-base font-normal leading-relaxed text-[#EDE1D4] max-w-lg">
                Choose a subject to view chapters, videos, and quizzes. Master high-yield
                formulas, reaction mechanisms, and NCERT theory designed for top scores.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/app/subjects/physics/chapters"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: "#331E15",
                    border: "1.5px solid #8B6755",
                    color: "#FFFDF9",
                  }}
                >
                  <span>Explore Chapters</span>
                  <ChevronRight className="w-4 h-4 text-[#EAB5BC]" />
                </Link>

                <span className="text-xs text-[#DBCBBF] font-medium px-3 py-2">
                  100% Free Masterclasses Included
                </span>
              </div>
            </div>

            {/* Right Hero Visual: 3D Medical Caduceus & Stethoscope Emblem */}
            <div className="md:col-span-5 flex justify-center md:justify-end">
              <HeroMedicalVisual className="w-60 h-60 md:w-80 md:h-72" />
            </div>
          </div>

          {/* Bottom Torn Paper Wave */}
          <div className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none opacity-40">
            <svg
              viewBox="0 0 1200 24"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <path
                d="M0 24 L1200 24 L1200 12 Q1100 0 1000 14 Q900 24 800 10 Q700 0 600 16 Q500 24 400 8 Q300 0 200 14 Q100 24 0 10 Z"
                fill="#FBF7F2"
              />
            </svg>
          </div>
        </motion.div>

        {/* ── Mid Feature Badges & Search Row ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          {/* Two Science Badges matching template pill layout */}
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAD8CA] flex items-center justify-center text-[#5A3828] shadow-sm">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold font-serif text-[#3B2318]">
                  NCERT Aligned
                </div>
                <div className="text-xs text-[#7A5B4C] font-medium">
                  Comprehensive 11th & 12th
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EAD6D8] flex items-center justify-center text-[#52272B] shadow-sm">
                <Microscope className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold font-serif text-[#3B2318]">
                  Top Faculty
                </div>
                <div className="text-xs text-[#7A5B4C] font-medium">
                  Expert Doctors & Educators
                </div>
              </div>
            </div>
          </div>

          {/* Search Input Filter */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6B5B]" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search subjects, chapters…"
              className="w-full pl-11 pr-4 py-2.5 rounded-full text-xs font-medium focus:outline-none transition-all shadow-sm"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1.5px solid #E2D1C1",
                color: "#3B2318",
              }}
            />
          </div>
        </div>

        {/* ── The 3 Core Subject Cards (Physics, Chemistry, Biology) ── */}
        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={{
            animate: { transition: { staggerChildren: 0.12 } },
          }}
          initial="initial"
          animate="animate"
        >
          {filtered.map((s) => {
            const theme = SUBJECT_THEMES[s.id] || SUBJECT_THEMES.physics;
            const pct = progress[s.id] ?? 0;
            const VisualComponent = theme.Component;

            return (
              <motion.div
                key={s.id}
                variants={{
                  initial: { opacity: 0, y: 40 },
                  animate: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5 }}
                whileHover={{
                  y: -8,
                  boxShadow: `0 20px 40px ${theme.border}88`,
                }}
                className="group focus-ring rounded-[28px] overflow-hidden transition-all duration-300"
              >
                <Link
                  to={`/app/subjects/${s.id}/chapters`}
                  className="block rounded-[28px] p-6 sm:p-7 relative transition-all duration-300"
                  style={{
                    backgroundColor: theme.bg,
                    border: `1.5px solid ${theme.border}`,
                    boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Top Card Title & Subtitle */}
                  <div className="text-center mb-4">
                    <h2
                      className="text-2xl sm:text-3xl font-serif font-black tracking-tight"
                      style={{ color: theme.titleColor }}
                    >
                      {s.name}
                    </h2>
                    <p
                      className="text-xs font-semibold tracking-wide mt-1"
                      style={{ color: theme.tagColor }}
                    >
                      {s.tagline}
                    </p>
                  </div>

                  {/* Centered Science SVG Visual (Atom / Flask / DNA) */}
                  <div className="my-2 py-2 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                    <VisualComponent className="w-48 h-40" />
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-5 space-y-1.5">
                    <div
                      className="flex items-center justify-between text-xs font-bold"
                      style={{ color: theme.titleColor }}
                    >
                      <span>Progress</span>
                      {progressLoading ? (
                        <span className="opacity-60">Loading...</span>
                      ) : (
                        <span>{pct}%</span>
                      )}
                    </div>

                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: theme.progressTrack }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: theme.progressBar }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>

                    <div
                      className="flex items-center justify-between text-[11px] pt-1 font-medium"
                      style={{ color: theme.tagColor }}
                    >
                      <span>{theme.chaptersCount} Chapters</span>
                      <span>{theme.videosCount} Videos</span>
                      <span>{theme.quizzesCount} Quizzes</span>
                    </div>
                  </div>

                  {/* Bottom Subject Specialization Banner Tag */}
                  <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between">
                    <span
                      className="font-serif italic text-sm tracking-wide font-bold"
                      style={{ color: theme.titleColor }}
                    >
                      {theme.cursiveTag}
                    </span>

                    <span
                      className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-transform group-hover:translate-x-1"
                      style={{
                        backgroundColor: theme.pillBg,
                        color: theme.pillText,
                      }}
                    >
                      Explore →
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── BOTTOM SECTION: NEET Study Lounge with Medical Books & Stethoscope ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-[32px] p-6 md:p-10 border border-[#E8DDD1] shadow-sm relative overflow-hidden"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <div className="grid md:grid-cols-12 gap-6 items-center">
            {/* Left: Open Medical Textbook & Stethoscope Visual */}
            <div className="md:col-span-4 flex justify-center">
              <StudyLoungeVisual className="w-52 h-44" />
            </div>

            {/* Right: Description & Action */}
            <div className="md:col-span-8 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-[#9C6D58]">
                  Daily Study Lounge
                </span>
                <h3
                  className="text-2xl sm:text-3xl font-serif font-black tracking-tight"
                  style={{ color: "#3B2318" }}
                >
                  Medical Revision Hub · Daily Mastery
                </h3>
              </div>

              <p className="text-xs sm:text-sm leading-relaxed text-[#6E5346] max-w-2xl">
                Mastering NEET requires regular chapter revisions and structured practice.
                Step into your subject chapters to watch full-length masterclasses, practice
                high-yield MCQs, and solve previous year question papers.
              </p>

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  to="/app/subjects/physics/chapters"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: "#E8C5C8",
                    color: "#3B2318",
                    border: "1.5px solid #D9ABB0",
                  }}
                >
                  <span>Continue Learning →</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Footer Bar Matching Template ── */}
        <div className="pt-8 pb-4 border-t border-[#E8DDD1]/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#8C6B5B]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#5A3828]" />
            <span>NEET Learning Platform · Physics · Chemistry · Biology</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#3B2318] cursor-pointer">Official Course</span>
            <span className="hover:text-[#3B2318] cursor-pointer">Formula Sheets</span>
            <span className="hover:text-[#3B2318] cursor-pointer">Rank Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubjectsScreen;
