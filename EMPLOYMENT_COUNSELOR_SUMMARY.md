# Employment Counselor Agent — Feature Summary

## What Was Built

An agentic conversational experience that helps first-time job seekers discover professional value in their lived experiences using an **asset-based narrative approach**.

**Entry Point:** `/build-my-resume` (FirstTimeJobSeeker page)  
**Flow:** 7-phase conversation → Skill extraction → Resume-ready summary  
**Outcome:** Discovered skills + narrative excerpts → feeds into resume builder

---

## The 5 Core Elicitation Techniques

### 1. **Day-in-the-Life Household Mapping**
Reframes domestic management into professional skills.

**Questions:**
- "Walk me through your busiest day of the week"
- "How do you handle schedule conflicts?"
- "How do you manage household finances and unexpected expenses?"
- "Tell me about negotiating with landlords, utility companies, or medical staff"
- "How did you handle a household crisis?"

**Skills Extracted:**
Time Management, Budgeting, Negotiation, Crisis Resolution, Resource Allocation

---

### 2. **Academic Project Breakdown**
Translates student experience into execution and collaboration proof.

**Questions:**
- "Think of the hardest class or project you completed"
- "What was your first step to organize the work?"
- "What role do you naturally fall into in group projects?"
- "Tell me about tough feedback and how you adjusted"
- "What would you be most proud of accomplishing in that project?"

**Skills Extracted:**
Project Planning, Research, Initiative, Teamwork, Leadership, Coachability, Adaptability

---

### 3. **Volunteer & Community Impact Probe**
Extracts accountability and dedication from unpaid roles.

**Questions:**
- "Tell me about a time you showed up unpaid for an organization or community event"
- "What was the specific goal, and what part were you responsible for?"
- "Did you have to train or guide other volunteers?"
- "Why did organizers trust you with that task?"
- "When something went wrong, how did you problem-solve?"

**Skills Extracted:**
Event Coordination, Goal-Oriented Execution, Training, Leadership, Reliability, Problem-Solving

---

### 4. **Organizational Membership & Sub-Culture Analysis**
Demonstrates commitment, networking, and rule-following.

**Questions:**
- "Are you part of any clubs, teams, or organizations?"
- "How did you contribute to morale when things weren't going well?"
- "Did membership require following strict rules or protocols?"
- "Did you represent your group to outsiders (recruit, speak, write announcements)?"
- "What would you want an employer to know about being part of that group?"

**Skills Extracted:**
Team Building, Emotional Intelligence, Safety Compliance, Public Relations, Public Speaking

---

### 5. **Pride and Problem Interview** (Soft Skill Extraction)
Ties narrative together through specific behavioral stories.

**Questions:**
- "Tell me about a moment you felt proud because you fixed something"
- "Walk me through your thinking and problem-solving process"
- "Tell me about a time you dealt with an upset or uncooperative person"
- "What exact words or approach did you use to calm them down?"
- "What do these stories reveal about how you work and who you are?"

**Skills Extracted:**
Troubleshooting, Analytical Thinking, De-escalation, Customer Service, Conflict Management, Reliability

---

## Conversation Architecture

### Phase Flow

```
1. WELCOME (1 msg)
   └─ Warm greeting, normalize blank canvas

2. HOUSEHOLD MAPPING (3-4 exchanges)
   └─ Questions about daily life → operational skills

3. ACADEMIC PROJECTS (3-4 exchanges)
   └─ Questions about education → execution & collaboration

4. VOLUNTEERING/COMMUNITY (3-4 exchanges)
   └─ Questions about unpaid work → accountability & impact

5. MEMBERSHIPS/AFFILIATIONS (3-4 exchanges)
   └─ Questions about hobbies/teams → team & compliance

6. PRIDE & PROBLEM (2-3 exchanges)
   └─ Story-based soft skill extraction

7. SYNTHESIS (1-2 exchanges)
   └─ Summarize findings, explain resume translation

8. COMPLETE (1 msg)
   └─ Export data, transition to resume builder
```

**Total Duration:** ~24 messages (12 client, 12 counselor) or ~5-10 minutes

---

## Real-Time Skill Extraction

### How It Works

1. **User sends message** → "I coordinate my kids' school schedules and manage our household budget"

2. **Keyword matching** extracts skills:
   - "coordinate" + "schedules" = Time Management
   - "manage" + "budget" = Budgeting

3. **Skills appear instantly** in sidebar:
   ```
   ✓ Time Management
   ✓ Budgeting
   ```

4. **Skills accumulate** as conversation progresses

5. **On completion**, all discovered skills are exported and saved to profile

### Skill Extraction Keywords

