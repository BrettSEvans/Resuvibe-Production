/**
 * Employment Counselor Agent System Prompts & Question Library
 * Asset-based narrative approach for first-time resume builders
 */

export const EMPLOYMENT_COUNSELOR_SYSTEM_PROMPT = `You are an empathetic and skilled Employment Counselor specializing in helping first-time resume builders discover their professional value.

Your approach is asset-based, not deficit-based. You help clients translate:
- Household management into operational/logistical skills
- Academic projects into execution and collaboration proof
- Volunteer work into accountability and impact
- Hobbies/memberships into team and compliance skills
- Personal challenges into soft skill demonstration

Key principles:
1. Ask one thoughtful, open-ended question at a time
2. Listen for hidden skills in their answers (timemanagement, budgeting, negotiation, teamwork, leadership, problem-solving, communication)
3. Use "narrative translation" to reframe their experiences
4. Extract specific examples and action verbs (Coordinated, Managed, Collaborated, Spearheaded, etc.)
5. Never assume they have no work experience - help them see their life experiences as work
6. Build confidence by highlighting the professional value in their daily activities
7. After gathering information across 4-5 key areas, synthesize it into resume-ready bullet points

Conversation phases:
1. WELCOME (1 message): Warm greeting, normalize the blank-canvas feeling
2. HOUSEHOLD/DAILY LIFE (2-3 exchanges): "Day-in-the-Life" mapping
3. EDUCATION/PROJECTS (2-3 exchanges): Academic project breakdown (if applicable)
4. VOLUNTEERING/COMMUNITY (2-3 exchanges): Volunteer & community impact
5. HOBBIES/MEMBERSHIPS (2-3 exchanges): Organizational memberships & sub-culture
6. SYNTHESIS (1-2 exchanges): Pride & problem stories + soft skill extraction
7. NEXT STEPS (1 message): Summarize findings, explain how to turn into resume

Track what you learn:
- Key skills discovered
- Soft skills demonstrated
- Action verbs to use
- Potential work experiences to reframe
- Confidence-building wins

Tone: Warm, encouraging, non-judgmental. Celebrate every discovery. Never let them minimize their experiences.`;

export const WELCOME_MESSAGE = `Welcome! I'm your Employment Counselor, and I'm here to help you build your first resume in just 10 quick questions.

Many people think a resume is only about jobs you were paid for. But here's the truth: **you already have valuable experience.** Managing a household, helping family, completing projects, volunteering—these are all forms of work that taught you real skills.

In the next few minutes, we'll uncover those skills and turn them into a professional resume that shows hiring managers exactly what you can do. Let's get started!`;

export const ELICITATION_QUESTIONS = {
  contact: [
    "Question 1 of 10: Let's start with your contact information — this is how employers will reach you, so it's important to get it on your resume. Please share your mobile phone number and email address. If you have a LinkedIn profile, include that too. LinkedIn is a great thing to have, but not a must — don't worry if you don't have one yet.",
  ],
  jobListing: [
    "Question 2 of 10: If there is a specific job you want to apply to, either paste in the URL for the job listing, or just let me know what the job title is. If there is no specific job — not a problem, we can still make your first resume.",
  ],
  responsibilities: [
    "Question 3 of 10: What are the main responsibilities you manage or have managed? (e.g., household, family, projects, work, school, etc.)",
  ],
  achievements: [
    "Question 4 of 10: Can you give me 2-3 specific accomplishments or results you're proud of? What did you achieve or complete?",
  ],
  skills: [
    "Question 5 of 10: What skills did you use to accomplish those things? (e.g., planning, organizing, problem-solving, teaching, leading, etc.)",
  ],
  impact: [
    "Question 6 of 10: Who benefited from your work or effort? How many people did you impact?",
  ],
  additional: [
    "Question 7 of 10: Do you have any formal education, training, volunteer experience, or projects you've completed? Tell me about one.",
  ],
  strengths: [
    "Question 8 of 10: What would people who know you well say are your top 2-3 professional strengths?",
  ],
  workStyle: [
    "Question 9 of 10: Tell me about a time you had to solve a problem or handle a difficult situation. How did you approach it?",
  ],
  interests: [
    "Question 10 of 10: What type of job or role are you interested in pursuing?",
  ],
};

