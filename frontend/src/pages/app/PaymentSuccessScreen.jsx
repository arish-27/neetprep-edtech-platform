import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
export function PaymentSuccessScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get("course_id");
    useEffect(() => {
        // Confetti or celebration animation could go here
    }, []);
    return (<div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
      <Reveal>
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 grid place-items-center mb-6">
            <CheckCircle className="h-12 w-12 text-emerald-400"/>
          </div>

          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50 mb-3">
            Payment Successful!
          </h1>

          <p className="text-sm font-semibold text-ink-600 dark:text-ink-200 mb-8">
            Your course has been purchased successfully. You can now access all the lessons and quizzes.
          </p>

          <div className="space-y-3">
            <Button className="w-full h-12 rounded-2xl" onClick={() => navigate("/app/subjects")}>
              Start Learning
              <ArrowRight className="h-4 w-4"/>
            </Button>

            <Button variant="secondary" className="w-full h-12 rounded-2xl" onClick={() => navigate("/app/payments")}>
              View Payment History
            </Button>
          </div>
        </Card>
      </Reveal>
    </div>);
}
