import { useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { BrowserDictationControl } from "@/components/interviewPrep/BrowserDictationControl";
import { Loader2, Lock, RotateCcw, ArrowRight, Sparkles, Check, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  interviewReducer,
  initialState,
} from "@/lib/interviewPrep/interviewMachine";
import { overallScore, countedAttemptIds } from "@/lib/interviewPrep/bestAttempt";
import { decideEntitlement, type GateDecision } from "@/lib/interviewPrep/entitlement";
import type { InterviewQuestion, TurnAttempt } from "@/lib/interviewPrep/types";
import {
  getInterviewEntitlement,
  startInterviewSession,
  generateInterviewPlan,
  scoreInterviewAnswer,
  type InterviewPlan,
} from "@/lib/api/interviewPrep";

type Phase = "loading" | "paywall" | "plan" | "interview" | "trial-upsell" | "complete" | "error";

/**
 * Interview Prep tab. Reached only when the tab is unlocked (a resume exists —
 * enforced by InterviewPrepTabTrigger), so the JD + tailored resume grounding
 * is guaranteed. Server-side entitlement + trial claim happen in
 * start-interview-session; this renders the paywall when the server says the
 * user is out of entitlement.
 */
export function InterviewPrepTab({
  applicationId,
  app,
}: {
  applicationId: string;
  app: { company_name?: string | null };
}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [plan, setPlan] = useState<InterviewPlan | null>(null);
  const [decision, setDecision] = useState<GateDecision | null>(null);
  const [state, dispatch] = useReducer(interviewReducer, initialState);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);

  /** True when this is a free-tier user on their one free trial. */
  const isTrial = decision?.kind === "claim";
  /** Maximum answer attempts allowed on the first question during the free trial. */
  const TRIAL_MAX_ATTEMPTS = 5;

  // On open: READ-ONLY entitlement check → plan. No trial is claimed and no
  // session is created here — that only happens when the user clicks "Begin"
  // (so merely opening the tab never spends the free trial).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const entitlement = await getInterviewEntitlement();
        if (cancelled) return;
        const d = decideEntitlement(entitlement, applicationId);
        setDecision(d);
        if (d.kind === "paywall") {
          setPhase("paywall");
          return;
        }
        const p = await generateInterviewPlan(applicationId);
        if (cancelled) return;
        setPlan(p);
        if (p.stale) {
          toast({
            title: "Questions refreshed",
            description: "Your resume or job description changed, so we regenerated the questions.",
          });
        }
        setPhase("plan");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "Something went wrong.");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId, toast]);

  // Commit point: claim the trial (server-side, atomic) + create the session,
  // then start the interview. This is where the free trial is actually spent.
  async function handleBegin() {
    if (!plan) return;
    setStarting(true);
    try {
      const session = await startInterviewSession(applicationId);
      if (!session.allowed) {
        setPhase("paywall");
        return;
      }
      setSessionId(session.sessionId ?? null);
      dispatch({ type: "START", questions: plan.questions });
      setPhase("interview");
    } catch (e) {
      toast({
        title: "Couldn't start the interview",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setStarting(false);
    }
  }

  // Mirror the reducer's completion into the local phase.
  useEffect(() => {
    if (state.status === "complete") setPhase("complete");
  }, [state.status]);

  const currentQuestion: InterviewQuestion | undefined =
    state.questions[state.currentIndex];

  async function handleSubmit() {
    if (!sessionId || !currentQuestion || answer.trim().length === 0) return;
    setSubmitting(true);
    try {
      const priorForQuestion = state.attempts.filter(
        (a) => a.questionId === currentQuestion.id,
      );
      const attemptNumber = priorForQuestion.length + 1;
      const priorTurnId =
        priorForQuestion[priorForQuestion.length - 1]?.id;
      const result = await scoreInterviewAnswer({
        sessionId,
        questionId: currentQuestion.id,
        answerText: answer.trim(),
        attemptNumber,
        priorTurnId,
      });
      dispatch({ type: "ANSWER_SCORED", attempt: result.turn, feedback: result.feedback });
      setAnswer("");
    } catch (e) {
      toast({
        title: "Couldn't score that answer",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing your interview…
      </div>
    );
  }

  if (phase === "error") {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <p className="text-muted-foreground">{errorMsg}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "paywall") {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> Interview Prep is a premium feature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You've used your one free interview. Upgrade to practice unlimited
            role-tailored interviews across all your applications, with instant
            AI feedback on every answer.
          </p>
          <Button disabled title="Billing coming soon">
            <Sparkles className="mr-2 h-4 w-4" /> Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "plan" && plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your interview plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Based on your resume and this job description, we'll ask{" "}
            <strong>{plan.questions.length} questions</strong> tailored to a{" "}
            <strong>{plan.roleType}</strong> role. You can retry any answer to
            improve it — your best attempt is what counts.
          </p>
          {plan.competencies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {plan.competencies.map((c) => (
                <Badge key={c} variant="secondary">{c}</Badge>
              ))}
            </div>
          )}
          {isTrial && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" /> A Resuvibe Premium feature — free to try
              </div>
              <p className="text-xs text-muted-foreground">
                Interview Prep is part of Resuvibe Premium. Try it now for free — you'll get
                the first question with up to {TRIAL_MAX_ATTEMPTS} attempts to refine your
                answer with AI feedback. Upgrade any time to unlock the full interview.
              </p>
            </div>
          )}
          <Button onClick={handleBegin} disabled={starting}>
            {starting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting…</>
            ) : isTrial ? (
              <>Try Interview Prep now for free! <ArrowRight className="ml-2 h-4 w-4" /></>
            ) : (
              <>Begin interview <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "complete") {
    const counted = countedAttemptIds(state.attempts);
    const bestByQuestion = state.questions.map((q) => {
      const best = state.attempts.find((a) => counted.has(a.id) && a.questionId === q.id);
      return { q, best };
    });
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interview complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-3xl font-bold">{overallScore(state.attempts)}<span className="text-lg text-muted-foreground">/100</span></div>
            <p className="text-sm text-muted-foreground">Overall score (best attempt per question)</p>
          </div>
          <div className="space-y-2">
            {bestByQuestion.map(({ q, best }) => (
              <div key={q.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span className="truncate pr-3">{q.competency}</span>
                <Badge variant={best && best.score >= 70 ? "default" : "secondary"}>
                  {best ? best.score : "—"}
                </Badge>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => { dispatch({ type: "RESET" }); setAnswer(""); setPhase("plan"); }}>
            <RotateCcw className="mr-2 h-4 w-4" /> Practice again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "trial-upsell") {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Continue with Resuvibe Premium
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nice work — you've completed the free preview of Interview Prep. To
            continue with the rest of your tailored interview (plus unlimited
            practice across every application), sign up for Resuvibe Premium.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/premium")}>
              <Sparkles className="mr-2 h-4 w-4" /> Sign up for Resuvibe Premium
            </Button>
            <Button variant="outline" onClick={() => setPhase("interview")}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // phase === "interview"
  if (!currentQuestion) return null;
  const answeredQuestionIds = new Set(state.attempts.map((a) => a.questionId));
  const currentQuestionAttempts = state.attempts.filter(
    (a) => a.questionId === currentQuestion.id,
  );
  const trialAttemptsExhausted =
    isTrial && state.currentIndex === 0 && currentQuestionAttempts.length >= TRIAL_MAX_ATTEMPTS;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">
          <span>Question {state.currentIndex + 1} of {state.questions.length}</span>
          {isTrial && state.currentIndex === 0 && (
            <span className="ml-2 text-primary">
              · Free preview · Attempt {Math.min(currentQuestionAttempts.length, TRIAL_MAX_ATTEMPTS)}/{TRIAL_MAX_ATTEMPTS}
            </span>
          )}
        </div>
        <SubwayProgress
          total={state.questions.length}
          currentIndex={state.currentIndex}
          answeredIndices={
            new Set(
              state.questions
                .map((q, i) => (answeredQuestionIds.has(q.id) ? i : -1))
                .filter((i) => i >= 0),
            )
          }
          onJump={(i) => dispatch({ type: "JUMP_TO_QUESTION", index: i })}
        />
      </div>

      <Card>
        <CardHeader>
          <p className="text-base font-normal text-card-foreground">{currentQuestion.question}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Assessing: {currentQuestion.competency}
            {currentQuestion.leadershipPrinciple ? ` · ${currentQuestion.leadershipPrinciple}` : ""}
          </p>

          {state.awaitingChoice ? (
            <ReviewPanel
              questionAttempts={currentQuestionAttempts}
              fallbackFeedback={state.currentFeedback}
              hideRetry={trialAttemptsExhausted}
              retryHint={
                trialAttemptsExhausted
                  ? `You've used all ${TRIAL_MAX_ATTEMPTS} free attempts for this question.`
                  : undefined
              }
              onRetry={(prefill) => {
                setAnswer(prefill);
                dispatch({ type: "RETRY_QUESTION" });
              }}
              onNext={() => {
                if (isTrial && state.currentIndex === 0) {
                  setPhase("trial-upsell");
                  return;
                }
                dispatch({ type: "NEXT_QUESTION" });
              }}
            />
          ) : (
            <>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer…"
                rows={7}
                disabled={submitting}
              />
              <div className="flex flex-wrap items-start gap-2">
                <BrowserDictationControl
                  className="h-10 self-center"
                  containerClassName="self-start"
                  onTranscript={(t) => setAnswer((a) => appendDictationChunk(a, t))}
                />
                <Button className="h-10 self-start" onClick={handleSubmit} disabled={submitting || answer.trim().length === 0}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scoring…</> : "Submit answer"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Review panel shown after a question has been scored or when the user
 * navigates back to a previously answered question. Renders the (final)
 * answer in a read-only textarea, a row of "Answer #N" links to browse
 * earlier attempts, and the feedback the system produced for whichever
 * attempt is currently selected.
 */
function ReviewPanel({
  questionAttempts,
  fallbackFeedback,
  hideRetry = false,
  retryHint,
  onRetry,
  onNext,
}: {
  questionAttempts: TurnAttempt[];
  fallbackFeedback: import("@/lib/interviewPrep/types").Feedback | null;
  hideRetry?: boolean;
  retryHint?: string;
  onRetry: (prefill: string) => void;
  onNext: () => void;
}) {
  const latest = questionAttempts[questionAttempts.length - 1];
  const [viewingId, setViewingId] = useState<string | null>(null);

  // Reset the selection whenever the set of attempts for the current
  // question changes (e.g. the user navigated to a different question).
  useEffect(() => {
    setViewingId(latest?.id ?? null);
  }, [latest?.id, questionAttempts.length]);

  const viewing =
    questionAttempts.find((a) => a.id === viewingId) ?? latest;
  const viewingFeedback = viewing?.feedback ?? fallbackFeedback;

  if (!viewing) return null;

  return (
    <div className="space-y-3">
      <Textarea value={viewing.answerText} readOnly rows={7} />
      {questionAttempts.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-xs text-muted-foreground">Attempts:</span>
          {questionAttempts.map((a, i) => {
            const isActive = a.id === viewing.id;
            return (
              <span key={a.id} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground">|</span>}
                <button
                  type="button"
                  onClick={() => setViewingId(a.id)}
                  className={`underline-offset-2 hover:underline ${
                    isActive ? "font-semibold text-primary underline" : "text-primary/80"
                  }`}
                >
                  Answer #{i + 1}
                </button>
              </span>
            );
          })}
        </div>
      )}
      {viewingFeedback && <FeedbackView feedback={viewingFeedback} />}
      {retryHint && (
        <p className="text-xs text-muted-foreground">{retryHint}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {!hideRetry && (
          <Button
            variant="outline"
            onClick={() => onRetry(latest.answerText)}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Try Responding Again
          </Button>
        )}
        <Button onClick={onNext}>
          Next Question <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function FeedbackView({ feedback }: { feedback: import("@/lib/interviewPrep/types").Feedback }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Feedback</span>
        <Badge>{feedback.overallScore}/100</Badge>
      </div>
      {feedback.dimensions.length > 0 && (
        <div className="space-y-1.5">
          {feedback.dimensions.map((d) => (
            <div key={d.name} className="text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">{d.name}</span>
                <span className="text-muted-foreground">{d.quality} · {d.score}/5</span>
              </div>
              <p className="text-muted-foreground">{d.feedback}</p>
            </div>
          ))}
        </div>
      )}
      {feedback.suggestions.length > 0 && (
        <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
          {feedback.suggestions.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      )}
    </div>
  );
}

/**
 * Subway-stop style progress indicator. Each stop is a question; answered
 * stops are clickable (jump back to review/revise), unanswered stops are
 * inert. The current stop is emphasized with a ring.
 */
function SubwayProgress({
  total,
  currentIndex,
  answeredIndices,
  onJump,
}: {
  total: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  onJump: (index: number) => void;
}) {
  return (
    <ol className="flex items-center gap-0 py-1" aria-label="Interview progress">
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === currentIndex;
        const isAnswered = answeredIndices.has(i);
        const canJump = isAnswered && !isCurrent;
        const stopClasses = [
          "flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors",
          isCurrent
            ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/30"
            : isAnswered
              ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
              : "border-muted-foreground/30 bg-background text-muted-foreground",
          canJump ? "cursor-pointer" : "cursor-default",
        ].join(" ");
        const label = `Question ${i + 1}${isAnswered ? " (answered)" : ""}${isCurrent ? " (current)" : ""}`;
        return (
          <li key={i} className="flex flex-1 items-center last:flex-none">
            {canJump ? (
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-label={`Go back to ${label}`}
                className={stopClasses}
              >
                {isAnswered ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </button>
            ) : (
              <span aria-label={label} className={stopClasses}>
                {isCurrent ? (
                  i + 1
                ) : isAnswered ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-2 w-2 fill-current" />
                )}
              </span>
            )}
            {i < total - 1 && (
              <div
                className={`h-0.5 flex-1 ${
                  answeredIndices.has(i) && (answeredIndices.has(i + 1) || i + 1 === currentIndex)
                    ? "bg-primary/60"
                    : "bg-muted-foreground/20"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
