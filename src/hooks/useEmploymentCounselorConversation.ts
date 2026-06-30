import { useState, useCallback, useRef } from "react";
import {
  Message,
  ConversationState,
  ConversationPhase,
  FollowUpQuestion,
  TargetProfile,
  FOLLOW_UP_QUESTIONS,
  WELCOME_MESSAGE,
  ELICITATION_QUESTIONS,
  SKILL_EXTRACTION_KEYWORDS,
  inferTargetProfile,
  buildSkillsQuestion,
  detectCompetencyGap,
} from "@/lib/employmentCounselorPrompts";

const SYNTHESIS_TEXT =
  "Perfect! I now have everything I need to create your first resume. You've done great! ✓\n\nLet me show you what I've learned about you as a professional...\n\nAre you ready to build your resume?";

const ACKNOWLEDGMENTS = [
  "Got it.",
  "Thanks for sharing that.",
  "That's helpful.",
  "Great, noted.",
  "Appreciate that.",
  "Perfect.",
  "Understood.",
];

function randomAck(): string {
  return ACKNOWLEDGMENTS[Math.floor(Math.random() * ACKNOWLEDGMENTS.length)];
}

/**
 * Detect whether the user's answer to a main question warrants follow-up
 * questions about dates, employer names, or institution names.
 *
 * Phase "q2_job_listing"  → user just answered Q3 (responsibilities)
 * Phase "q6_impact"      → user just answered Q7 (education/background)
 */
function detectFollowUps(
  phase: ConversationPhase,
  response: string
): FollowUpQuestion[] {
  const lower = response.toLowerCase();
  const followUps: FollowUpQuestion[] = [];

  if (phase === "q2_job_listing") {
    const JOB_PATTERNS = [
      /\bwork(?:ed|ing)?\b/,
      /\bjob\b/,
      /\bemployed\b/,
      /\bemployer\b/,
      /\bposition\b/,
      /\bcompany\b/,
      /\bstore\b/,
      /\brestaurant\b/,
      /\bhospital\b/,
      /\boffice\b/,
      /\bboss\b/,
      /\bpart.?time\b/,
      /\bfull.?time\b/,
    ];
    if (JOB_PATTERNS.some((p) => p.test(lower))) {
      followUps.push({
        id: "employer_name_dates",
        question: FOLLOW_UP_QUESTIONS.employer_name_dates,
      });
    }
  }

  if (phase === "q6_impact") {
    const EDU_PATTERNS = [
      /\bschool\b/,
      /\bcollege\b/,
      /\buniversity\b/,
      /\bdegree\b/,
      /\bdiploma\b/,
      /\bged\b/,
      /\bcertificate\b/,
      /\btraining\b/,
      /\bcourse(?:s|work)?\b/,
      /\bclass(?:es)?\b/,
      /\bgraduat\w+\b/,
      /\bstudied?\b/,
      /\bassociate\b/,
    ];
    if (EDU_PATTERNS.some((p) => p.test(lower))) {
      followUps.push({
        id: "education_institution_dates",
        question: FOLLOW_UP_QUESTIONS.education_institution_dates,
      });
    }

    const VOL_PATTERNS = [
      /\bvolunteer\w*\b/,
      /\bfood bank\b/,
      /\bcharity\b/,
      /\bnonprofit\b/,
      /\bcommunity service\b/,
    ];
    if (VOL_PATTERNS.some((p) => p.test(lower))) {
      followUps.push({
        id: "volunteer_org_dates",
        question: FOLLOW_UP_QUESTIONS.volunteer_org_dates,
      });
    }
  }

  return followUps;
}