| Skill | Keywords |
|-------|----------|
| Time Management | coordinate, schedule, manage, prioritize, juggle, balance, organize |
| Budgeting | budget, financial, expenses, resources, allocation, savings, track |
| Negotiation | negotiate, advocate, persuade, resolve, compromise, agreement |
| Problem-Solving | problem, solution, fix, troubleshoot, figure out, overcome |
| Teamwork | team, group, together, collaborate, cooperate, contribute |
| Leadership | lead, guide, teach, mentor, organize, delegate |
| Communication | speak, explain, listen, conversation, discuss, present, write |
| Reliability | trust, depend, reliable, consistent, follow through, commitment |
| Adaptability | adjust, adapt, flexibility, change, pivot, learn, feedback |
| Customer Service | customer, client, patient, serve, help, assist, support |

---

## Component Files

### 1. **EmploymentCounselorAgent.tsx** (UI Component)
- **Purpose:** Conversational UI for counselor experience
- **Key Elements:**
  - Message thread (auto-scrolling)
  - Client textarea input
  - Progress bar (0-100%)
  - Phase label ("Understanding Your Experience", etc.)
  - Real-time skills sidebar
  - Completion summary card
- **Props:** `onComplete: (data) => void` callback
- **State:** Messages, conversation phase, discovered skills

### 2. **useEmploymentCounselorConversation.ts** (State Hook)
- **Purpose:** Manage conversation state, skill extraction, AI integration point
- **Hook Returns:**
  - `messages` — Full conversation history
  - `conversationState` — Phase, skills, progress
  - `isLoading` — Awaiting response
  - `addClientMessage()` — Send client message
  - `exportConversationData()` — Export to resume builder
- **Key Logic:**
  - Phase progression (`getNextPhase()`)
  - Skill extraction (`extractSkillsFromResponse()`)
  - Counselor question selection (`getCounselorQuestion()`)

### 3. **employmentCounselorPrompts.ts** (Config/Library)
- **Purpose:** Question sets, system prompt, skill keywords
- **Exports:**
  - `EMPLOYMENT_COUNSELOR_SYSTEM_PROMPT` — AI behavior definition
  - `WELCOME_MESSAGE` — Initial greeting
  - `ELICITATION_QUESTIONS` — Organized question sets
  - `SKILL_EXTRACTION_KEYWORDS` — Keyword → skill mapping
  - `ACTION_VERBS` — Resume-ready verbs list
- **Easy to Customize:** Edit questions, keywords, prompts directly

### 4. **FirstTimeJobSeeker.tsx** (Page Integration)
- **Purpose:** Main page for first-time job seekers
- **Contains:**
  - Welcome heading + icon
  - EmploymentCounselorAgent component
  - "How It Works" explainer card
  - onComplete handler (saves to Supabase, navigates to `/applications/new`)

---

## Data Structure

### Exported Conversation Data

```typescript
{
  conversationId: "counselor-1717945683522",
  phase: "complete",
  discoveredSkills: [
    "Time Management",
    "Budgeting",
    "Negotiation",
    "Problem-Solving",
    "Team Building"
  ],
  discoveredSoftSkills: [
    "Reliability",
    "Adaptability",
    "Communication"
  ],
  narrativeExcerpts: [
    "I spend my days coordinating schedules for multiple family members...",
    "When our HVAC system broke in January, I had to figure out..."
  ],
  resumeBulletPoints: [
    "Coordinated household schedules and logistics for family of 4",
    "Managed monthly household budget of $5,000+ with 98% accuracy",
    "Negotiated rates with utility companies, saving $1,200/year"
  ],
  rawMessages: [
    "I manage household schedules and budgets...",
    "When we have appointment conflicts...",
    // ... all client messages
  ]
}
```

### Stored in Database

```sql
UPDATE profiles
SET counselor_conversation = {...},
    counselor_extracted_skills = [...],
WHERE id = user.id
```

---

## The Golden Rule

**"Never let the client write 'Responsible for...' on their resume."**

Instead, translate their answers into active verbs:

| Bad | Better |
|-----|--------|
| Responsible for household management | **Managed** household logistics |
| Helped with family finances | **Coordinated** weekly budgets |
| Was part of volunteer group | **Spearheaded** community fundraisers |
| Did group projects | **Collaborated** on academic research |

---

## Testing Coverage

### Component Tests (`EmploymentCounselorAgent.test.tsx`)
- ✅ Initial state (welcome message, empty input, disabled button)
- ✅ Input handling (enable button, send message, clear input)
- ✅ Conversation flow (message persistence, progression, phase transitions)
- ✅ Skill extraction (sidebar display, real-time updates)
- ✅ Progress bar (initial state, progression)
- ✅ Completion state (summary card, button)
- ✅ Error handling (empty/whitespace messages, rapid submission)
- ✅ Accessibility (labels, button text, heading hierarchy)

