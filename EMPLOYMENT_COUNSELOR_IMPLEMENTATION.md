# Employment Counselor Agent Implementation

## Overview

The Employment Counselor Agent is an agentic experience that helps first-time job seekers discover the professional value in their lived experiences using an **asset-based narrative approach**.

**Location:** `/build-my-resume` page (FirstTimeJobSeeker)  
**Status:** Implementation Ready  
**Framework:** React + Conversational AI (via Supabase Edge Functions)

---

## Why This Approach Matters

Many first-time job seekers suffer from "impostor syndrome," viewing unpaid or lived experiences (household management, caregiving, education, volunteering) as worthless. The Employment Counselor reframes these experiences using professional language hiring managers understand:

**Daily Life** → Time Management, Budgeting, Negotiation  
**Academic Projects** → Planning, Research, Teamwork, Adaptability  
**Volunteering** → Leadership, Event Coordination, Impact  
**Hobbies/Memberships** → Team Building, Compliance, Public Speaking  
**Personal Challenges** → Problem-Solving, De-escalation, Communication  

---

## Architecture

### 1. **Core Components**

#### `EmploymentCounselorAgent.tsx`
The main UI component - handles conversation rendering, input, and state display.

**Props:**
```tsx
interface EmploymentCounselorAgentProps {
  onComplete?: (data: ExportedConversationData) => void;
}
```

**Features:**
- Multi-turn conversation thread
- Real-time skill extraction display
- Progress bar (0-100%)
- Phase-based UI updates
- Completion state with summary
- Input validation & error handling

**Key Elements:**
- Message thread (scrollable, auto-scroll to bottom)
- Client input textarea (3 rows, disabled during processing)
- "Share Your Experience" button (disabled when empty)
- Skills summary sidebar (appears after first exchange)
- Progress indicator with phase label
- Completion card (shows discovered skills, "Build My Resume" button)

#### `useEmploymentCounselorConversation.ts`
Custom React hook - manages conversation state, AI integration, skill extraction.

**Hook API:**
```tsx
const {
  messages,              // Message[] - full conversation history
  conversationState,     // ConversationState - phase, skills, progress
  isLoading,            // boolean - awaiting counselor response
  addClientMessage,     // (content: string) => Promise<void>
  generateResumeBulletPoints, // () => string[]
  exportConversationData // () => ExportedData
} = useEmploymentCounselorConversation();
```

**State:**
```tsx
interface ConversationState {
  phase: ConversationPhase;              // welcome → synthesis → complete
  messageCount: number;                   // Total messages in thread
  exchangeCount: number;                  // Exchanges within phase
  discoveredSkills: string[];            // ["Time Management", "Budgeting", ...]
  discoveredSoftSkills: string[];        // ["Reliability", "Adaptability", ...]
  narrativeExcerpts: string[];           // Client quotes for context
  resumeBulletPoints: string[];          // Draft bullets for resume
}
```

#### `employmentCounselorPrompts.ts`
Question library, system prompts, skill extraction keywords.

**Key Exports:**
- `EMPLOYMENT_COUNSELOR_SYSTEM_PROMPT` — AI agent behavior
- `WELCOME_MESSAGE` — Initial greeting
- `ELICITATION_QUESTIONS` — 5 question sets organized by topic
- `SKILL_EXTRACTION_KEYWORDS` — Keyword → skill mapping
- `ACTION_VERBS` — Resume-ready verbs (Coordinated, Managed, etc.)

---

### 2. **Conversation Phases**

The conversation progresses through 7 phases, each eliciting different experience types:

| Phase | Duration | Focus | Questions |
|-------|----------|-------|-----------|
| **welcome** | 1 msg | Build rapport, normalize blank canvas | Greeting |
| **householdMapping** | 3-4 exch | Daily life → operational skills | Schedules, budgets, negotiation, crisis |
| **academicProjects** | 3-4 exch | School → execution & collaboration | Hard classes, group projects, feedback |
| **volunteeringCommunity** | 3-4 exch | Unpaid work → accountability & impact | Event goals, training others, trust |
| **membershipAffiliation** | 3-4 exch | Hobbies → team & compliance skills | Groups, morale, rules, representation |
| **prideAndProblem** | 2-3 exch | Soft skills via stories | Pride moment, problem-solving, conflict |
| **synthesis** | 1-2 exch | Summarize findings → resume ready | Validate discoveries, next steps |
| **complete** | 1 msg | Export data, guide to resume builder | Celebrate, transition |

**Total:** ~24 messages (12 client + 12 counselor)

---

### 3. **Skill Extraction Pipeline**

#### Keyword Matching
When a client responds, the hook scans for skill-related keywords:

```typescript
const skillExtractedFromResponse = extractSkillsFromResponse(clientMessage);
// Example: "I coordinate schedules" → ["Time Management", "Organization"]
```

