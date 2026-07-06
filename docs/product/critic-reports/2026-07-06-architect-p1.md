# TECHNICAL CRITIC REPORT — Architect Stage

**Project:** Resuvibe Production  
**Date:** 2026-07-06  
**Pass:** 1 (single pass)  
**Status:** ISSUES FOUND

---

## Executive Summary

Resuvibe is a **full-stack React + Supabase SPA** for career development (résumé building, job applications, cover letters, dashboards). The system handles **PII** (résumés, skills, personal data, email addresses) and requires **OAuth + RLS** (Row Level Security) for access control.

**Overall Assessment:** Solid foundational architecture with good security patterns at the database layer. The system is coherent and mostly well-structured, but has **5 significant architectural issues** and **3 minor oversights** that require attention before production deployment with PII.

---

## Findings by Criterion

### 1. **Engineering Best Practices** — ISSUES FOUND (Significant)

#### **1.1 — TypeScript strictness gap**  
**Severity:** Significant  
**APPLY**

**File:** `src/lib/api/jobApplication.ts:58`  
**Issue:** Using `any` type for sibling navigation query results instead of proper typing.
```typescript
supabase.from("job_applications").select("id").order("created_at", { ascending: false })
  .then(({ data }) => {
    if (data) setSiblingIds(data.map((d: any) => d.id));  // ← any type
  });
```

This creates type-safety gaps for PII-handling code. With 225 .ts/.tsx files, wider `any` usage likely exists.

**Guidance:** 
- Enforce `strict: true` in `tsconfig.json` and enable `noImplicitAny: true` 
- Create a strict type for Supabase responses: `type JobApplicationRow = { id: string }`
- Test by running `npm run lint` and `tsc --noEmit` to find all violations

---

#### **1.2 — Test-driven development gap**  
**Severity:** Significant  
**APPLY**

**Files:** 14 test files for 225 source files = ~6% test density  
**Issue:** Insufficient test coverage for a PII-handling system. Critical paths untested:
- Database access control (RLS) verification
- Auth token refresh and expiry flows
- Sensitive data sanitization (DOMPurify usage)
- Error recovery in generation failures
- Concurrent request handling (race conditions)

**Guidance:**
- Add integration tests for RLS policies (test that users can't access others' data)
- Test auth state transitions (login, logout, session expiry, token refresh)
- Test that HTML sanitization blocks XSS payloads
- Test error boundaries and graceful degradation
- Aim for >70% coverage on auth, data access, and security paths

---

### 2. **Upstream Consistency** — PASSES

The app correctly honors no PM/UX/UI upstream artifacts yet (greenfield adoption). Routes, auth flows, and data models align with expected career-platform behavior.

---

### 3. **Prior-Artifact Coherence** — PASSES

This is the architect stage reviewing existing implementation. No `04-architecture.md` exists yet, so the review assesses **what was actually built** against sound principles. The system follows coherent patterns.

---

### 4. **Correctness & Soundness** — ISSUES FOUND (Minor)

#### **4.1 — localStorage session storage (XSS risk)**  
**Severity:** Significant  
**APPLY**

**File:** `src/integrations/supabase/client.ts:13`  
```typescript
storage: localStorage,  // ← XSS vulnerability surface
```

**Why it matters:** If the app has any XSS vulnerability (unsanitized user input rendered as HTML), attackers can steal auth tokens from localStorage. This is a known attack vector.

**Mitigations in place:**
- ✅ DOMPurify is used to sanitize AI-generated HTML
- ✅ React escapes string interpolations by default
- ❌ But user input fields (job description, résumé text) are not systematically validated/sanitized before storage

**Guidance:**
- Consider `httpOnly` cookies as a longer-term migration (requires backend cookies support)
- For now: audit all user input fields for unescaped rendering
- Add CSP header to prevent `eval()` and inline script injection
- Validate/sanitize user résumé/job description text before storage (not just AI output)

---

#### **4.2 — Missing error context in async operations**  
**Severity:** Minor  
**APPLY**

**Files:** Multiple async flows lack granular error capture.  
**Example:** `src/lib/api/jobApplication.ts:92` — generic `.catch()` swallows context.

```typescript
supabase.from("profiles")
  .update({ last_sign_in_at: new Date().toISOString() })
  .eq("id", existingSession.user.id)
  .then(() => {});  // ← fires and forgets; errors are lost
```

**Guidance:**
- Add structured error logging: `console.error({ context: 'last_sign_in_update', userId, error })`
- Use error boundaries + toast notifications for user-facing failures
- Log auth token refresh failures to detect session expiry issues

---

#### **4.3 — Session persistence does not validate server state**  
**Severity:** Minor  
**DEFER**

