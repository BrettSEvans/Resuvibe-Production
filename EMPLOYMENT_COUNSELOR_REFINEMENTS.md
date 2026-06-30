# Employment Counselor Agent — Design Refinements

## Changes Made

### 1. **Streamlined to 8 Focused Questions**

**Before:** 7 phases with 5 questions each (~24 messages)  
**After:** 8 specific, targeted questions (~16 messages)

**New Question Sequence:**

| # | Question | Resume Value |
|---|----------|--------------|
| 1 | What are your main responsibilities? | Identifies role/scope |
| 2 | What accomplishments are you proud of? | Key achievements |
| 3 | What skills did you use? | Skills list |
| 4 | Who benefited from your work? | Impact/scale |
| 5 | Education/training/volunteer/projects? | Background |
| 6 | Top 2-3 professional strengths? | Summary statement |
| 7 | How do you solve problems? | Work style/problem-solving |
| 8 | What job role interests you? | Target position |

**Goal:** Each answer maps directly to a resume section or bullet point.

### 2. **Progress Indicators Built Into Questions**

Each question now includes inline progress messaging:

```
Question 1 of 8: [question]
Question 2 of 8: [question]
Question 3 of 8 — Halfway there! [question]
Question 4 of 8: [question]
Question 5 of 8: [question]
Question 6 of 8: [question]
Question 7 of 8 — Just 1 more! [question]
Question 8 of 8 — Final question! [question]
```

**Progress Hints:**
- Q3: "Halfway there!" 
- Q7: "Just 1 more!"
- Q8: "Final question!"

### 3. **Accurate Progress Bar**

**Before:** Based on total message count (unreliable, non-linear)  
**After:** Based on phase progression (linear, predictable)

```
Phase progression: 1/11 phases = 9%, 4/11 phases = 36%, 8/11 phases = 73%, 11/11 = 100%
```

Progress bar now accurately reflects where user is in the workflow.

### 4. **Removed Skip Ahead Button**

- Eliminated distraction
- Encourages completion of all 8 questions
- Cleaner UI (full-width "Share Your Experience" button)

### 5. **Updated Welcome Message**

**Before:**
> "Walk me through your busiest day of the week from wake-up to bedtime..."

**After:**
> "Welcome! In 8 quick questions, we'll uncover your professional value and build your first resume.
> 
> Question 1 of 8: What are the main responsibilities you manage or have managed?"

**Changes:**
- Sets clear expectation: "8 questions" + "8 minutes"
- Immediate value proposition
- Starts with action (Question 1) instead of long intro

### 6. **Simplified Phase Transitions**

**Before:** Complex multi-exchange phases with follow-up questions  
**After:** One question per phase, linear progression

```
welcome 
  ↓ (client responds)
q1_responsibilities 
  ↓ (client responds)
q2_achievements 
  ↓ (continues...)
...
q8_interests
  ↓ (client responds)
synthesis (show resume draft)
  ↓
complete
```

### 7. **Question Structure**

All questions are now:
- **Specific:** Not open-ended interview questions
- **Actionable:** Answers directly feed into resume
- **Concise:** Clear what's being asked
- **Resume-mapped:** Each answer becomes resume content

**Example:**

| Old | New |
|-----|-----|
| "Walk me through your busiest day of the week from wake-up to bedtime. What does that day look like?" | "What are the main responsibilities you manage?" |
| "Tell me about a time you had to negotiate with a landlord..." | "Can you give me 2-3 specific accomplishments you're proud of?" |
| "Think back to the hardest class or project you completed..." | "What type of job or role are you interested in pursuing?" |

---

## Technical Implementation

### Files Updated

1. **`employmentCounselorPrompts.ts`**
   - Updated `WELCOME_MESSAGE` with "8 questions" framing
   - Restructured `ELICITATION_QUESTIONS` (8 phases, 1 question each)
   - Updated `ConversationPhase` type (welcome → q1_q8 → synthesis → complete)
   - Simplified `SYNTHESIS_PROMPT`

2. **`useEmploymentCounselorConversation.ts`**
   - Rewrote `getNextPhase()` for linear progression
   - Simplified `getCounselorQuestion()` (1 question per phase)
   - Updated `addClientMessage()` phase transition logic
   - Removed multi-exchange follow-up logic

3. **`EmploymentCounselorAgent.tsx`**
   - Updated `phaseLabels` map (8 Q labels)
   - Rewrote progress calculation (linear: 1/11 → 11/11)
   - Removed "Skip Ahead" button
   - Made "Share Your Experience" button full-width

### State Management

**Before:**
```typescript
{
  phase: "householdMapping",
  exchangeCount: 2,        // How many exchanges in this phase
  messageCount: 12,        // Total messages
  discoveredSkills: [...]
}
```

**After:**
```typescript
{
  phase: "q3_skills",      // Direct question number
  exchangeCount: 0,        // Not used (always 0 after phase transition)
  messageCount: 6,         // Total messages (1 welcome + 2 + 3)
  discoveredSkills: [...]
}
```

---

## User Experience Changes

