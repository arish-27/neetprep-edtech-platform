import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Home, LogOut, ShieldCheck, UploadCloud, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/auth/AuthContext";
import { useAppStore } from "@/state/useAppStore";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebarCollapsed = useAppStore((s) => s.toggleSidebarCollapsed);
  const sidebarWidth = sidebarCollapsed ? 96 : 300;

  const linkBase =
    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition focus-ring border border-white/10 hover:border-byjus-400/40 hover:shadow-neon";

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-20 -left-10 h-80 w-80 rounded-full bg-byjus-600/20 blur-3xl animate-float" />
        <div className="absolute top-28 -right-28 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl animate-float" />
      </div>

      <motion.aside
        className="hidden md:flex fixed left-4 top-4 bottom-4 z-50 glass rounded-3xl p-3 flex-col"
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <div className="flex items-center justify-between gap-2">
          <Link to="/admin" className="focus-ring rounded-2xl" title="Admin">
            <Logo compact={sidebarCollapsed} />
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10 text-ink-200 shadow-soft transition hover:bg-white/15 focus-ring"
            onClick={toggleSidebarCollapsed}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand" : "Collapse"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <div className="mt-4 space-y-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              cn(
                linkBase,
                sidebarCollapsed ? "justify-center px-2" : "justify-start",
                isActive
                  ? "bg-white/10 text-ink-50 shadow-glow"
                  : "bg-white/[0.03] text-ink-200 hover:bg-white/[0.06]",
              )
            }
            title={sidebarCollapsed ? "Dashboard" : undefined}
          >
            <ShieldCheck className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed ? <span className="truncate">Dashboard</span> : null}
          </NavLink>

          <button
            type="button"
            className={cn(
              linkBase,
              sidebarCollapsed ? "justify-center px-2" : "justify-start",
              location.hash === "#upload"
                ? "bg-white/10 text-ink-50 shadow-glow"
                : "bg-white/[0.03] text-ink-200 hover:bg-white/[0.06]",
            )}
            onClick={() => {
              window.location.hash = "upload";
              document.getElementById("admin_upload")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            aria-label="Upload"
            title={sidebarCollapsed ? "Upload" : undefined}
          >
            <UploadCloud className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed ? <span className="truncate">Upload</span> : null}
          </button>

          <Link
            to="/app"
            className={cn(
              linkBase,
              sidebarCollapsed ? "justify-center px-2" : "justify-start",
              "bg-white/[0.03] text-ink-200 hover:bg-white/[0.06]",
            )}
            title={sidebarCollapsed ? "Student App" : undefined}
          >
            <Home className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed ? <span className="truncate">Student App</span> : null}
          </Link>
        </div>

        <div className="mt-auto pt-3">
          <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-3", sidebarCollapsed ? "text-center" : "")}>
            <div className="text-sm font-extrabold text-ink-50 truncate">{user?.name ?? "Admin"}</div>
            {!sidebarCollapsed ? (
              <div className="mt-1 text-xs font-semibold text-ink-300 truncate">{user?.email ?? ""}</div>
            ) : null}
            <div className={cn("mt-3 flex gap-2", sidebarCollapsed ? "justify-center" : "")}>
              <Link
                to="/admin"
                className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10 text-ink-200 shadow-soft transition hover:bg-white/15 focus-ring"
                aria-label="Admin profile"
                title="Admin profile"
              >
                <User className="h-5 w-5" />
              </Link>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10 text-ink-200 shadow-soft transition hover:bg-white/15 focus-ring"
                onClick={signOut}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      <div className="min-h-screen flex">
        <motion.div
          className="hidden md:block shrink-0"
          initial={false}
          animate={{ width: sidebarWidth + 32 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-4 z-40 px-4 md:px-6">
            <div className="glass rounded-3xl px-4 py-3 md:px-5 md:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-ink-900 md:text-base dark:text-ink-50">
                    Admin Console
                  </div>
                  <div className="truncate text-xs font-semibold text-ink-500 dark:text-ink-300">
                    Upload content, manage users, and review analytics.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/app"
                    className="hidden md:inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-extrabold text-ink-100 shadow-soft transition hover:bg-white/10 focus-ring"
                    title="Student view"
                  >
                    <Home className="h-4 w-4" />
                    Student View
                  </Link>
                  <button
                    type="button"
                    className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/10 text-ink-200 shadow-soft transition hover:bg-white/15 focus-ring"
                    onClick={signOut}
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 pt-4 pb-6 md:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="mx-auto max-w-[1280px]"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