**File:** `src/hooks/useAuth.ts:39`  
```typescript
supabase.auth.getSession()  // ← trusts localStorage; doesn't verify on server
```

Supabase automatically validates tokens, so this is **low risk** but worth documenting: if a token is revoked server-side (user logged out on another device, permissions revoked), the client won't know until the token expires.

**Guidance (deferred):**
- Add a periodic token validation check (e.g., every 60 min) for critical operations
- Current inactivity logout (8h) is reasonable; documented in `useInactivityLogout.ts`

---

### 5. **Completeness** — ISSUES FOUND (Significant)

#### **5.1 — Missing auth guard documentation on Supabase Edge Functions**  
**Severity:** Significant  
**APPLY**

**File:** `supabase/functions/_shared/authGuard.ts` (newly added, 2026-07-06)

The latest migration (20260706202217) shows an auth guard was created. However:
- ❌ No documentation on how it's integrated into edge functions
- ❌ Unclear which functions use it vs. don't
- ❌ No validation that all sensitive functions have it

**Guidance:**
- Add a comment in each edge function: `// ✅ Protected: authGuard validates user before processing`
- Create a manifest: `supabase/functions/SECURITY.md` listing which functions are protected
- Audit all 27 edge functions to ensure they validate user context

---

#### **5.2 — No comprehensive data retention / deletion policy**  
**Severity:** Significant  
**APPLY**

**Related:** `src/pages/PrivacyRequest.tsx` exists, but no implementation details on what it does.

**Why it matters:** The system handles PII (résumés, emails, personal skills). EU GDPR and similar regulations require:
- Clear data retention windows
- User right-to-be-forgotten implementation
- Audit trail for deletions

**Guidance:**
- Document data lifecycle: how long is PII retained?
- Implement hard delete (not soft delete) for user accounts on request
- Log all deletions to `admin_audit_log` table (already exists)
- Test PrivacyRequest flow end-to-end

---

### 6. **Seam & Interface Integrity** — ISSUES FOUND (Significant)

#### **6.1 — Supabase client configuration relies on environment variables; no validation**  
**Severity:** Significant  
**APPLY**

