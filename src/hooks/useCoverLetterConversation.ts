import { useState, useMemo, useCallback } from "react";
import {
  CLMessage,
  CLPhase,
  CoverLetterContext,
  CL_ACKNOWLEDGMENTS,
  CL_SYNTHESIS_TEXT,
  buildWelcomeMessage,
  buildCoverLetterQuestions,
} from "@/lib/coverLetterAgentPrompts";

function randomAck(): string {
  return CL_ACKNOWLEDGMENTS[Math.floor(Math.random() * CL_ACKNOWLEDGMENTS.length)];
}

/**
 * Short conversational state machine for the cover letter agent. Asks a fixed
 * set of context-aware questions one at a time, then transitions to a
 * synthesis phase that surfaces the "Write my cover letter" CTA.
 */
export function useCoverLetterConversation(ctx: CoverLetterContext) {
  const questions = useMemo(() => buildCoverLetterQuestions(ctx), [ctx]);

  const [messages, setMessages] = useState<CLMessage[]>(() => [
    {
      id: "cl-welcome",
      role: "agent",
      content: buildWelcomeMessage(ctx),
      timestamp: new Date(),
    },
    {
      id: "cl-q1",
      role: "agent",
      content: questions[0],
      timestamp: new Date(),
    },
  ]);

  // Index of the question currently awaiting an answer.
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [phase, setPhase] = useState<CLPhase>("asking");
  const [isLoading, setIsLoading] = useState(false);

  const addClientMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || phase !== "asking") return;
      setIsLoading(true);
      try {
        setMessages((prev) => [
          ...prev,
          { id: `cl-c-${Date.now()}`, role: "client", content, timestamp: new Date() },
        ]);

        const newAnswers = [...answers, content];
        setAnswers(newAnswers);

        await new Promise((r) => setTimeout(r, 700));

        const ack = randomAck();
        const nextIdx = step + 1;

        if (nextIdx < questions.length) {
          setMessages((prev) => [
            ...prev,
            {
              id: `cl-a-${Date.now()}`,
              role: "agent",
              content: `${ack}\n\n${questions[nextIdx]}`,
              timestamp: new Date(),
            },
          ]);
          setStep(nextIdx);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `cl-a-${Date.now()}`,
              role: "agent",
              content: CL_SYNTHESIS_TEXT,
              timestamp: new Date(),
            },
          ]);
          setPhase("synthesis");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [answers, step, questions, phase]
  );

  const exportData = useCallback(
    () => ({ questions, answers }),
    [questions, answers]
  );

  return { messages, phase, isLoading, addClientMessage, exportData };
}