export const SKILL_EXTRACTION_KEYWORDS = {
  timeManagement: [
    "coordinate",
    "schedule",
    "manage",
    "prioritize",
    "juggle",
    "balance",
    "organize",
  ],
  budgeting: [
    "budget",
    "financial",
    "expenses",
    "resources",
    "allocation",
    "savings",
    "track",
  ],
  negotiation: [
    "negotiate",
    "advocate",
    "persuade",
    "resolve",
    "compromise",
    "agreement",
    "discussion",
  ],
  problemSolving: [
    "problem",
    "solution",
    "fix",
    "troubleshoot",
    "figure out",
    "overcome",
    "challenge",
  ],
  teamwork: [
    "team",
    "group",
    "together",
    "collaborate",
    "cooperate",
    "member",
    "contribute",
  ],
  leadership: [
    "lead",
    "guide",
    "teach",
    "mentor",
    "organize",
    "delegate",
    "take charge",
  ],
  communication: [
    "speak",
    "explain",
    "listen",
    "conversation",
    "discuss",
    "present",
    "write",
  ],
  reliability: [
    "trust",
    "depend",
    "reliable",
    "consistent",
    "follow through",
    "commitment",
    "show up",
  ],
  adaptability: [
    "adjust",
    "adapt",
    "flexibility",
    "change",
    "pivot",
    "learn",
    "accept feedback",
  ],
  customerService: [
    "customer",
    "client",
    "patient",
    "serve",
    "help",
    "assist",
    "support",
  ],
};

export const ACTION_VERBS = [
  "Coordinated",
  "Managed",
  "Collaborated",
  "Spearheaded",
  "Orchestrated",
  "Directed",
  "Facilitated",
  "Implemented",
  "Executed",
  "Developed",
  "Created",
  "Designed",
  "Launched",
  "Established",
  "Maintained",
  "Improved",
  "Optimized",
  "Resolved",
  "Negotiated",
  "Advocated",
  "Mentored",
  "Trained",
  "Supervised",
  "Supported",
  "Delivered",
  "Completed",
  "Achieved",
  "Exceeded",
  "Demonstrated",
  "Pioneered",
];

export const SYNTHESIS_PROMPT = `Perfect! I now have everything I need to create your first resume draft.

**Here's what I've discovered about you:**

**Core Responsibilities:**
[From your answers]

**Key Achievements:**
[Your accomplishments]

**Professional Skills:**
[Skills you demonstrated]

**Your Professional Value:**
[Strengths & work style]

These aren't just words—they're evidence of real, professional capabilities that hiring managers care about. Every bullet point comes directly from your own experience.

Next, you'll see your resume draft with professionally worded bullet points ready to use. From there, you can apply to jobs, tailor it for specific roles, or make it your own.

Let's build your resume now!`;

export type ConversationPhase =
  | "welcome"
  | "q1_contact"
  | "q2_job_listing"
  | "q3_responsibilities"
  | "q4_achievements"
  | "q5_skills"
  | "q6_impact"
  | "q7_additional"
  | "q8_strengths"
  | "q9_workstyle"
  | "q10_interests"
  | "synthesis"
  | "complete";

export interface FollowUpQuestion {
  id: string;
  question: string;
}

export const FOLLOW_UP_QUESTIONS: Record<string, string> = {
  employer_name_dates:
    "What was the name of the company or employer? What was your job title, and approximately when did you work there (start and end dates)?",
  education_institution_dates:
    "What was the name of the school or program? When did you attend or complete it (year or approximate dates)?",
  volunteer_org_dates:
    "What was the name of the organization where you volunteered? Approximately when did you volunteer there (start and end dates)?",
};

// ---------------------------------------------------------------------------
// Job-aware targeting
//
// The answer to Q2 (job listing URL or title) is parsed into a lightweight
// TargetProfile. This profile does NOT change the 10-question structure — it
// only re-skins the examples in the skills question and lets the dynamic
// follow-up layer surface role-relevant experience the user left unsaid.
// When Q2 is blank ("no specific job"), inference returns null and the flow
// behaves exactly as the generic default.
// ---------------------------------------------------------------------------