**Keyword Categories:**
- Time Management: coordinate, schedule, manage, prioritize, juggle
- Budgeting: budget, financial, expenses, resources, allocation
- Negotiation: negotiate, advocate, persuade, resolve, compromise
- Problem-Solving: problem, solution, fix, troubleshoot, figure out
- Teamwork: team, group, together, collaborate, cooperate
- Leadership: lead, guide, teach, mentor, organize, delegate
- Communication: speak, explain, listen, conversation, discuss
- Reliability: trust, depend, reliable, consistent, follow through
- Adaptability: adjust, adapt, flexibility, change, pivot, learn
- Customer Service: customer, client, patient, serve, help, assist

#### Deduplication
Skills are deduplicated and stored in `conversationState.discoveredSkills`.

#### Display
Skills appear in real-time in the sidebar, starting after the first client message.

---

### 4. **AI Integration Points**

#### Current Implementation (Pre-Edge Function)
The hook uses client-side skill extraction via keyword matching as a foundation. This allows the feature to work immediately while AI is being integrated.

#### Next Phase: Full AI-Powered Extraction
When ready, integrate Supabase edge function `counsel-and-extract`:

```typescript
// Hook would call:
const { data, error } = await supabase.functions.invoke("counsel-and-extract", {
  body: {
    clientMessage,
    conversationHistory: messages,
    currentPhase,
  }
});

// Returns:
{
  counselorResponse: string;
  extractedSkills: string[];
  extractedSoftSkills: string[];
  phaseTransition: boolean;
  nextPhase: ConversationPhase;
}
```

---

### 5. **Data Export & Persistence**

#### Export Format
```typescript
exportConversationData() → {
  conversationId: string;           // Unique ID for this session
  phase: ConversationPhase;         // Where conversation ended
  discoveredSkills: string[];       // Final skill list
  discoveredSoftSkills: string[];   // Soft skills identified
  narrativeExcerpts: string[];      // Client quotes (first 200 chars each)
  resumeBulletPoints: string[];     // Draft resume bullets
  rawMessages: string[];            // All client messages
}
```

#### Storage
When `onComplete` is triggered, FirstTimeJobSeeker component saves data to `profiles` table:

```typescript
await supabase
  .from("profiles")
  .update({
    counselor_conversation: conversationData,
    counselor_extracted_skills: conversationData.discoveredSkills,
  })
  .eq("id", user.id);
```

---

## File Structure

```
src/
├── components/
│   ├── EmploymentCounselorAgent.tsx           (Main UI)
│   └── EmploymentCounselorAgent.test.tsx      (Component tests)
├── hooks/
│   └── useEmploymentCounselorConversation.ts  (State management)
├── lib/
│   └── employmentCounselorPrompts.ts          (Prompts & config)
└── pages/
    ├── FirstTimeJobSeeker.tsx                 (Integration point)
    └── FirstTimeJobSeeker.test.tsx            (Integration tests)
```

---

## Integration Flow

### User Journey

1. **Sign up** → Onboarding Step 1 → Complete name/experience
2. **Step 2 (Resume)** → Click "Don't have a resume yet?"
3. **Redirect** → `/build-my-resume`
4. **Welcome** → Read Employment Counselor greeting
5. **Conversation** → Answer 6-7 open-ended questions
6. **Skills Discovery** → Skills appear in real-time sidebar
7. **Completion** → See discovered skills summary
8. **Next Step** → Click "Build My Resume" → `/applications/new`
9. **Resume Builder** → Use extracted skills as starting point

### Data Flow

```
EmploymentCounselorAgent (UI)
    ↓ addClientMessage(text)
useEmploymentCounselorConversation (State)
    ↓ extractSkillsFromResponse(text)
employmentCounselorPrompts (Keywords)
    ↓ discoveredSkills[]
EmploymentCounselorAgent (Display sidebar)
    ↓ onComplete(conversationData)
FirstTimeJobSeeker.tsx (Handler)
    ↓ supabase.from("profiles").update()
Supabase (Persistence)
```

---

## Configuration & Customization

### Adjusting Question Sets
Edit `employmentCounselorPrompts.ts`:

```typescript
const ELICITATION_QUESTIONS = {
  householdMapping: [
    "Your custom question here?",
    // ...
  ],
  // ...
};
```

### Modifying Skill Keywords
Update `SKILL_EXTRACTION_KEYWORDS`:

```typescript
const SKILL_EXTRACTION_KEYWORDS = {
  myNewSkill: ["keyword1", "keyword2", "keyword3"],
  // ...
};
```

### Changing Phase Duration
Edit the `getNextPhase` logic in the hook:

```typescript
case "householdMapping":
  return messageCount >= 6 ? "academicProjects" : "householdMapping";
  //                 ↑ Change to 8 for longer phase
```

---

## Testing Strategy

### Unit Tests: `EmploymentCounselorAgent.test.tsx`
- **Initial state:** Welcome message, empty input, disabled button
- **Input handling:** Enable button on text, send message, clear input
- **Conversation flow:** Message persistence, counselor responses, phase transitions
- **Skill extraction:** Sidebar display, skill updates
- **Progress bar:** Initial state, progression with messages
- **Phase transitions:** Label changes as conversation advances
- **Completion state:** Summary card, "Build My Resume" button
- **Error handling:** Empty messages, whitespace-only, rapid submissions
- **Accessibility:** Heading hierarchy, textarea labels, button text

