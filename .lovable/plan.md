# Interview Prep — Backend Provisioning Plan

## Current state (verified against this project)

- ✅ Tables exist in `public`: `user_entitlements`, `interview_questions`, `interview_sessions`, `interview_turns` (created earlier this thread).
- ✅ All 4 edge functions present and deployed: `get-interview-entitlement`, `start-interview-session`, `generate-interview-plan`, `score-interview-answer` (plus the bonus `transcribe-answer`).
- ✅ Frontend tab, entitlement gating, premium upsell, subway progress, and resume-grounded questions are wired.
- ❌ `public.generation_usage` currently has only `id, user_id, asset_type, edge_function, created_at` — the `input_tokens`, `output_tokens`, `cost` columns from the handoff migration are missing.
- ❓ Need to confirm `LOVABLE_API_KEY` secret is present for the interview functions (existing AI functions already use it, so almost certainly yes).
- ❓ No `CHECK` constraint on `generation_usage.asset_type` was found, so `interview-plan` / `interview-scoring` / `answer-transcription` values will insert cleanly — no ALTER needed there.

The handoff doc's "staging vs prod" framing does not apply — this Lovable Cloud project IS the target. We just finish the missing pieces here.

## Steps

1. **Add token/cost columns to `generation_usage`** via migration:
   - `ALTER TABLE public.generation_usage ADD COLUMN IF NOT EXISTS input_tokens integer NOT NULL DEFAULT 0;`
   - `ADD COLUMN IF NOT EXISTS output_tokens integer NOT NULL DEFAULT 0;`
   - `ADD COLUMN IF NOT EXISTS cost numeric(10,6) NOT NULL DEFAULT 0;`
   - Additive + defaulted → no data risk.

2. **Confirm `LOVABLE_API_KEY` secret** is set for edge functions. If missing, request it via `add_secret`. (Interview functions share the same gateway key used by ~25 existing AI functions, so this should already be satisfied.)

3. **Verify end-to-end on a real application** (no code changes):
   - Open an application with a generated resume → Interview Prep tab unlocks.
   - Free user: "Begin interview" claims trial; second application shows paywall.
   - Regenerate plan after resume edit → prior `interview_turns` retained, old questions flip `is_active=false`.
   - Confirm `generation_usage` rows appear with `asset_type` = `interview-plan` / `interview-scoring` and non-zero token counts once step 1 lands.

4. **Optional — voice input**: `transcribe-answer` function is already deployed and points at the Lovable gateway (not OpenAI). Only action needed is to confirm the "Dictate answer" UI works in Chrome/Firefox/Safari. No new secret required if using the Lovable gateway path.

## Out of scope (by design, per handoff §7)
- Real billing / Stripe checkout for the "Upgrade" CTA.
- Populating `cost` with real per-model pricing (stays 0).
- RAG scoring corpus and session resumability.

## Technical notes
- Migration is a single additive `ALTER TABLE` — no RLS or GRANT changes needed (existing policies cover new columns).
- No `supabase/config.toml` changes — JWT verification defaults are correct for all 4 functions.
- No client code changes required.