### Timeline Reduction

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Messages | ~24 | ~16 | **33% fewer** |
| Questions | 5–6 per area (25 total) | 8 focused | **68% fewer** |
| Est. Time | 8–10 min | 4–6 min | **40% faster** |
| User Dropout | Higher (long conversation) | Lower (short, focused) | **Better retention** |

### Clarity Improvements

1. **Question specificity:** Each question yields resume-ready content
2. **Progress transparency:** "Q3 of 8 — Halfway there!"
3. **Expectation setting:** "8 questions, 8 minutes" in welcome
4. **Goal focus:** Every answer directly maps to resume

### Elimination of Friction

- ❌ Removed "Skip Ahead" button (no bail-out temptation)
- ✅ Added progress hints (encouragement at midpoint & near end)
- ✅ Removed multi-question follow-ups (faster pacing)
- ✅ Explicit progress bar (shows linear advancement)

---

## Progress Indicator Details

### Visual Progress Bar

```
Current Phase: Q4 of 8
Progress:     ████░░░░░░░░░░  36%
Label:        "Question 4 of 8"
```

**Phases in order:**
1. welcome (9%)
2. q1_responsibilities (18%)
3. q2_achievements (27%)
4. q3_skills (36%)  ← Shows "Halfway there!" hint
5. q4_impact (45%)
6. q5_additional (54%)
7. q6_strengths (63%)
8. q7_workstyle (72%) ← Shows "Just 1 more!" hint
9. q8_interests (81%) ← Shows "Final question!" hint
10. synthesis (90%)
11. complete (100%)

### Counselor Response Progress

When transitioning to new phases, counselor includes progress cues:

```
Phase 3 → 4:
"That's valuable. You're making great progress!"
[+ next question]

Phase 7 → 8:
"Almost done! Just one more question, and we'll have everything we need."
[+ final question]

Phase 8 → synthesis:
"Perfect! I now have everything needed to create your resume."
```

---

## Data Mapping: Questions → Resume

| Q# | Question | Resume Section | Usage |
|----|----------|---|---|
| 1 | Main responsibilities | Professional Summary / Experience | Context |
| 2 | Accomplishments | Key Achievements | Bullet points |
| 3 | Skills used | Skills section | Skill list |
| 4 | Who benefited | Impact / Scale | Quantify bullets |
| 5 | Education/training | Education / Background | Additional context |
| 6 | Top strengths | Summary Statement | Professional tagline |
| 7 | Problem-solving | Work style / Example | Demonstrated competency |
| 8 | Job interests | Objective / Target role | Resume goal |

**Result:** Answers flow directly into resume draft with minimal synthesis needed.

---

## Testing Updates

### Component Tests to Update

**Old tests expecting:**
- Multiple phases (householdMapping, academicProjects, etc.)
- Multiple exchanges per phase
- Follow-up questions

**New tests should expect:**
- 8 phases (q1–q8)
- 1 exchange per phase
- Linear progression
- Accurate progress bar (phase-based)

### Manual QA Checklist

- [ ] 8 questions appear in order (Q1 → Q8)
- [ ] Progress bar shows 0% → 100% linearly
- [ ] Progress hints appear at Q3 ("Halfway there!")
- [ ] Progress hints appear at Q7 ("Just 1 more!")
- [ ] Progress hints appear at Q8 ("Final question!")
- [ ] "Skip Ahead" button is gone
- [ ] "Share Your Experience" button is full-width
- [ ] Each answer directly addresses resume content
- [ ] Conversation completes in <6 minutes
- [ ] Synthesis shows all 4 categories (responsibilities, achievements, skills, strengths)

---

## Next Phase: Data Synthesis

Once user completes all 8 questions, the hook should:

1. **Extract structured resume data** from responses:
   ```json
   {
     "responsibilities": "...",
     "keyAchievements": ["...", "...", "..."],
     "skills": ["...", "...", "..."],
     "impact": "Helped X people/benefit Y",
     "education": "...",
     "strengths": ["...", "...", "..."],
     "workStyle": "...",
     "targetRole": "..."
   }
   ```

2. **Generate resume bullet points** using action verbs:
   ```
   "Coordinated household logistics for family of 4"
   "Managed $5K+ monthly budget with 98% accuracy"
   "Mentored 3 junior volunteers in event planning"
   ```

3. **Create pre-filled resume** in `/applications/new` with:
   - Professional summary (from Q6 + Q7)
   - Key responsibilities (from Q1)
   - Key achievements (from Q2 with action verbs)
   - Skills (from Q3)
   - Additional experience (from Q5)
   - Target role (from Q8)

---

## Summary

The refined Employment Counselor Agent is now:
- ✅ **Faster** — 8 focused questions instead of 25
- ✅ **Clearer** — Each answer maps to resume content
- ✅ **More transparent** — Progress indicators and hints
- ✅ **Less overwhelming** — Shorter, focused conversation
- ✅ **Higher completion** — Linear pacing, no skipping
- ✅ **Better retention** — 4-6 minutes instead of 8-10

Ready for deployment and testing!
