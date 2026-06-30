import { useState, useRef, useEffect } from "react";
import { Send, Loader2, PenLine, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCoverLetterConversation } from "@/hooks/useCoverLetterConversation";
import { CoverLetterContext } from "@/lib/coverLetterAgentPrompts";
import { toast } from "sonner";

interface CoverLetterAgentProps {
  context: CoverLetterContext;
  /**
   * Generate the cover letter from the collected answers. Streams chunks via
   * `onDelta`; resolves when complete.
   */
  onGenerate: (
    data: { questions: string[]; answers: string[] },
    onDelta: (chunk: string) => void
  ) => Promise<void>;
}

export function CoverLetterAgent({ context, onGenerate }: CoverLetterAgentProps) {
  const [clientInput, setClientInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, phase, isLoading, addClientMessage, exportData } =
    useCoverLetterConversation(context);

  // Result state — once generation starts, the result replaces the chat.
  const [showResult, setShowResult] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [letter, setLetter] = useState("");
  const [copied, setCopied] = useState(false);

  const isSynthesis = phase === "synthesis";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => {
    if (!isLoading && !isSynthesis && !showResult) inputRef.current?.focus();
  }, [isLoading, isSynthesis, showResult]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientInput.trim() || isLoading) return;
    try {
      await addClientMessage(clientInput);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setClientInput("");
    }
  };

  const handleWrite = async () => {
    setShowResult(true);
    setGenerating(true);
    setLetter("");
    try {
      await onGenerate(exportData(), (chunk) => setLetter((prev) => prev + chunk));
    } catch (err: any) {
      console.error("Cover letter generation failed:", err);
      toast.error("Couldn't generate the cover letter. Please try again.");
      setShowResult(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  };

  // ── Result view (shown in place of the chat) ─────────────────────────────
  if (showResult) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {generating ? "Writing your cover letter…" : "Your cover letter"}
          </h3>
          {!generating && letter && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </div>
        <Card className="border-border">
          <CardContent className="p-6">
            {generating && !letter ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Drafting from your resume and answers…</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {letter}
                {generating && <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse align-middle ml-0.5" />}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Chat view ────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card className="min-h-96 max-h-96 overflow-y-auto border-border">
        <CardContent className="p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "agent" ? "justify-start" : "justify-end"}`}
            >
              {message.role === "agent" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">CL</span>
                </div>
              )}
              <div
                className={`max-w-sm px-4 py-2 rounded-lg ${
                  message.role === "agent"
                    ? "bg-muted text-foreground rounded-tl-none"
                    : "bg-primary text-primary-foreground rounded-tr-none"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">CL</span>
              </div>
              <div className="bg-muted px-4 py-3 rounded-lg rounded-tl-none">
                <div className="flex gap-2 items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Write My Cover Letter CTA — shown after synthesis message */}
      {isSynthesis && (
        <Button type="button" onClick={handleWrite} className="w-full gap-2" size="lg">
          <PenLine className="h-4 w-4" />
          Write My Cover Letter
        </Button>
      )}

      {/* Input form — shown during active Q&A */}
      {!isSynthesis && (
        <form onSubmit={handleSendMessage} className="space-y-3">
          <textarea
            ref={inputRef}
            value={clientInput}
            onChange={(e) => setClientInput(e.target.value)}
            placeholder="Type your answer here…"
            disabled={isLoading}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
          />
          <Button type="submit" disabled={!clientInput.trim() || isLoading} className="w-full gap-2" size="sm">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