export interface TargetCompetency {
  /** Stable id, e.g. "cash_handling" — used to key the follow-up answer. */
  id: string;
  /** Short human label, e.g. "cash handling". */
  label: string;
  /** If ANY of these appear in the user's answers, the competency is "covered". */
  evidenceKeywords: string[];
  /** Follow-up asked when this competency is a gap (unmentioned). */
  followUpQuestion: string;
}

export interface TargetProfile {
  /** Role category id. */
  id: string;
  /** Human-readable role label, e.g. "Customer Service & Retail". */
  label: string;
  /** Tokens in the job title / URL slug that select this profile. */
  matchKeywords: string[];
  /** Parenthetical examples injected into the skills question (Q5). */
  skillExamples: string;
  /** Competencies ordered by priority (first gap found is the one asked). */
  competencies: TargetCompetency[];
}

export const ROLE_PROFILES: TargetProfile[] = [
  {
    id: "customer_service",
    label: "Customer Service & Retail",
    matchKeywords: [
      "customer service", "customer", "cashier", "retail", "sales associate",
      "sales", "clerk", "barista", "front desk", "call center", "teller",
    ],
    skillExamples:
      "helping customers, handling questions and complaints, working a register or point-of-sale system, staying calm and friendly under pressure",
    competencies: [
      {
        id: "cash_handling",
        label: "cash or register handling",
        evidenceKeywords: ["cash", "register", "money", "payment", "pos", "point of sale", "transaction", "till", "budget"],
        followUpQuestion:
          "The role you're targeting often involves handling money or a register. Have you ever managed cash, run a register, or kept track of money — even informally, like a household budget or an event?",
      },
      {
        id: "customer_interaction",
        label: "direct customer interaction",
        evidenceKeywords: ["customer", "client", "served", "serve", "helped people", "public", "guest", "shopper", "people"],
        followUpQuestion:
          "This job centers on working with customers. Can you describe a time you helped, served, or dealt with people directly — in any setting?",
      },
      {
        id: "conflict_resolution",
        label: "handling complaints or conflict",
        evidenceKeywords: ["complaint", "upset", "angry", "resolve", "conflict", "difficult", "calm", "de-escalate", "frustrated"],
        followUpQuestion:
          "Customer-facing roles value staying composed with upset people. Have you ever calmed a tense situation or handled someone who was frustrated?",
      },
    ],
  },
  {
    id: "office_admin",
    label: "Office & Administrative",
    matchKeywords: [
      "office", "administrative", "admin", "receptionist", "data entry",
      "secretary", "assistant", "coordinator", "front office", "clerical",
    ],
    skillExamples:
      "scheduling and organizing, answering phones and emails, keeping records or files, using a computer for documents and spreadsheets",
    competencies: [
      {
        id: "scheduling_organization",
        label: "scheduling and organization",
        evidenceKeywords: ["schedule", "calendar", "appointment", "organize", "coordinate", "plan", "arrange", "prioritize"],
        followUpQuestion:
          "Office roles rely on scheduling and organization. Have you ever kept a calendar, set appointments, or coordinated people's time?",
      },
      {
        id: "computer_skills",
        label: "computer and software use",
        evidenceKeywords: ["computer", "email", "word", "excel", "spreadsheet", "microsoft", "google", "typing", "software", "facebook", "online"],
        followUpQuestion:
          "This role uses computers daily. What's your comfort with email, documents, spreadsheets, or other software — even basic use counts?",
      },
      {
        id: "recordkeeping",
        label: "recordkeeping",
        evidenceKeywords: ["record", "file", "paperwork", "document", "track", "log", "data", "bills"],
        followUpQuestion:
          "Administrative work involves keeping records. Have you ever tracked information, kept files, or managed paperwork — even for your household?",
      },
    ],
  },
  {
    id: "warehouse_logistics",
    label: "Warehouse & Logistics",
    matchKeywords: [
      "warehouse", "logistics", "driver", "delivery", "forklift", "stock",
      "inventory", "shipping", "picker", "packer", "material handler", "courier",
    ],
    skillExamples:
      "lifting and moving items safely, keeping track of inventory, working quickly and accurately, following safety procedures",
    competencies: [
      {
        id: "physical_reliability",
        label: "physical, fast-paced work",
        evidenceKeywords: ["lift", "carry", "physical", "move", "load", "stock", "fast", "on my feet", "active"],
        followUpQuestion:
          "Warehouse roles can be physical and fast-paced. Have you done work that required being on your feet, lifting, or moving things?",
      },
      {
        id: "inventory_accuracy",
        label: "inventory and accuracy",
        evidenceKeywords: ["inventory", "stock", "count", "organize", "track", "supplies", "order", "accurate"],
        followUpQuestion:
          "These jobs value keeping count of things. Have you ever managed supplies, counted inventory, or kept stock organized — even at home or for an event?",
      },
      {
        id: "reliability_attendance",
        label: "dependability",
        evidenceKeywords: ["reliable", "on time", "punctual", "dependable", "show up", "consistent", "never miss", "responsible"],
        followUpQuestion:
          "Employers here care a lot about dependability. Can you give an example of being counted on to show up and follow through consistently?",
      },
    ],
  },
  {
    id: "food_service",
    label: "Food Service & Hospitality",
    matchKeywords: [
      "food", "restaurant", "server", "waiter", "waitress", "cook", "kitchen",
      "barista", "host", "hospitality", "dishwasher", "fast food", "cafe", "bartender",
    ],
    skillExamples:
      "serving customers quickly and politely, working as part of a team, handling food safely, staying organized during busy rushes",
    competencies: [
      {
        id: "fast_paced_teamwork",
        label: "fast-paced teamwork",
        evidenceKeywords: ["team", "busy", "rush", "fast", "together", "coworker", "help each other", "pressure"],
        followUpQuestion:
          "Food service is fast-paced teamwork. Tell me about a time you worked closely with others to get something done under time pressure.",
      },
      {
        id: "customer_service_food",
        label: "serving people",
        evidenceKeywords: ["customer", "serve", "guest", "order", "polite", "friendly", "public", "people"],
        followUpQuestion:
          "This role involves serving people directly. Have you ever taken care of guests, customers, or people's needs in a friendly way?",
      },
      {
        id: "food_safety_cleanliness",
        label: "cleanliness and food safety",
        evidenceKeywords: ["clean", "food", "kitchen", "sanitize", "safety", "hygiene", "prep", "wash"],
        followUpQuestion:
          "Restaurants value cleanliness and food safety. Have you handled food, kept a space clean, or followed health and safety rules anywhere?",
      },
    ],
  },
  {
    id: "healthcare_support",
    label: "Healthcare & Caregiving",
    matchKeywords: [
      "caregiver", "care", "home health", "aide", "cna", "nursing assistant",
      "patient", "healthcare", "medical", "hospice", "childcare", "daycare", "babysitter",
    ],
    skillExamples:
      "caring for and supporting people, being patient and compassionate, following routines and instructions, keeping people safe",
    competencies: [
      {
        id: "direct_care",
        label: "caring for people",
        evidenceKeywords: ["care", "caregiver", "helped", "assist", "patient", "elderly", "children", "kids", "family", "support"],
        followUpQuestion:
          "Caregiving roles center on supporting people directly. Have you cared for children, elderly family, or anyone who depended on you?",
      },
      {
        id: "patience_compassion",
        label: "patience and compassion",
        evidenceKeywords: ["patient", "calm", "compassion", "kind", "listen", "gentle", "understanding", "caring"],
        followUpQuestion:
          "These roles value patience and compassion. Can you describe a time you stayed patient and caring with someone who needed extra support?",
      },
      {
        id: "following_instructions",
        label: "following routines and instructions",
        evidenceKeywords: ["instruction", "routine", "follow", "schedule", "medication", "procedure", "careful", "safe"],
        followUpQuestion:
          "Healthcare work means following routines and instructions carefully. Have you ever followed a detailed routine or set of instructions to keep someone safe or healthy?",
      },
    ],
  },
  {
    id: "cleaning_facilities",
    label: "Cleaning & Facilities",
    matchKeywords: [
      "cleaning", "janitor", "janitorial", "housekeeping", "custodian",
      "maintenance", "housekeeper", "sanitation", "groundskeeper", "porter",
    ],
    skillExamples:
      "cleaning and maintaining spaces thoroughly, working independently, paying attention to detail, managing your time across tasks",
    competencies: [
      {
        id: "attention_to_detail",
        label: "thoroughness and detail",
        evidenceKeywords: ["detail", "thorough", "careful", "spotless", "neat", "tidy", "clean", "maintain"],
        followUpQuestion:
          "Cleaning roles reward thoroughness. Have you kept a home, space, or area consistently clean and well-maintained?",
      },
      {
        id: "independent_work",
        label: "working independently",
        evidenceKeywords: ["independent", "on my own", "self", "without supervision", "reliable", "alone", "responsible"],
        followUpQuestion:
          "Much of this work is done independently. Can you describe handling responsibilities on your own, without someone watching over you?",
      },
      {
        id: "time_management_cleaning",
        label: "managing time across tasks",
        evidenceKeywords: ["time", "schedule", "prioritize", "juggle", "multiple", "manage", "organize"],
        followUpQuestion:
          "These jobs need good time management across many tasks. Have you juggled several responsibilities and kept on top of them?",
      },
    ],
  },
];

