import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Info } from "lucide-react";
import { AudioDictationControl } from "@/components/interviewPrep/AudioDictationControl";
import { BrowserDictationControl } from "@/components/interviewPrep/BrowserDictationControl";

/**
 * Standalone TEST page for the new audio-dictation input on Interview Prep.
 * Reproduces the answer UX with sample questions so the dictation flow can be
 * evaluated in isolation — the real Interview Prep tab (ApplicationDetail) is
 * left completely untouched. Reachable at /interview-prep-audio-test.
 */
const SAMPLE_QUESTIONS = [
  {
    competency: "Stakeholder alignment",
    modality: "situational",
    question:
      "A partner team keeps missing commitments that block your launch. How would you handle it?",
  },
  {
    competency: "Delivery ownership",
    modality: "behavioral",
    question:
      "Tell me about a time you owned a project end-to-end under a tight deadline.",
  },
  {
    competency: "Technical judgment",
    modality: "cognitive-task",
    question: "Walk me through how you'd design a system to handle 1M concurrent users.",
  },
];

export default function InterviewPrepAudioTest() {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const q = SAMPLE_QUESTIONS[index];

  const appendTranscript = (text: string) =>
    setAnswer((a) => (a.trim() ? a.trim() + " " : "") + text);

  const next = () => {
    setIndex((n) => (n + 1) % SAMPLE_QUESTIONS.length);
    setAnswer("");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">
          Interview Prep — audio dictation (test)
        </h1>
        <p className="text-sm text-muted-foreground">
          A standalone preview of voice input for answering interview questions. The
          live Interview Prep page is unaffected.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          <strong>On-device</strong> dictation works instantly in Chrome/Edge/Safari —
          no setup. The <strong>universal</strong> path records audio (works in every
          browser incl. Firefox) and transcribes server-side via the{" "}
          <code>transcribe-answer</code> edge function — deploy it (see{" "}
          <code>LOVABLE_HANDOFF.md</code>) for live transcripts. Audio is not stored.
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question {index + 1} of {SAMPLE_QUESTIONS.length}
          </span>
          <Badge variant="outline">{q.modality}</Badge>
        </div>
        <Progress value={((index + 1) / SAMPLE_QUESTIONS.length) * 100} className="h-1.5" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{q.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Assessing: {q.competency}</p>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer… or use dictation"
            rows={7}
          />
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  On-device · instant
                </p>
                <BrowserDictationControl onTranscript={appendTranscript} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Universal · server (needs deploy)
                </p>
                <AudioDictationControl onTranscript={appendTranscript} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={next} variant="outline">
              Next question <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
