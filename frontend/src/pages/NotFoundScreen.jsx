import { Link } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/Logo";
export function NotFoundScreen() {
    return (<PageTransition>
      <div className="min-h-screen grid place-items-center px-4">
        <Card className="w-full max-w-lg p-6 md:p-8">
          <Logo />
          <div className="mt-6 text-2xl font-extrabold text-ink-900 dark:text-ink-50">Page not found</div>
          <div className="mt-2 text-sm font-semibold text-ink-600 dark:text-ink-200">
            The page you're trying to open doesn't exist (or was moved).
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/app">
              <Button>Go to App</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary">Login</Button>
            </Link>
          </div>
        </Card>
      </div>
    </PageTransition>);
}