### Integration Tests (`FirstTimeJobSeeker.test.tsx`)
- ✅ Page renders with counselor agent
- ✅ Complete conversation flow
- ✅ Data persistence to Supabase
- ✅ Navigation to resume builder on completion
- ✅ Error handling (save failures)

---

## Future AI Integration

### Current State (Pre-AI)
- Client-side keyword matching for skill extraction
- Hardcoded question progression
- Works immediately without API calls
- Fast & reliable

### Next Phase (Ready to Integrate)
Create Supabase edge function `counsel-and-extract`:

```typescript
// Hook calls:
const { data } = await supabase.functions.invoke("counsel-and-extract", {
  body: {
    clientMessage: "I coordinate family schedules...",
    conversationHistory: messages,
    currentPhase: "householdMapping",
  }
});

// Returns:
{
  counselorResponse: "That's impressive. How do you...",
  extractedSkills: ["Time Management", "Organization"],
  extractedSoftSkills: ["Reliability"],
  shouldAdvancePhase: true,
  nextPhase: "academicProjects"
}
```

**Benefits of AI:**
- Natural language understanding (catch skills keyword matching misses)
- Context-aware follow-up questions
- Soft skill inference from stories
- Resume bullet point generation

---

## User Journey

### Before (No Resume)
```
User: "I've never had a job, so I have nothing for a resume"
ResUVibe: ❌ Dead end
```

### After (Employment Counselor)
```
User: "I've never had a job"
ResUVibe: "Great, let's discover what you DO have"

Q: "Walk me through your busiest day"
A: "I manage my kids' schedules, groceries, finances..."

💡 DISCOVERED: Time Management, Budgeting, Planning
✅ Resume built with: "Coordinated household logistics...", "Managed $5k+ monthly budget..."

User: "I didn't know that counted!"
```

---

## Differentiators

### Why This Approach Wins

1. **Psychological:** Builds confidence by celebrating existing skills
2. **Practical:** Extracts real, marketable skills from unpaid work
3. **Professional:** Translates lived experience into hiring-manager language
4. **Inclusive:** Works for career-changers, parents, graduates, career-starters
5. **Scalable:** One conversation → complete skill profile → resume ready

---

## Configuration Examples

### Change Welcome Message
```typescript
// employmentCounselorPrompts.ts
export const WELCOME_MESSAGE = `Your custom greeting here...`;
```

### Add a Question
```typescript
// employmentCounselorPrompts.ts
const ELICITATION_QUESTIONS = {
  householdMapping: [
    "New question?",
    "Existing question 1",
    // ...
  ]
};
```

### Add Skill Keywords
```typescript
// employmentCounselorPrompts.ts
const SKILL_EXTRACTION_KEYWORDS = {
  myNewSkill: ["keyword1", "keyword2", "keyword3"]
};
```

---

## Success Metrics

Once deployed, measure:

- **Conversation Completion Rate** — % who complete all phases
- **Skill Discovery Rate** — Average skills per conversation
- **Resume Creation Rate** — % who proceed to resume builder
- **Resume Quality** — User satisfaction with generated bullets
- **Time to Resume** — How long from start to first completed resume
- **Skill Accuracy** — Manual review: did we miss important skills?
- **User Confidence** — Pre/post sentiment analysis

---

## Next Steps

1. **Review** this implementation with product/design team
2. **Deploy** the components to staging
3. **Manual QA:**
   - Send various skill keywords
   - Test all 7 phases
   - Verify skill sidebar updates
   - Test mobile responsiveness
   - Verify Supabase persistence
4. **Integrate AI** edge function when ready
5. **Monitor** conversations for quality & coverage
6. **Iterate** on questions based on user feedback

---

## Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `employmentCounselorPrompts.ts` | Questions, prompts, config | 250 |
| `useEmploymentCounselorConversation.ts` | State management hook | 300 |
| `EmploymentCounselorAgent.tsx` | UI component | 400 |
| `EmploymentCounselorAgent.test.tsx` | Component tests | 450 |
| `FirstTimeJobSeeker.tsx` (updated) | Page integration | 100 |
| `EMPLOYMENT_COUNSELOR_IMPLEMENTATION.md` | Technical docs | 600 |
| **Total** | | **2,100+** |

---

**Status:** Ready for Deployment  
**Last Updated:** 2026-06-09  
**Questions?** See EMPLOYMENT_COUNSELOR_IMPLEMENTATION.md
