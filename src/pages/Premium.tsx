import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

/**
 * Resuvibe Premium landing / upgrade page. This is a review-only stub — the
 * "Pay for Resuvibe Premium" CTA is a visual placeholder for a future payment
 * services integration and does not process any transaction.
 */
export default function Premium() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const benefits: { title: string; body: string }[] = [
    {
      title: "Unlimited Interview Prep",
      body: "Practice role-tailored interviews across every application you create, grounded in your resume and the specific job description.",
    },
    {
      title: "AI feedback on every answer",
      body: "Get scored, dimension-by-dimension feedback on each attempt so you can iterate toward a stronger response.",
    },
    {
      title: "Retry to improve",
      body: "Re-answer any question as many times as you need — your best attempt is what counts.",
    },
    {
      title: "Resume-grounded, job-specific questions",
      body: "The final questions in every set map your own experience to the organization's stated needs.",
    },
  ];

  function handlePay() {
    toast({
      title: "Payments coming soon",
      description:
        "This is a placeholder for the upcoming payment integration. No charge has been made.",
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Upgrade to Resuvibe Premium
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Resuvibe Premium unlocks unlimited, role-tailored Interview Prep across
            every application you create — with AI feedback on each answer and
            unlimited retries so you can walk into your next interview prepared.
          </p>

          <ul className="space-y-3">
            {benefits.map((b) => (
              <li key={b.title} className="flex gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="text-sm font-medium">{b.title}</div>
                  <p className="text-sm text-muted-foreground">{b.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePay}>
              <Sparkles className="mr-2 h-4 w-4" /> Pay for Resuvibe Premium
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Payments are not yet integrated. This button is a placeholder for the
            upcoming payment services integration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