### Integration Tests: `FirstTimeJobSeeker.test.tsx`
- **Full flow:** Welcome → answer questions → completion → export
- **Data persistence:** Conversation saved to profiles table
- **Navigation:** Redirect to `/applications/new` on completion
- **Error handling:** Handle Supabase save failures gracefully

### Manual QA
- [ ] Send messages with various skill keywords (coordinate, budget, negotiate, etc.)
- [ ] Verify skills appear in sidebar in real-time
- [ ] Navigate through all phases by sending multiple messages
- [ ] Test on mobile (scrolling, textarea size, button clickability)
- [ ] Verify progress bar increases smoothly
- [ ] Complete conversation and verify redirect to `/applications/new`
- [ ] Check data saved in Supabase profiles table

---

## Performance Considerations

### Message Rendering
- Messages are stored in state array, rendered in a scrollable container
- Auto-scroll on new message (using `useEffect` + `scrollIntoView`)
- Supports 20-30 messages without noticeable lag

### Skill Extraction
- Keyword matching is O(n×m) where n=keywords, m=message length
- Currently runs on client (fast, no network latency)
- If moving to AI-powered extraction, latency will increase (add optimistic UI)

### Memory Usage
- Conversation data stored in component state
- Export data when conversation completes (clear if navigating away)
- Profile update is one-time operation at completion

---

## Future Enhancements

### Phase 1: AI-Powered Extraction (Ready Now)
- [ ] Deploy `counsel-and-extract` edge function
- [ ] Replace keyword matching with LLM-based extraction
- [ ] Add follow-up question generation based on client responses
- [ ] Improve phase transition logic with AI scoring

### Phase 2: Resume Synthesis
- [ ] Auto-generate resume bullet points from conversation
- [ ] Create structured resume JSON for `/applications/new`
- [ ] Pre-fill skills, experience, etc. in resume builder

### Phase 3: Soft Skills Extraction
- [ ] Create separate tracking for soft skills (reliability, adaptability, etc.)
- [ ] Generate professional summary based on counselor assessment
- [ ] Use in cover letter generation ("Known for your reliability...")

### Phase 4: Counselor Refinement
- [ ] User feedback loop: "Did we miss any important skills?"
- [ ] A/B test different question phrasings
- [ ] Gather metrics on skill discovery rate by phase
- [ ] Optimize phase duration based on user engagement

### Phase 5: Personalization
- [ ] Detect when user is likely to disengage (long silence)
- [ ] Offer "Skip Ahead" option mid-conversation
- [ ] Remember user preferences for future sessions
- [ ] Recommend specific job types based on discovered skills

---

## Troubleshooting

### Conversation Not Progressing
- Check `conversationState.phase` in React DevTools
- Verify `getNextPhase()` logic is advancing correctly
- Ensure `messageCount` is incrementing

### Skills Not Appearing
- Check `extractSkillsFromResponse()` is finding keywords
- Verify keyword list in `employmentCounselorPrompts.ts` matches intent
- Log extracted skills: `console.log(message.extractedSkills)`

### Messages Not Sending
- Check textarea is not disabled (`isLoading` state)
- Verify `addClientMessage()` error handling
- Check for console errors in browser DevTools

### Styling Issues
- Verify Tailwind CSS classes are compiled (run `npm run dev`)
- Check that theme tokens exist (`--primary`, `--background`, etc.)
- Use browser DevTools to inspect computed styles

---

## Code Examples

### Integrating Elsewhere

To use the Employment Counselor on another page:

```tsx
import { EmploymentCounselorAgent } from "@/components/EmploymentCounselorAgent";

export function MyPage() {
  const handleComplete = (conversationData) => {
    console.log("Counselor session complete:", conversationData);
    // Do something with the data
  };

  return (
    <div>
      <h1>Let's discover your skills</h1>
      <EmploymentCounselorAgent onComplete={handleComplete} />
    </div>
  );
}
```

### Accessing Conversation State Directly

If you need the hook without the UI:

```tsx
import { useEmploymentCounselorConversation } from "@/hooks/useEmploymentCounselorConversation";

export function MyComponent() {
  const {
    messages,
    conversationState,
    addClientMessage,
    exportConversationData,
  } = useEmploymentCounselorConversation();

  return (
    <div>
      <p>Discovered: {conversationState.discoveredSkills.join(", ")}</p>
    </div>
  );
}
```

---

## Questions & Support

- **How do I change the welcome message?** Edit `WELCOME_MESSAGE` in `employmentCounselorPrompts.ts`
- **Can I customize the questions?** Yes, edit `ELICITATION_QUESTIONS` in the same file
- **How do I integrate AI responses?** See "AI Integration Points" section above
- **Can users resume a conversation?** Currently not supported; each session is new. Would require conversation ID + lookup logic to implement.

---

**Last Updated:** 2026-06-09  
**Status:** Ready for QA & Deployment
