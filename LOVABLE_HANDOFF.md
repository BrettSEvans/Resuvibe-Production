# Lovable handoff — provision the backend for the Interview Prep feature

**Goal:** make the **Interview Prep** feature functional on a **non‑prod (staging/preview)**
Supabase environment. All application + edge‑function **code already exists** in the
repo on branch **`staging`** (`BrettSEvans/Resuvibe-Production`, PR
[#2 → main](https://github.com/BrettSEvans/Resuvibe-Production/pull/2)). What's missing
is the **backend provisioning** — the DB migration, the edge‑function deploys, and one
secret — which must be applied to the target Supabase project. This document is the
complete list of those requirements.

> Do **not** apply to production until the verification checklist (§6) passes on staging.

---

## What already exists (no action needed)
- **Frontend** — the Interview Prep tab and all client logic (Vite/React). Deploys with the branch.
- **Migration file** — `supabase/migrations/20260710113516_interview-prep.sql`.
- **Edge function code** — under `supabase/functions/` (see §2).
- 32 automated tests pass; the app builds clean.

## What Lovable/Supabase must provide (the missing requirements)

### Requirement 1 — Apply the database migration
Apply `supabase/migrations/20260710113516_interview-prep.sql` to the target (staging)
Supabase project. It creates these objects in `public`:

| Object | Notes (security-critical items in **bold**) |
|---|---|
| **`user_entitlements`** table | PK `user_id`→`auth.users`; `subscription_tier` (`free`/`paid`), `trial_used_at`, `trial_application_id`→`job_applications`, `updated_at`. **RLS ON with a read‑own SELECT policy and NO insert/update/delete policy** — so clients can never write their own entitlement. Written only by the service role (edge functions / future billing). |
| `interview_questions` table | Per‑application question set; RLS read‑own. Includes **`is_active`** (question sets are *versioned, not deleted*) and `source_fingerprint` (resume+JD hash for cache invalidation). |
| `interview_sessions` table | One row per practice run; RLS read‑own. |
| `interview_turns` table | One row per answer attempt; RLS read‑own. **`question_id` is nullable and `ON DELETE SET NULL` (never CASCADE)**, and `question_text` is denormalized — so interview history survives question regeneration. |
| `generation_usage` (ALTER) | Adds `input_tokens`, `output_tokens`, `cost` columns (additive; existing rows default 0). |

**Prerequisite:** the base schema (`auth.users`, `profiles`, `job_applications`,
`generation_usage`) must already exist on the target project. On the real Resuvibe
project it does. ⚠️ **If you stand up a fresh/empty staging project, replicate the
current production schema FIRST** — several base tables (`profiles`, `generation_usage`,
`user_roles`, …) were created via the dashboard and are **not** in the migrations
folder, so a from‑scratch migration run alone will be missing them and this migration's
`ALTER generation_usage` will fail.

### Requirement 2 — Deploy the edge functions
Deploy these Deno functions from `supabase/functions/` to the target project:

1. `get-interview-entitlement` — read‑only entitlement snapshot (no writes).
2. `start-interview-session` — entitlement gate + **atomic** free‑trial claim + session creation.
3. `generate-interview-plan` — resume+JD‑grounded question generation, fingerprint‑cached, versioned.
4. `score-interview-answer` — improvement‑aware scoring + best‑attempt bookkeeping.

Shared helper `supabase/functions/_shared/interviewShared.ts` (uses the existing
`_shared/cors.ts` and `_shared/aiRetry.ts`). **JWT verification: default (`verify_jwt = true`)
is correct — no `config.toml` changes needed.**

### Requirement 3 — Set the function secret(s)
- **`LOVABLE_API_KEY`** — the Lovable AI gateway key. **Required.** These functions reuse
  the *same* gateway key the existing 25 functions use, so it is likely already set on the
  project; just confirm it's present on the staging project.
- `INTERVIEW_AI_MODEL` — *optional*; overrides the interview model. Defaults to
  `google/gemini-3-flash-preview` (the host convention). Any gateway‑supported model string works.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — **auto‑injected** by
  the Supabase runtime; do not set manually.

### Requirement 4 — Confirm one schema compatibility item
- **`generation_usage.asset_type`** must accept the new values `interview-plan` and
  `interview-scoring`. The functions insert usage rows with these `asset_type`s. If a
  `CHECK` constraint restricts `asset_type` to an enumerated set, add these two values.
  (The table isn't defined in the migrations folder, so this can't be confirmed from the
  repo — please verify on the live schema.)

### Requirement 5 — Data prerequisite to actually see the feature
The Interview Prep tab is intentionally **inactive until an application has a generated
resume** (`job_applications.resume_html`). To exercise it: sign in, create an application,
and generate a resume (unlocks the tab) — or seed one directly. A ready‑made seed script
exists: `scripts/seed-interview-preview.mjs` (inserts a past‑onboarding user + an
application with `resume_html`; run it against the **staging** project only).

---

## 6. Verification checklist (acceptance criteria for staging)
- [ ] Migration applies cleanly; the 4 tables + `generation_usage` columns exist.
- [ ] **RLS:** a signed‑in client **cannot** update its own `user_entitlements` row (attempt must be denied).
- [ ] All 4 edge functions deploy and respond; `generate-interview-plan` returns questions grounded in the resume+JD.
- [ ] **Opening the Interview Prep tab claims NO free trial;** clicking **"Begin interview"** claims exactly one, bound to that application.
- [ ] A second application (for a free user) shows the **paywall**.
- [ ] **Regenerating** a plan after a resume/JD edit **preserves prior `interview_turns`** (history not lost); `is_active` flips instead of deleting.
- [ ] Full flow: locked tab + tooltip → plan → question → feedback with **"Try Responding Again" / "Next Question"** → summary; best attempt counts.
- [ ] `generation_usage` records `interview-plan` / `interview-scoring` rows with token counts.

## 7. Known limitations (by design, out of scope for this pass)
- **Billing is not wired.** The paywall's "Upgrade" is a stub — the server enforces the
  gate and returns an `upgrade_required` signal, but there is no checkout yet. A real
  subscription flow is a separate task.
- **`generation_usage.cost` is logged as `0`.** The Lovable gateway abstracts per‑model
  pricing, so only token counts are captured. A model→rate table would populate `cost`.
- Deferred (Phase 2): RAG scoring corpus, session resumability wiring, synthesis studies.

## 8. File manifest (branch `staging`)
```
supabase/migrations/20260710113516_interview-prep.sql
supabase/functions/get-interview-entitlement/index.ts
supabase/functions/start-interview-session/index.ts
supabase/functions/generate-interview-plan/index.ts
supabase/functions/score-interview-answer/index.ts
supabase/functions/_shared/interviewShared.ts
scripts/seed-interview-preview.mjs
PREVIEW.md                      # local/staging run steps (CLI version of this handoff)
src/lib/interviewPrep/*         # client logic (already builds)
src/components/tabs/InterviewPrep*  # UI
src/pages/ApplicationDetail.tsx     # tab wiring
```

*Full design + QA record lives in the `ExpertInterview` repo under
`docs/features/resuvibe-integration/` (architecture, diagrams, critic + QA reports).*

---

## Addendum — Voice input (audio dictation) for Interview Prep

A universal voice-input option was added (`getUserMedia` + `MediaRecorder` →
server-side transcription). A standalone **test page** exercises it at
`/interview-prep-audio-test` (the live Interview Prep tab is unchanged). Recording
works in-browser today; **live transcripts need one function deployed and one secret**:

1. **Deploy the edge function** `supabase/functions/transcribe-answer/` — accepts the
   recorded audio (webm/mp4), calls the transcription provider, returns `{ text }`.
   Default JWT verification is correct (no `config.toml` change). Audio is **not** persisted.
2. **Set the secret** `OPENAI_API_KEY` on the Supabase project (the function defaults to
   OpenAI `gpt-4o-mini-transcribe`; override the model via `TRANSCRIBE_MODEL`). If the
   Lovable AI gateway exposes an audio-transcription endpoint, point the function there
   instead and reuse `LOVABLE_API_KEY` — it's the single integration point.
3. **No DB change required.** Usage is logged to `generation_usage`
   (`asset_type: 'answer-transcription'`).

Verify on staging: record an answer in Chrome, Firefox, and Safari (macOS + iOS) →
transcript fills the textarea (Firefox is the key case for universality).
