/**
 * Cover Letter Agent — prompts & question library.
 *
 * A short, guided elicitation (≤5 questions) that produces a concise cover
 * letter. Because the agent runs after the resume creation flow, it already
 * knows the candidate's background; it only needs to gather the few things a
 * good cover letter adds. Question wording adapts to whether the user is
 * targeting a specific job or writing a generic letter.
 */

export interface CoverLetterContext {
  /** True when the resume flow indicated a specific role/job to target. */
  hasSpecificJob: boolean;
  /** The target role/title, when known (e.g. "Customer Success Coordinator"). */
  jobTitle?: string;
  /** The target employer, when known (rare for first-time resumes). */
  companyName?: string;
}

export interface CLMessage {
  id: string;
  role: "agent" | "client";
  content: string;
  timestamp: Date;
}

export type CLPhase = "asking" | "synthesis" | "complete";

export const CL_ACKNOWLEDGMENTS = [
  "Got it.",
  "Thanks for that.",
  "Great.",
  "Perfect.",
  "Noted.",
  "Understood.",
];

export function buildWelcomeMessage(_ctx: CoverLetterContext): string {
  return "You haven't created a cover letter yet. Would you like to?\n\nI already know your background from your resume, so this will be quick — just a few short questions.";
}

/**
 * The ordered list of questions to ask. Kept to four so the conversation stays
 * short (the brief asks for a short, concise cover letter), within the 5-question
 * ceiling. Wording shifts between a specific-job and a generic letter.
 */
export function buildCoverLetterQuestions(ctx: CoverLetterContext): string[] {
  const role = ctx.jobTitle?.trim();
  const company = ctx.companyName?.trim();

  if (ctx.hasSpecificJob) {
    const at = company ? ` at ${company}` : "";
    const target = role ? `the ${role} role${at}` : "this role";
    return [
      `Question 1 of 4: Why are you interested in ${target}?`,
      "Question 2 of 4: What's one accomplishment or experience that makes you a strong fit for this position?",
      "Question 3 of 4: Is there anything specific you'd like me to emphasize or make sure to mention?",
      "Question 4 of 4: What tone should the letter have — professional, warm, or enthusiastic?",
    ];
  }

  return [
    "Question 1 of 4: Since there's no specific job yet, what kind of role or type of work is this cover letter for?",
    "Question 2 of 4: Why are you drawn to this kind of work?",
    "Question 3 of 4: What's one strength or accomplishment you'd most want an employer to know about?",
    "Question 4 of 4: What tone should the letter have — professional, warm, or enthusiastic?",
  ];
}

export const CL_SYNTHESIS_TEXT =
  "Perfect — I have everything I need to write your cover letter. Ready when you are!";

/** Strip the "Question N of M:" prefix so answers read cleanly in the prompt. */
export function stripQuestionNumber(q: string): string {
  return q.replace(/^Question\s+\d+\s+of\s+\d+:\s*/i, "").trim();
}
