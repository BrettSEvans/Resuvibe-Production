import { useState, useRef, useEffect } from "react";
import { Send, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmploymentCounselorConversation } from "@/hooks/useEmploymentCounselorConversation";
import { toast } from "sonner";

interface EmploymentCounselorAgentProps {
  onComplete?: (data: ReturnType<ReturnType<typeof useEmploymentCounselorConversation>["exportConversationData"]>) => void;
}

export function EmploymentCounselorAgent({
  onComplete,
}: EmploymentCounselorAgentProps) {
  const [clientInput, setClientInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    conversationState,
    isLoading,
    addClientMessage,
    exportConversationData,
  } = useEmploymentCounselorConversation();

  const isConversationComplete = conversationState.phase === "complete";
  const isSynthesisPhase = conversationState.phase === "synthesis";

  // Auto-scroll: keep the latest chat message visible within the card
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Focus input field
  useEffect(() => {
    if (!isLoading && !isConversationComplete) {
      inputRef.current?.focus();
    }
  }, [isLoading, isConversationComplete]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInput.trim() || isLoading) return;

    try {
      await addClientMessage(clientInput);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setClientInput("");
    }
  };

  const handleComplete = () => {
    const data = exportConversationData();
    if (onComplete) {
      onComplete(data);
    } else {
      toast.success("Resume building session saved!");
    }
  };

  const phaseLabels = {
    welcome: "Getting Started",
    q1_contact: "Question 1 of 10",
    q2_job_listing: "Question 2 of 10",
    q3_responsibilities: "Question 3 of 10",
    q4_achievements: "Question 4 of 10",
    q5_skills: "Question 5 of 10",
    q6_impact: "Question 6 of 10",
    q7_additional: "Question 7 of 10",
    q8_strengths: "Question 8 of 10",
    q9_workstyle: "Question 9 of 10",
    q10_interests: "Question 10 of 10",
    synthesis: "Building Your Resume",
    complete: "Complete",
  };

  // Progress based on question number (10 questions + synthesis + complete = 12 phases)
  const phaseOrder = [
    "welcome",
    "q1_contact",
    "q2_job_listing",
    "q3_responsibilities",
    "q4_achievements",
    "q5_skills",
    "q6_impact",
    "q7_additional",
    "q8_strengths",
    "q9_workstyle",
    "q10_interests",
    "synthesis",
    "complete",
  ];
  const currentPhaseIndex = phaseOrder.indexOf(conversationState.phase);
  const progressPercent = Math.round(
    ((currentPhaseIndex + 1) / phaseOrder.length) * 100
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {phaseLabels[conversationState.phase]}
          </h3>
          <span className="text-xs text-muted-foreground">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Message Thread */}
      <Card className="min-h-96 max-h-96 overflow-y-auto border-border">
        <CardContent className="p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "counselor" ? "justify-start" : "justify-end"
              }`}
            >
              {message.role === "counselor" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">EC</span>
                </div>
              )}

              <div
                className={`max-w-sm px-4 py-2 rounded-lg ${
                  message.role === "counselor"
                    ? "bg-muted text-foreground rounded-tl-none"
                    : "bg-primary text-primary-foreground rounded-tr-none"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">EC</span>
              </div>
              <div className="bg-muted px-4 py-3 rounded-lg rounded-tl-none">
                <div className="flex gap-2 items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Counselor is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Build My Resume CTA — shown after synthesis message */}
      {isSynthesisPhase && (
        <div ref={formRef}>
          <Button
            type="button"
            onClick={handleComplete}
            className="w-full gap-2"
            size="lg"
          >
            <ArrowRight className="h-4 w-4" />
            Build My Resume
          </Button>
        </div>
      )}

      {/* Input Form — shown during active Q&A */}
      {!isConversationComplete && !isSynthesisPhase && (
        <form ref={formRef} onSubmit={handleSendMessage} className="space-y-3">
          <textarea
            ref={inputRef}
            value={clientInput}
            onChange={(e) => setClientInput(e.target.value)}
            placeholder="Share your experience here..."
            disabled={isLoading}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />

          <Button
            type="submit"
            disabled={!clientInput.trim() || isLoading}
            className="w-full gap-2"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Share Your Experience
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Be as detailed as you'd like. The more you share, the better I can
            help uncover your professional value.
          </p>
        </form>
      )}

      {/* Skills Summary Sidebar */}
      {conversationState.discoveredSkills.length > 0 && (
        <Card className="bg-muted/30 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Skills Discovered So Far</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {conversationState.discoveredSkills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                >
                  {skill}
                </span>
              ))}
              {conversationState.discoveredSkills.length > 6 && (
                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">
                  +{conversationState.discoveredSkills.length - 6} more
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
