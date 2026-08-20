import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, CheckCircle2, FileText, ShieldCheck, Tag, UploadCloud, Users, Video, X, } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/cn";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { api, subjectKeyToApi } from "@/lib/api";
import { subjects } from "@/data/mockData";
function formatDuration(seconds) {
    const safe = Math.max(0, Math.round(seconds));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    if (h <= 0)
        return `${m}m`;
    return `${h}h ${m}m`;
}
function formatRelative(iso) {
    if (!iso)
        return "No activity yet";
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t))
        return "No activity yet";
    const diff = Date.now() - t;
    const minutes = Math.max(0, Math.round(diff / 60000));
    if (minutes < 2)
        return "Just now";
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
}
function DropZone({ label, hint, accept, file, onFile, }) {
    const inputRef = useRef(null);
    const [drag, setDrag] = useState(false);
    return (<div>
      <div className="text-xs font-extrabold text-ink-200">{label}</div>
      <div className="mt-2">
        <motion.button type="button" className={cn("w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left shadow-soft transition focus-ring", drag ? "bg-white/10 shadow-neon" : "hover:bg-white/10")} onClick={() => inputRef.current?.click()} onDragEnter={(e) => {
            e.preventDefault();
            setDrag(true);
        }} onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
        }} onDragLeave={(e) => {
            e.preventDefault();
            setDrag(false);
        }} onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0] ?? null;
            if (f)
                onFile(f);
        }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} transition={{ type: "spring", stiffness: 420, damping: 30 }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-ink-50">Drag & drop or click to upload</div>
              <div className="mt-1 text-sm font-semibold text-ink-300">{hint}</div>
              {file ? (<div className="mt-3">
                  <Badge className="bg-white/10 border-white/10 text-ink-200">{file.name}</Badge>
                </div>) : null}
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-3xl border border-white/10 bg-white/10 text-ink-200 shadow-soft">
              <UploadCloud className="h-6 w-6"/>
            </div>
          </div>
        </motion.button>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)}/>
        {file ? (<div className="mt-2">
            <button type="button" className="inline-flex items-center gap-2 text-xs font-extrabold text-ink-300 hover:text-ink-100 focus-ring rounded-xl px-2 py-1" onClick={() => onFile(null)}>
              <X className="h-3.5 w-3.5"/> Remove
            </button>
          </div>) : null}
      </div>
    </div>);
}
export function AdminDashboardScreen() {
    const [students, setStudents] = useState([]);
    const [studentsTotal, setStudentsTotal] = useState(0);
    const [studentsLoading, setStudentsLoading] = useState(true);
    const [studentsError, setStudentsError] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "physics");
    const [courseId, setCourseId] = useState("");
    const [tags, setTags] = useState("neet, revision");
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [success, setSuccess] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const refreshStudents = async () => {
        setStudentsError(null);
        setStudentsLoading(true);
        try {
            const page = await api.admin.students({ limit: 50, offset: 0 });
            setStudents(page.items ?? []);
            setStudentsTotal(page.meta?.total ?? (page.items?.length ?? 0));
        }
        catch (err) {
            setStudents([]);
            setStudentsTotal(0);
            setStudentsError(err?.message ?? "Failed to load students.");
        }
        finally {
            setStudentsLoading(false);
        }
    };
    useEffect(() => {
        void refreshStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        let cancelled = false;
        const key = subjectId;
        setCoursesLoading(true);
        setCourses([]);
        setCourseId("");
        (async () => {
            try {
                const page = await api.courses.list({ subject: key, limit: 50, offset: 0 });
                if (cancelled)
                    return;
                setCourses(page.items ?? []);
            }
            catch {
                if (cancelled)
                    return;
                setCourses([]);
            }
            finally {
                if (!cancelled)
                    setCoursesLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [subjectId]);
    const canPublish = !uploading && Boolean(subjectId) && (Boolean(pdfFile) || Boolean(videoFile));
    const startUpload = async () => {
        if (!canPublish)
            return;
        setUploading(true);
        setSuccess(false);
        setUploadError(null);
        setProgress(0);
        const tick = window.setInterval(() => {
            setProgress((p) => Math.min(92, p + Math.max(2, Math.round(Math.random() * 8))));
        }, 160);
        const subject = subjectKeyToApi(subjectId);
        const uploadOne = async (file, fileType) => {
            const form = new FormData();
            form.set("title", `${fileType === "pdf" ? "Study Material" : "Video Lesson"} · ${file.name}`);
            form.set("file_type", fileType);
            if (subject)
                form.set("subject", subject);
            if (courseId)
                form.set("course_id", courseId);
            form.set("file", file);
            return await api.uploads.upload(form);
        };
        try {
            if (pdfFile)
                await uploadOne(pdfFile, "pdf");
            if (videoFile)
                await uploadOne(videoFile, "video");
            setProgress(100);
            setUploading(false);
            setSuccess(true);
            window.setTimeout(() => setSuccess(false), 2400);
            // Keep files for now (admin may want to upload again); reset is available.
        }
        catch (err) {
            setUploading(false);
            setUploadError(err?.message ?? "Upload failed.");
        }
        finally {
            window.clearInterval(tick);
        }
    };
    const selectedSubject = subjects.find((s) => s.id === subjectId)?.name ?? subjectId;
    const selectedCourse = courses.find((c) => c.id === courseId) ?? null;
    return (<div className="space-y-4">
      <Card className="p-5 overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 byjus-gradient opacity-25"/>
          <div className="relative">
            <Badge className="border-white/30 bg-white/15 text-white">
              <ShieldCheck className="h-3.5 w-3.5"/>
              Admin Dashboard
            </Badge>
            <div className="mt-4 text-3xl font-extrabold text-ink-50">Manage your NEET platform</div>
            <div className="mt-2 text-sm font-semibold text-ink-200 max-w-2xl">
              Publish study materials, upload content, and monitor student progress stored in the database.
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-ink-200">Students</div>
              <div className="mt-2 text-3xl font-extrabold text-ink-50">{studentsTotal || "—"}</div>
              <div className="mt-1 text-sm font-semibold text-ink-300">DB-backed summary</div>
            </div>
            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center">
              <Users className="h-5 w-5 text-byjus-400"/>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-ink-200">Content</div>
              <div className="mt-2 text-3xl font-extrabold text-ink-50">{courses.length || "—"}</div>
              <div className="mt-1 text-sm font-semibold text-ink-300">Courses loaded</div>
            </div>
            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center">
              <FileText className="h-5 w-5 text-byjus-400"/>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-ink-200">Attempts</div>
              <div className="mt-2 text-3xl font-extrabold text-ink-50">
                {students.reduce((sum, s) => sum + (s.quiz_attempts ?? 0), 0) || "—"}
              </div>
              <div className="mt-1 text-sm font-semibold text-ink-300">Quizzes (page)</div>
            </div>
            <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center">
              <BarChart3 className="h-5 w-5 text-byjus-400"/>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-ink-50">Student Progress</div>
            <div className="text-sm font-semibold text-ink-300">Live summary aggregated from Progress + QuizResult.</div>
          </div>
          <Button variant="secondary" className="h-10 rounded-2xl" onClick={() => void refreshStudents()} disabled={studentsLoading}>
            Refresh
          </Button>
        </div>

        {studentsError ? (<div className="mt-5 rounded-3xl border border-red-400/30 bg-red-500/10 p-5 shadow-soft">
            <div className="text-sm font-extrabold text-red-100">{studentsError}</div>
          </div>) : null}

        {studentsLoading ? (<div className="mt-5 grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (<div key={`sk_${i}`} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft">
                <div className="h-4 w-40 animate-pulse rounded-2xl bg-white/10"/>
                <div className="mt-3 h-3 w-56 animate-pulse rounded-2xl bg-white/10"/>
                <div className="mt-5 h-2.5 w-full animate-pulse rounded-2xl bg-white/10"/>
              </div>))}
          </div>) : students.length === 0 ? (<div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-soft">
            <div className="text-sm font-extrabold text-ink-50">No student data yet</div>
            <div className="mt-1 text-sm font-semibold text-ink-300">
              Ask a student to watch a lesson or attempt a quiz, then refresh.
            </div>
          </div>) : (<motion.div className="mt-5 grid gap-4 lg:grid-cols-2" variants={staggerContainer} initial="hidden" animate="show">
            {students.map((s) => {
                const goalSeconds = 6 * 3600;
                const watchPct = Math.min(100, Math.round(((s.watched_seconds ?? 0) / goalSeconds) * 100));
                return (<motion.div key={s.id} variants={staggerItem}>
                  <Card interactive className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-extrabold text-ink-50">{s.username || "Student"}</div>
                        <div className="mt-1 truncate text-xs font-semibold text-ink-300">{s.email}</div>
                        <div className="mt-2 text-xs font-semibold text-ink-400">{formatRelative(s.last_active_at)}</div>
                      </div>
                      <div className="h-10 w-10 rounded-2xl border border-white/10 bg-white/10 grid place-items-center">
                        <Users className="h-5 w-5 text-byjus-400"/>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-ink-300">
                          <span>Watch time</span>
                          <span>{formatDuration(s.watched_seconds ?? 0)}</span>
                        </div>
                        <ProgressBar value={watchPct} className="mt-2 h-2.5"/>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
                          <div className="text-xs font-extrabold text-ink-300">Completed</div>
                          <div className="mt-1 text-sm font-extrabold text-ink-50">{s.completed_lessons ?? 0}</div>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
                          <div className="text-xs font-extrabold text-ink-300">Quizzes</div>
                          <div className="mt-1 text-sm font-extrabold text-ink-50">{s.quiz_attempts ?? 0}</div>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
                          <div className="text-xs font-extrabold text-ink-300">Avg %</div>
                          <div className="mt-1 text-sm font-extrabold text-ink-50">{s.avg_score_pct ?? 0}</div>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
                        <div className="flex items-center justify-between text-xs font-semibold text-ink-300">
                          <span>Average score</span>
                          <span>{s.avg_score_pct == null ? "—" : `${s.avg_score_pct}%`}</span>
                        </div>
                        <ProgressBar value={s.avg_score_pct ?? 0} className="mt-2 h-2.5"/>
                      </div>
                    </div>
                  </Card>
                </motion.div>);
            })}
          </motion.div>)}
      </Card>

      <Card className="p-5" id="admin_upload">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-extrabold text-ink-50">Upload Content</div>
            <div className="text-sm font-semibold text-ink-300">Study materials (PDF) + video lessons</div>
          </div>
          <Badge className="bg-white/10 border-white/10 text-ink-200">
            <UploadCloud className="h-3.5 w-3.5"/> Admin
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <DropZone label="Upload Study Material (PDF)" hint="PDF only (stored locally under /static on the API)." accept="application/pdf" file={pdfFile} onFile={setPdfFile}/>
          <DropZone label="Upload Video" hint="MP4 / MOV (stored locally under /static on the API)." accept="video/*" file={videoFile} onFile={setVideoFile}/>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-ink-200">Subject</label>
            <select className="h-11 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-ink-100 shadow-soft focus-ring" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={uploading}>
              {subjects.map((s) => (<option key={s.id} value={s.id}>
                  {s.name}
                </option>))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-ink-200">Course (Chapter)</label>
            <select className="h-11 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-semibold text-ink-100 shadow-soft focus-ring" value={courseId} onChange={(e) => setCourseId(e.target.value)} disabled={uploading || coursesLoading}>
              <option value="">{coursesLoading ? "Loading…" : "Select course (optional)"}</option>
              {courses.map((c) => (<option key={c.id} value={c.id}>
                  {c.title}
                </option>))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-ink-200">Tags (UI-only)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="neet, goc, formulas"/>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-extrabold text-ink-50">
                <Tag className="h-4 w-4 text-byjus-400"/>
                Metadata Preview
              </div>
              <div className="mt-2 text-sm font-semibold text-ink-300">
                Subject: <span className="text-ink-100">{selectedSubject}</span> · Course:{" "}
                <span className="text-ink-100">{selectedCourse?.title ?? "n/a"}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 8)
            .map((t) => (<Badge key={t} className="bg-white/10 border-white/10 text-ink-200">
                      {t}
                    </Badge>))}
              </div>
            </div>

            <div className="grid gap-2">
              <Button className="h-11 rounded-2xl" onClick={() => void startUpload()} disabled={!canPublish}>
                <Video className="h-4 w-4"/>
                {uploading ? "Publishing..." : "Publish"}
              </Button>
              <Button variant="secondary" className="h-11 rounded-2xl" onClick={() => {
            setPdfFile(null);
            setVideoFile(null);
            setTags("neet, revision");
            setCourseId("");
            setUploadError(null);
        }} disabled={uploading}>
                Reset
              </Button>
            </div>
          </div>

          {uploadError ? (<div className="mt-4 rounded-3xl border border-red-400/30 bg-red-500/10 p-4 shadow-soft">
              <div className="text-sm font-extrabold text-red-100">{uploadError}</div>
            </div>) : null}

          {uploading ? (<div className="mt-4">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-300">
                <span>Uploading</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar value={progress} className="mt-2 h-2.5"/>
            </div>) : null}

          <AnimatePresence>
            {success ? (<motion.div className="mt-4 rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-4 shadow-soft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.22, ease: "easeOut" }}>
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30">
                    <CheckCircle2 className="h-5 w-5 text-emerald-100"/>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-emerald-100">Published successfully</div>
                    <div className="mt-1 text-sm font-semibold text-emerald-100/80">
                      Content is now visible in the student app.
                    </div>
                  </div>
                </div>
              </motion.div>) : null}
          </AnimatePresence>
        </div>
      </Card>
    </div>);
}