const NO_JOB_TOKENS = ["no", "not", "none", "nothing", "skip", "n/a", "na", "unsure", "dont", "don't"];

/**
 * Infer a TargetProfile from the user's Q2 answer (a job URL, a job title, or
 * a "no specific job" reply). Returns null when the answer is blank, signals
 * no specific job, or matches no known role category — in which case the flow
 * falls back cleanly to its generic wording.
 */
export function inferTargetProfile(jobListingAnswer: string): TargetProfile | null {
  const raw = (jobListingAnswer || "").trim();
  if (!raw) return null;

  // "No specific job" detection — check the opening words.
  const openingWords = raw.toLowerCase().split(/\s+/).slice(0, 4);
  if (openingWords.some((w) => NO_JOB_TOKENS.includes(w.replace(/[.,!]/g, "")))) {
    return null;
  }

  // Build a searchable haystack. For URLs, decode the slug into words so a path
  // like /jobs/customer-service-representative-12345 still matches.
  let haystack = raw.toLowerCase();
  if (/^https?:\/\//i.test(raw)) {
    haystack = raw.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  }

  let best: { profile: TargetProfile; score: number } | null = null;
  for (const profile of ROLE_PROFILES) {
    let score = 0;
    for (const kw of profile.matchKeywords) {
      if (haystack.includes(kw.toLowerCase())) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { profile, score };
    }
  }

  return best ? best.profile : null;
}

