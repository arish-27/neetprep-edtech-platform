import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { starterNotes } from "@/data/mockData";
// ── Inline Lottie animation data (simple bouncing book) ────────────────────
// This is a minimal valid Lottie JSON that always works without external deps
const BOOK_ANIM = {
    v: "5.7.4", fr: 30, ip: 0, op: 60, w: 200, h: 200,
    nm: "book", ddd: 0, assets: [],
    layers: [{
            ddd: 0, ind: 1, ty: 4, nm: "book",
            sr: 1, ks: {
                o: { a: 0, k: 100 },
                r: { a: 1, k: [
                        { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 0, s: [-8] },
                        { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 30, s: [8] },
                        { t: 60, s: [-8] }
                    ] },
                p: { a: 1, k: [
                        { i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 }, t: 0, s: [100, 110, 0], to: [0, -6, 0], ti: [0, 0, 0] },
                        { i: { x: 0.5, y: 1 }, o: { x: 0.5, y: 0 }, t: 30, s: [100, 74, 0], to: [0, 0, 0], ti: [0, -6, 0] },
                        { t: 60, s: [100, 110, 0] }
                    ] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 0, k: [100, 100, 100] }
            },
            ao: 0,
            shapes: [
                // Book body
                { ty: "gr", nm: "body", it: [
                        { ty: "rc", d: 1, s: { a: 0, k: [80, 100] }, p: { a: 0, k: [0, 0] }, r: { a: 0, k: 8 }, nm: "rect" },
                        { ty: "fl", c: { a: 0, k: [0.545, 0.361, 0.965, 1] }, o: { a: 0, k: 100 }, r: 1, nm: "fill" },
                        { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
                    ] },
                // Book spine
                { ty: "gr", nm: "spine", it: [
                        { ty: "rc", d: 1, s: { a: 0, k: [10, 100] }, p: { a: 0, k: [-35, 0] }, r: { a: 0, k: 4 }, nm: "rect" },
                        { ty: "fl", c: { a: 0, k: [0.42, 0.24, 0.8, 1] }, o: { a: 0, k: 100 }, r: 1, nm: "fill" },
                        { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
                    ] },
                // Line 1
                { ty: "gr", nm: "line1", it: [
                        { ty: "rc", d: 1, s: { a: 0, k: [50, 6] }, p: { a: 0, k: [5, -20] }, r: { a: 0, k: 3 }, nm: "rect" },
                        { ty: "fl", c: { a: 0, k: [1, 1, 1, 0.6] }, o: { a: 0, k: 100 }, r: 1, nm: "fill" },
                        { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
                    ] },
                // Line 2
                { ty: "gr", nm: "line2", it: [
                        { ty: "rc", d: 1, s: { a: 0, k: [40, 6] }, p: { a: 0, k: [0, -5] }, r: { a: 0, k: 3 }, nm: "rect" },
                        { ty: "fl", c: { a: 0, k: [1, 1, 1, 0.6] }, o: { a: 0, k: 100 }, r: 1, nm: "fill" },
                        { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
                    ] },
                // Line 3
                { ty: "gr", nm: "line3", it: [
                        { ty: "rc", d: 1, s: { a: 0, k: [45, 6] }, p: { a: 0, k: [2, 10] }, r: { a: 0, k: 3 }, nm: "rect" },
                        { ty: "fl", c: { a: 0, k: [1, 1, 1, 0.6] }, o: { a: 0, k: 100 }, r: 1, nm: "fill" },
                        { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
                    ] },
            ],
            ip: 0, op: 60, st: 0, bm: 0
        }]
};
const PENCIL_ANIM = {
    v: "5.7.4", fr: 30, ip: 0, op: 60, w: 200, h: 200,
    nm: "pencil", ddd: 0, assets: [],
    layers: [{
            ddd: 0, ind: 1, ty: 4, nm: "pencil",
            sr: 1, ks: {
                o: { a: 0, k: 100 },
                r: { a: 1, k: [
                        { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 0, s: [-20] },
                        { i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] }, t: 30, s: [20] },
                        { t: 60, s: [-20] }
                    ] },
                p: { a: 0, k: [100, 100, 0] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 1, k: [
                        { i: { x: [0.5, 0.5], y: [1, 1] }, o: { x: [0.5, 0.5], y: [0, 0] }, t: 0, s: [90, 90, 100] },
                        { i: { x: [0.5, 0.5], y: [1, 1] }, o: { x: [0.5, 0.5], y: [0, 0] }, t: 30, s: [110, 110, 100] },
                        { t: 60, s: [90, 90, 100] }
                    ] }
            },
            ao: 0,
            shapes: [
                // Pencil body
                { ty: "gr", nm: "body", it: [
                        { ty: "rc", d: 1, s: { a: 0, k: [20, 90] }, p: { a: 0, k: [0, 5] }, r: { a: 0, k: 4 }, nm: "rect" },
                        { ty: "fl", c: { a: 0, k: [0.98, 0.76, 0.18, 1] }, o: { a: 0, k: 100 }, r: 1, nm: "fill" },
                        { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
                    ] },
                // Pencil tip
                { ty: "gr", nm: "tip", it: [
                        { ty: "sh", ks: { a: 0, k: { i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], v: [[-10, -45], [10, -45], [0, -65]], c: true } }, nm: "path" },
                        { ty: "fl", c: { a: 0, k: [0.96, 0.87, 0.7, 1] }, o: { a: 0, k: 100 }, r: 1, nm: "fill" },
                        { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
                    ] },
                // Eraser
                { ty: "gr", nm: "eraser", it: [
                        { ty: "rc", d: 1, s: { a: 0, k: [20, 14] }, p: { a: 0, k: [0, 52] }, r: { a: 0, k: 3 }, nm: "rect" },
                        { ty: "fl", c: { a: 0, k: [0.96, 0.5, 0.6, 1] }, o: { a: 0, k: 100 }, r: 1, nm: "fill" },
                        { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } }
                    ] },
            ],
            ip: 0, op: 60, st: 0, bm: 0
        }]
};
export function NotesScreen() {
    const [notes, setNotes] = useLocalStorageState("neet_notes_v1", starterNotes);
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const count = notes.length;
    const sorted = useMemo(() => [...notes], [notes]);
    return (<div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">

      {/* ── Left: Notes list ─────────────────────────────────────────────── */}
      <Reveal>
        <Card className="p-5">
          {/* Header with Lottie */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-ink-900 dark:text-white">Study Room</div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-300">
                Save formulas, tricks, and quick summaries.
              </div>
            </div>
            {/* ✅ Lottie always visible in header */}
            <Lottie animationData={BOOK_ANIM} loop style={{ width: 72, height: 72, flexShrink: 0 }}/>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Badge className="bg-white/10 border-white/10 text-ink-700 dark:text-ink-200">
              {count} notes
            </Badge>
            <Button variant="secondary" className="h-10 rounded-2xl" onClick={() => { setTitle(""); setBody(""); }}>
              <Plus className="h-4 w-4"/> New
            </Button>
          </div>

          {/* ✅ Empty state — Lottie shown when no notes */}
          <AnimatePresence>
            {sorted.length === 0 && (<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-8 text-center">
                <Lottie animationData={BOOK_ANIM} loop style={{ width: 160, height: 160 }}/>
                <p className="mt-2 text-sm font-bold text-ink-700 dark:text-ink-300">No notes yet</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">Create your first note →</p>
              </motion.div>)}
          </AnimatePresence>

          <motion.div className="mt-4 space-y-3" variants={staggerContainer} initial="hidden" animate="show">
            {sorted.map((n) => (<motion.div key={n.id} variants={staggerItem}>
                <Card interactive className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-ink-900 dark:text-white">{n.title}</div>
                      <div className="mt-1 text-xs font-semibold text-ink-500 dark:text-ink-400">{n.updatedAt}</div>
                    </div>
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-2xl border border-white/10 bg-white/10 text-ink-600 dark:text-ink-200 transition hover:bg-red-500/20 hover:text-red-500 focus-ring" onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))}>
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </div>
                  <div className="mt-3 text-sm font-semibold text-ink-700 dark:text-ink-300 line-clamp-3">{n.body}</div>
                </Card>
              </motion.div>))}
          </motion.div>
        </Card>
      </Reveal>

      {/* ── Right: Create note ───────────────────────────────────────────── */}
      <Reveal delay={0.05}>
        <Card className="p-5">
          {/* ✅ Banner with Lottie — always visible */}
          <div className="flex items-center gap-4 mb-5 rounded-2xl p-4" style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.1) 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
        }}>
            <Lottie animationData={PENCIL_ANIM} loop style={{ width: 80, height: 80, flexShrink: 0 }}/>
            <div>
              <div className="text-base font-extrabold text-ink-900 dark:text-white">Create a Note</div>
              <div className="text-xs font-semibold text-ink-600 dark:text-ink-400 mt-0.5">
                Capture formulas, key points &amp; tricks
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-ink-700 dark:text-ink-300">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Optics formulas"/>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-ink-700 dark:text-ink-300">Note</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full min-h-[200px] rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-ink-900 dark:text-ink-100 focus-ring placeholder:text-ink-400" placeholder="Write here..."/>
            </div>
            <Button className="h-11 w-full rounded-2xl" onClick={() => {
            const t = title.trim() || "Untitled note";
            const b = body.trim();
            if (!t && !b)
                return;
            setNotes((prev) => [
                { id: `note_${Date.now()}`, title: t, body: b, updatedAt: "Just now" },
                ...prev,
            ]);
            setTitle("");
            setBody("");
        }}>
              Save note
            </Button>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-extrabold text-ink-700 dark:text-ink-300">💡 Pro tip</div>
              <div className="mt-1 text-sm font-semibold text-ink-700 dark:text-ink-300">
                Keep it short: formulas, common mistakes, and quick tricks.
              </div>
            </div>
          </div>
        </Card>
      </Reveal>
    </div>);
}
