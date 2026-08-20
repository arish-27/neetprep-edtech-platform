import { Link } from "react-router-dom";
import { GraduationCap, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockTests } from "@/data/mockData";
import { useAppStore } from "@/state/useAppStore";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
export function MockTestScreen() {
    const attemptHistory = useAppStore((s) => s.attemptHistory);
    return (<div className="space-y-4">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">
                Mock Tests
              </div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">
                Timed practice for exam-like performance.
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-byjus-50 border border-byjus-200/70 grid place-items-center dark:bg-white/10 dark:border-white/10">
              <GraduationCap className="h-5 w-5 text-byjus-700 dark:text-ink-200"/>
            </div>
          </div>
        </Card>
      </Reveal>

      <motion.div className="grid gap-4 md:grid-cols-2" variants={staggerContainer} initial="hidden" animate="show">
        {mockTests.map((t) => {
            const attempt = attemptHistory[t.id]?.[0];
            const scoreText = attempt?.score != null && attempt?.total != null
                ? `${attempt.score}/${attempt.total}`
                : null;
            const accuracyText = attempt?.score != null && attempt?.total
                ? `${Math.round((attempt.score / attempt.total) * 100)}%`
                : null;
            return (<motion.div key={t.id} variants={staggerItem}>
              <Card interactive className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-ink-900 dark:text-ink-50">
                      {t.title}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-ink-600 dark:text-ink-200">
                      {t.questions.length} questions • {t.durationMin} min
                    </div>
                  </div>
                  {scoreText ? (<Badge className="bg-byjus-50 border-byjus-200/70 text-byjus-700 dark:bg-white/10 dark:border-white/10 dark:text-ink-200">
                      Last: {scoreText} {accuracyText ? `(${accuracyText})` : null}
                    </Badge>) : (<Badge>New</Badge>)}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link to={`/app/mock-tests/${t.id}/attempt`}>
                    <Button className="h-10 w-full rounded-2xl">
                      <PlayCircle className="h-4 w-4"/> Start
                    </Button>
                  </Link>
                  <Link to={`/app/mock-tests/${t.id}/result`}>
                    <Button variant="secondary" className="h-10 w-full rounded-2xl">
                      Result
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>);
        })}
      </motion.div>
    </div>);
}