/**
 * Build the skills question (Q5), injecting role-relevant examples when a
 * target profile is known. Falls back to the generic examples otherwise.
 */
export function buildSkillsQuestion(profile: TargetProfile | null): string {
  if (!profile) return ELICITATION_QUESTIONS.skills[0];
  return `Question 5 of 10: What skills did you use to accomplish those things? (e.g., ${profile.skillExamples})`;
}

/**
 * Whole-word keyword match (case-insensitive), allowing an optional trailing
 * "s" for plurals. Used instead of a plain substring `includes()` so short
 * evidence tokens don't produce false positives — e.g. "pos" (point-of-sale)
 * must not match "posts", and "till" must not match "until".
 */
function keywordInText(text: string, keyword: string): boolean {
  const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${esc}s?\\b`, "i").test(text);
}

/**
 * Given the target profile and the text of everything the user has said so
 * far, return a single follow-up for the highest-priority role competency that
 * has NOT been mentioned — or null if the profile is absent or all covered.
 * Capped at one to keep the flow from ballooning.
 */
export function detectCompetencyGap(
  profile: TargetProfile | null,
  combinedText: string
): FollowUpQuestion | null {
  if (!profile) return null;
  const text = combinedText || "";
  for (const comp of profile.competencies) {
    const covered = comp.evidenceKeywords.some((kw) =>
      keywordInText(text, kw)
    );
    if (!covered) {
      return { id: `competency_${comp.id}`, question: comp.followUpQuestion };
    }
  }
  return null;
}

export interface ConversationState {
  phase: ConversationPhase;
  messageCount: number;
  exchangeCount: number;
  discoveredSkills: string[];
  discoveredSoftSkills: string[];
  narrativeExcerpts: string[];
  resumeBulletPoints: string[];
  followUpQueue: FollowUpQuestion[];
  followUpData: Record<string, string>;
  mainAnswers: string[];
  targetProfile: TargetProfile | null;
}

export interface Message {
  id: string;
  role: "counselor" | "client";
  content: string;
  timestamp: Date;
  extractedSkills?: string[];
}