export function useEmploymentCounselorConversation() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "counselor",
      content: WELCOME_MESSAGE,
      timestamp: new Date(),
    },
    {
      id: "counselor-q1",
      role: "counselor",
      content: ELICITATION_QUESTIONS.contact[0],
      timestamp: new Date(),
    },
  ]);

  const [conversationState, setConversationState] = useState<ConversationState>(
    {
      phase: "welcome",
      messageCount: 2,
      exchangeCount: 0,
      discoveredSkills: [],
      discoveredSoftSkills: [],
      narrativeExcerpts: [],
      resumeBulletPoints: [],
      followUpQueue: [],
      followUpData: {},
      mainAnswers: [],
      targetProfile: null,
    }
  );

  const [isLoading, setIsLoading] = useState(false);
  const conversationIdRef = useRef<string>(`counselor-${Date.now()}`);

  const extractSkillsFromResponse = useCallback(
    (response: string): string[] => {
      const lowerResponse = response.toLowerCase();
      const foundSkills: string[] = [];
      Object.entries(SKILL_EXTRACTION_KEYWORDS).forEach(([skill, keywords]) => {
        if (keywords.some((kw) => lowerResponse.includes(kw.toLowerCase()))) {
          foundSkills.push(skill.replace(/([A-Z])/g, " $1").trim());
        }
      });
      return Array.from(new Set(foundSkills));
    },
    []
  );

  const getNextPhase = useCallback(
    (currentPhase: ConversationPhase): ConversationPhase => {
      const phases: ConversationPhase[] = [
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
      const idx = phases.indexOf(currentPhase);
      return idx < phases.length - 1 ? phases[idx + 1] : "complete";
    },
    []
  );

  const getCounselorQuestion = useCallback(
    (phase: ConversationPhase, profile: TargetProfile | null): string => {
      const phaseToQuestion: Record<ConversationPhase, string> = {
        welcome: "",
        q1_contact: ELICITATION_QUESTIONS.jobListing[0],
        q2_job_listing: ELICITATION_QUESTIONS.responsibilities[0],
        q3_responsibilities: ELICITATION_QUESTIONS.achievements[0],
        // The skills question (Q5) is re-skinned with role-relevant examples
        // when a target profile was inferred from the Q2 job listing.
        q4_achievements: buildSkillsQuestion(profile),
        q5_skills: ELICITATION_QUESTIONS.impact[0],
        q6_impact: ELICITATION_QUESTIONS.additional[0],
        q7_additional: ELICITATION_QUESTIONS.strengths[0],
        q8_strengths: ELICITATION_QUESTIONS.workStyle[0],
        q9_workstyle: ELICITATION_QUESTIONS.interests[0],
        q10_interests: "",
        synthesis: "",
        complete: "",
      };
      return phaseToQuestion[phase] ?? "";
    },
    []
  );

  const addClientMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      setIsLoading(true);

      try {
        // Snapshot state before any async work
        const currentPhase = conversationState.phase;
        const currentFollowUpQueue = conversationState.followUpQueue;
        const currentFollowUpData = conversationState.followUpData;
        const currentMainAnswers = conversationState.mainAnswers;
        const currentProfile = conversationState.targetProfile;

        // If the user just answered Q2 (job listing), infer the target profile.
        // state.phase === "q1_contact" means the displayed/answered question is Q2.
        const finalProfile =
          currentPhase === "q1_contact"
            ? inferTargetProfile(content)
            : currentProfile;

        const clientMessage: Message = {
          id: `client-${Date.now()}`,
          role: "client",
          content,
          timestamp: new Date(),
          extractedSkills: extractSkillsFromResponse(content),
        };
        setMessages((prev) => [...prev, clientMessage]);

        await new Promise((resolve) => setTimeout(resolve, 800));

        const foundSkills = extractSkillsFromResponse(content);
        const ack = randomAck();

        let counselorResponse = "";
        let finalPhase = currentPhase;
        let finalFollowUpQueue = currentFollowUpQueue;
        let finalFollowUpData = currentFollowUpData;
        let finalMainAnswers = currentMainAnswers;

        if (currentFollowUpQueue.length > 0) {
          // ── Answering a pending follow-up ────────────────────────────────
          const answered = currentFollowUpQueue[0];
          const remaining = currentFollowUpQueue.slice(1);
          finalFollowUpData = { ...currentFollowUpData, [answered.id]: content };

          if (remaining.length > 0) {
            // Still more follow-ups in the queue
            counselorResponse = `${ack}\n\nFollow-up question: ${remaining[0].question}`;
            finalFollowUpQueue = remaining;
            // Phase does not advance during follow-ups
          } else {
            // Follow-ups exhausted — advance to next main question
            finalFollowUpQueue = [];
            const nextPhase = getNextPhase(currentPhase);
            const nextQuestion = getCounselorQuestion(nextPhase, finalProfile);
            if (!nextQuestion) {
              counselorResponse = SYNTHESIS_TEXT;
              finalPhase = "synthesis";
            } else {
              counselorResponse = `${ack}\n\n${nextQuestion}`;
              finalPhase = nextPhase;
            }
          }
        } else {
          // ── Answering a main elicitation question ────────────────────────
          finalMainAnswers = [...currentMainAnswers, content];
          const nextPhase = getNextPhase(currentPhase);
          const detectedFUs = detectFollowUps(currentPhase, content);

          // Role-aware gap check: after the skills answer (Q5), surface one
          // unaddressed competency relevant to the target job, if any.
          // currentPhase === "q4_achievements" means the answered question is Q5.
          if (currentPhase === "q4_achievements") {
            const gap = detectCompetencyGap(finalProfile, finalMainAnswers.join(" "));
            if (gap) detectedFUs.push(gap);
          }

          if (detectedFUs.length > 0) {
            // Queue follow-ups and ask the first one before advancing phase
            counselorResponse = `${ack}\n\nFollow-up question: ${detectedFUs[0].question}`;
            finalFollowUpQueue = detectedFUs;
            // finalPhase stays currentPhase until follow-ups are cleared
          } else {
            finalFollowUpQueue = [];
            const nextQuestion = getCounselorQuestion(nextPhase, finalProfile);
            if (!nextQuestion) {
              counselorResponse = SYNTHESIS_TEXT;
              finalPhase = "synthesis";
            } else {
              counselorResponse = `${ack}\n\n${nextQuestion}`;
              finalPhase = nextPhase;
            }
          }
        }

        const counselorMessage: Message = {
          id: `counselor-${Date.now()}`,
          role: "counselor",
          content: counselorResponse,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, counselorMessage]);

        setConversationState((prev) => ({
          ...prev,
          phase: finalPhase,
          messageCount: prev.messageCount + 2,
          exchangeCount: 0,
          discoveredSkills: Array.from(
            new Set([...prev.discoveredSkills, ...foundSkills])
          ),
          narrativeExcerpts: [
            ...prev.narrativeExcerpts,
            content.substring(0, 200),
          ],
          followUpQueue: finalFollowUpQueue,
          followUpData: finalFollowUpData,
          mainAnswers: finalMainAnswers,
          targetProfile: finalProfile,
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [conversationState, extractSkillsFromResponse, getNextPhase, getCounselorQuestion]
  );

  const generateResumeBulletPoints = useCallback((): string[] => {
    const bullets: string[] = [];
    conversationState.discoveredSkills.forEach((skill) => {
      const examples = conversationState.narrativeExcerpts.slice(0, 2).join(" ");
      if (examples) {
        const actionVerbs = [
          "Demonstrated", "Managed", "Coordinated", "Implemented", "Developed",
        ];
        const verb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
        bullets.push(
          `${verb} ${skill} in managing household and community responsibilities`
        );
      }
    });
    return bullets.slice(0, 5);
  }, [conversationState]);

  const exportConversationData = useCallback(
    () => ({
      conversationId: conversationIdRef.current,
      phase: conversationState.phase,
      discoveredSkills: conversationState.discoveredSkills,
      discoveredSoftSkills: conversationState.discoveredSoftSkills,
      narrativeExcerpts: conversationState.narrativeExcerpts,
      resumeBulletPoints: conversationState.resumeBulletPoints,
      rawMessages: conversationState.mainAnswers,
      followUpData: conversationState.followUpData,
      targetProfile: conversationState.targetProfile,
    }),
    [conversationState]
  );

  return {
    messages,
    conversationState,
    isLoading,
    addClientMessage,
    generateResumeBulletPoints,
    exportConversationData,
  };
}
