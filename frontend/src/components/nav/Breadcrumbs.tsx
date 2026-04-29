import { ChevronRight } from "lucide-react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { getMockTest, getQuiz, getSubject, getVideo } from "@/data/mockData";

type Crumb = { label: string; to?: string };

function buildCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: "Dashboard", to: "/app" }];

  if (pathname === "/app") return crumbs;

  const isCourses =
    pathname.startsWith("/app/subjects") ||
    pathname.startsWith("/app/recorded-classes") ||
    pathname.startsWith("/app/videos") ||
    pathname.startsWith("/app/live-class");
  const isStudyRoom =
    pathname.startsWith("/app/notes") ||
    pathname.startsWith("/app/bookmarks") ||
    pathname.startsWith("/app/doubts");

  if (isCourses) crumbs.push({ label: "My Courses", to: "/app/subjects" });
  if (pathname.startsWith("/app/performance")) crumbs.push({ label: "Performance", to: "/app/performance" });
  if (isStudyRoom) crumbs.push({ label: "Study Room", to: "/app/notes" });
  if (pathname.startsWith("/app/quizzes")) crumbs.push({ label: "Quizzes", to: "/app/quizzes" });
  if (pathname.startsWith("/app/mock-tests")) crumbs.push({ label: "Mock Tests", to: "/app/mock-tests" });

  const subjectMatch = matchPath("/app/subjects/:subjectId/chapters", pathname);
  if (subjectMatch?.params?.subjectId) {
    const subj = getSubject(subjectMatch.params.subjectId);
    crumbs.push({ label: subj?.name ?? "Subject", to: `/app/subjects/${subjectMatch.params.subjectId}/chapters` });
    crumbs.push({ label: "Chapters" });
    return crumbs;
  }

  const videoMatch = matchPath("/app/videos/:videoId", pathname);
  if (videoMatch?.params?.videoId) {
    crumbs.push({ label: "Recorded Classes", to: "/app/recorded-classes" });
    const v = getVideo(videoMatch.params.videoId);
    crumbs.push({ label: v?.title ?? "Video" });
    return crumbs;
  }

  const quizAttempt = matchPath("/app/quizzes/:quizId/attempt", pathname);
  if (quizAttempt?.params?.quizId) {
    const q = getQuiz(quizAttempt.params.quizId);
    crumbs.push({ label: q?.title ?? "Quiz" });
    crumbs.push({ label: "Attempt" });
    return crumbs;
  }

  const quizResult = matchPath("/app/quizzes/:quizId/result", pathname);
  if (quizResult?.params?.quizId) {
    const q = getQuiz(quizResult.params.quizId);
    crumbs.push({ label: q?.title ?? "Quiz" });
    crumbs.push({ label: "Result" });
    return crumbs;
  }

  const testAttempt = matchPath("/app/mock-tests/:testId/attempt", pathname);
  if (testAttempt?.params?.testId) {
    const t = getMockTest(testAttempt.params.testId);
    crumbs.push({ label: t?.title ?? "Mock Test" });
    crumbs.push({ label: "Attempt" });
    return crumbs;
  }

  const testResult = matchPath("/app/mock-tests/:testId/result", pathname);
  if (testResult?.params?.testId) {
    const t = getMockTest(testResult.params.testId);
    crumbs.push({ label: t?.title ?? "Mock Test" });
    crumbs.push({ label: "Result" });
    return crumbs;
  }

  if (matchPath("/app/subjects", pathname)) crumbs.push({ label: "Subjects" });
  else if (matchPath("/app/recorded-classes", pathname)) crumbs.push({ label: "Recorded Classes" });
  else if (matchPath("/app/live-class", pathname)) crumbs.push({ label: "Live Class" });
  else if (matchPath("/app/notes", pathname)) crumbs.push({ label: "Notes" });
  else if (matchPath("/app/bookmarks", pathname)) crumbs.push({ label: "Bookmarks" });
  else if (matchPath("/app/doubts", pathname)) crumbs.push({ label: "Doubt Solving" });
  else if (matchPath("/app/notifications", pathname)) crumbs.push({ label: "Notifications" });
  else if (matchPath("/app/profile", pathname)) crumbs.push({ label: "Profile" });
  else if (matchPath("/app/settings", pathname)) crumbs.push({ label: "Settings" });

  return crumbs;
}

export function Breadcrumbs({ className }: { className?: string }) {
  const location = useLocation();
  const items = buildCrumbs(location.pathname);

  return (
    <motion.nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-xs font-semibold text-ink-500 dark:text-ink-300", className)}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {items.map((c, idx) => (
        <span key={`${c.label}_${idx}`} className="inline-flex items-center gap-1">
          {idx > 0 ? <ChevronRight className="h-3.5 w-3.5 opacity-70" /> : null}
          {c.to ? (
            <Link to={c.to} className="rounded-lg px-1.5 py-1 hover:text-ink-900 focus-ring dark:hover:text-ink-50">
              {c.label}
            </Link>
          ) : (
            <span className="px-1.5 py-1 text-ink-700 dark:text-ink-200">{c.label}</span>
          )}
        </span>
      ))}
    </motion.nav>
  );
}

