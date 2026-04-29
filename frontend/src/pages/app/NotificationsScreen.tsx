import { useMemo } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { useLocalStorageState } from "@/lib/useLocalStorageState";
import { type NotificationItem, starterNotifications } from "@/data/mockData";

export function NotificationsScreen() {
  const [items, setItems] = useLocalStorageState<NotificationItem[]>("neet_notifications_v1", starterNotifications);
  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  return (
    <div className="space-y-4">
      <Reveal>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">Notifications</div>
              <div className="text-sm font-semibold text-ink-600 dark:text-ink-200">
                Updates about live classes, tests, and reminders.
              </div>
            </div>
            <div className="h-10 w-10 rounded-2xl border border-ink-200/70 bg-white/70 grid place-items-center dark:border-white/10 dark:bg-white/10">
              <Bell className="h-5 w-5 text-byjus-500 dark:text-byjus-400" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{unread} unread</Badge>
              <Badge>{items.length} total</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                className="h-10 rounded-2xl"
                onClick={() => setItems((prev) => prev.map((x) => ({ ...x, read: true })))}
                disabled={unread === 0}
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
              <Button variant="ghost" className="h-10 rounded-2xl" onClick={() => setItems([])} disabled={items.length === 0}>
                Clear
              </Button>
            </div>
          </div>
        </Card>
      </Reveal>

      <motion.div className="grid gap-4" variants={staggerContainer} initial="hidden" animate="show">
        {items.length === 0 ? (
          <motion.div variants={staggerItem}>
            <Card className="p-6">
              <div className="text-lg font-extrabold text-ink-900 dark:text-ink-50">You're all caught up</div>
              <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">
                No notifications yet. Restore demo notifications anytime.
              </div>
              <div className="mt-4">
                <Button className="h-11 rounded-2xl" onClick={() => setItems(starterNotifications)}>
                  Restore demo notifications
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          items.map((n) => (
            <motion.div
              key={n.id}
              variants={staggerItem}
              layout
              exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
            >
              <Card interactive className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-extrabold text-ink-900 dark:text-ink-50">{n.title}</div>
                      {!n.read ? (
                        <span className="h-2 w-2 rounded-full bg-byjus-500 dark:bg-byjus-400 shadow-glow" />
                      ) : null}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-ink-600 dark:text-ink-200">{n.body}</div>
                    <div className="mt-2 text-xs font-semibold text-ink-500 dark:text-ink-300">{n.createdAt}</div>
                  </div>
                  <Button
                    variant="ghost"
                    className="h-10 rounded-2xl"
                    onClick={() =>
                      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
                    }
                  >
                    Mark read
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