**File:** `src/integrations/supabase/client.ts:5-6`  
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
```

**Issue:** If either env var is missing or malformed, `createClient()` silently fails or creates an invalid client. No validation at startup.

**Guidance:**
- Add a validation function in `main.tsx`:
```typescript
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Missing Supabase env vars");
}
```
- This ensures the app fails fast at startup, not at first user action

---

#### **6.2 — Component/hook coupling: UI state tightly bound to data fetching**  
**Severity:** Minor  
**DEFER**

**Files:** `src/hooks/useApplicationDetail.ts` has 200+ lines mixing data fetching, state management, and business logic.

This isn't breaking, but creates maintenance friction: refactoring queries requires touching the UI hook.

**Guidance (deferred):**
- Gradually extract data-fetching logic into a separate `queries.ts` file
- Use React Query's hooks to decouple fetch logic from components
- This is architectural debt, not a blocker

---

#### **6.3 — API response contracts are untyped**  
**Severity:** Minor  
**APPLY**

**File:** `src/lib/api/jobApplication.ts:39–57` — `analyzeCompany()` returns typed response, but most functions return implicit `any`.

```typescript
export async function streamDashboardGeneration({...}) {
  // No return type documented; consumers guess at onDelta/onDone signatures
}
```

**Guidance:**
- Add explicit return types to all Supabase edge function calls
- Document callback signatures: `(delta: string) => void`

---

### 7. **Risk, Scalability & Operability** — ISSUES FOUND (Significant)

#### **7.1 — No observability / structured logging**  
**Severity:** Significant  
**APPLY**

The app logs errors to the browser console (`console.error`), but:
- ❌ No centralized error tracking (Sentry, LogRocket, etc.)
- ❌ No request/response logging for Supabase queries
- ❌ No performance monitoring (time to interactive, API latency)

With PII and background jobs, unobserved failures are dangerous.

**Guidance:**
- Add a logging service that captures: `{ timestamp, userId, action, error, context }`
- Integrate Sentry (free tier) or similar for production error tracking
- Add performance marks: `performance.mark('resume_generation_start')` / `.mark('resume_generation_end')`
- This is critical for debugging PII issues and user support

---

#### **7.2 — Background job status is unreliable**  
**Severity:** Minor  
**DEFER**

**Files:** `src/hooks/useBackgroundJob.ts` polls for job status, but:
- Polling interval is fixed; doesn't adapt if backend is slow
- No exponential backoff if polling fails
- No user notification if job dies silently

**Guidance (deferred):**
- Add WebSocket or server-sent events (SSE) for real-time job status
- For now, document polling behavior and timeout

---

#### **7.3 — Rate limiting not implemented on client side**  
**Severity:** Minor  
**DEFER**

Users can spam "Generate Resume" button, flooding Supabase edge functions. Supabase has built-in rate limits, but:
- No client-side debouncing visible
- User sees multiple failures before success

**Guidance (deferred):**
- Add button disable + cooldown timer while generation is in progress
- Document server-side rate limit behavior

---

### 8. **Oversights** — ISSUES FOUND

#### **8.1 — Account linking (`account_links` table) lacks user-facing UI**  
**Severity:** Minor  
**APPLY**

**File:** Latest migrations show `account_links` for shared account access, but:
- ❌ No Settings/Profile UI to view or manage linked accounts
- ❌ User has no way to know their account is linked to another user
- ❌ No audit trail for who linked accounts

**Guidance:**
- Add a "Linked Accounts" card to `/profile` page
- Allow primary account to disconnect linked accounts
- Log all link/unlink actions to `admin_audit_log`

---

#### **8.2 — Admin role is not documented**  
**Severity:** Minor  
**APPLY**

**Files:** Multiple migrations reference `has_role(auth.uid(), 'admin')`, but:
- ❌ No documentation on how to grant admin role
- ❌ No admin dashboard visible in the app (route `/admin` exists but no nav)
- ❌ Unclear what admin can do

**Guidance:**
- Document admin capabilities: manage users, view audit logs, delete PII
- Add a private admin onboarding guide in `docs/admin.md`
- Ensure `/admin` route is gated and accessible only to admins

---

#### **8.3 — DOMPurify config allows `<style>` and `<link>` tags**  
**Severity:** Minor (acceptable, but worth noting)  
**DEFER**

**File:** `src/lib/sanitizeHtml.ts:21`  
```typescript
ADD_TAGS: ["style", "link"],
```

This is intentional (for resume rendering), but:
- If a compromised AI API injects CSS that exfiltrates data, it could leak info
- Browser sandbox + CSP mitigate this, but document the trade-off

**Guidance (deferred):**
- Add a comment explaining why `<style>` is allowed (resume formatting)
- Monitor for CSS data exfiltration patterns in audit logs

---

## Summary Table

| Criterion | Status | Issues | Severity |
|-----------|--------|--------|----------|
| 1. Best Practices | ❌ Issues | TypeScript strictness, test gaps | Significant |
| 2. Upstream Consistency | ✅ Passes | — | — |
| 3. Prior-Artifact Coherence | ✅ Passes | — | — |
| 4. Correctness & Soundness | ❌ Issues | localStorage XSS surface, error handling gaps | Significant / Minor |
| 5. Completeness | ❌ Issues | Auth guard integration, data retention policy | Significant |
| 6. Seam & Interface Integrity | ❌ Issues | Config validation, API contracts | Significant / Minor |
| 7. Risk, Scalability & Operability | ❌ Issues | No observability, job polling unreliable | Significant / Minor |
| 8. Oversights | ❌ Issues | Missing account linking UI, undocumented admin | Minor |

---

## Issues Summary

**APPLY (Engineer auto-fixes these):**
1. Fix TypeScript `any` types — enforce strict mode
2. Add XSS defense audit — CSP headers, input sanitization
3. Increase test coverage — RLS, auth, sanitization
4. Document/audit auth guards on edge functions
5. Implement data retention policy + deletion flow
6. Add env var validation at startup
7. Add structured error logging + observability
8. Add account linking UI to profile
9. Document admin role + capabilities

**DEFER (record in backlog):**
1. Migrate localStorage to httpOnly cookies
2. Validate server-side token revocation
3. Refactor useApplicationDetail coupling
4. Implement WebSocket job status instead of polling
5. Add client-side rate limiting UI
6. Add CSS exfiltration monitoring

---

## Recommendations for Production

**Before going live with PII:**

1. ✅ **Database security is solid.** RLS policies are properly implemented with `is_linked_or_self()` pattern.
2. ✅ **HTML sanitization is in place.** DOMPurify correctly blocks XSS in AI-generated content.
3. ❌ **But test coverage must increase.** Aim for >70% coverage on auth/data-access paths.
4. ❌ **And observability must be added.** You need logs + monitoring to debug PII incidents.
5. ❌ **And user consent flows must be complete.** Verify Privacy Request, Cookie Consent, and data deletion work end-to-end.

**Timeline:** Address APPLY findings before staging; DEFER items can go to backlog post-launch.

---

## Next Steps

The engineer will read this report and auto-apply all **APPLY** findings. Once applied, return control to the project manager for approval and advancement to the **engineer** (code review) stage.

**Action:** Engineer auto-applies. Await signal to advance.
