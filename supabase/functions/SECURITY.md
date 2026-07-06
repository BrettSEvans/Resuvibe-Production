# Supabase Edge Functions Security

## Authentication & Authorization

All user-facing edge functions must validate the authenticated user before processing requests.

### Protected Functions (requireUser guard)

The following functions use `authGuard.ts:requireUser()` to ensure only authenticated users can invoke them:

- ✅ `analyze-bullets` — analyzes resume bullets
- ✅ `analyze-company` — analyzes company for job matching
- ✅ `extract-jd-keywords` — extracts keywords from job descriptions
- ✅ `extract-resume-skills` — extracts skills from resumes
- ✅ `extract-resume-text` — extracts text from resume uploads
- ✅ `generate-architecture-diagram` — generates architecture diagrams
- ✅ `generate-dashboard` — generates dashboard HTML
- ✅ `generate-material` — generates cover letters/materials
- ✅ `generate-raid-log` — generates RAID logs
- ✅ `generate-resume` — generates tailored resumes
- ✅ `generate-resume-clarity` — clarifies resume content
- ✅ `generate-roadmap` — generates career roadmaps
- ✅ `generate-summary` — generates profile summaries
- ✅ `parse-job-description` — parses job descriptions
- ✅ `refine-dashboard` — refines dashboard content
- ✅ `refine-material` — refines generated materials
- ✅ `research-asset-best-practices` — researches asset best practices
- ✅ `research-company` — researches company information
- ✅ `resume-diff` — generates resume diffs
- ✅ `score-design-variability` — scores design variations
- ✅ `suggest-assets` — suggests assets
- ✅ `tailor-cover-letter` — tailors cover letters

### Public Functions (no auth required)

- 🔓 `scrape-company-branding` — scrapes publicly available company information (may rate-limit)
- 🔓 `check-duplicate-trial-signup` — server-only utility (not exposed to client)
- 🔓 `campaign-auto-approve` — admin workflow utility (not exposed to client)

### Implementation Pattern

All protected functions follow this pattern:

```typescript
import { requireUser } from "../_shared/authGuard.ts";

export default async (req: Request) => {
  // Validates user JWT and returns authenticated user object
  const user = await requireUser(req);
  
  // User-scoped processing here
  // Use user.id to enforce data ownership and RLS
  
  return response;
};
```

## Data Access Control

**Always use Row Level Security (RLS)** on the database to enforce data ownership. Even authenticated users should only access their own data through database queries.

Key RLS functions:
- `is_linked_or_self(user_id)` — allows user or linked-account users
- `owns_application(application_id)` — verifies user owns the application

## PII Handling

Functions that process PII (résumés, skills, email addresses):
- Must validate user authentication
- Must log access to `admin_audit_log` for sensitive operations
- Should sanitize outputs before returning to client
- Must not log PII to error messages

Protected PII functions:
- `generate-resume`, `generate-resume-clarity`, `tailor-cover-letter`
- `extract-resume-skills`, `extract-resume-text`
- `generate-dashboard`, `refine-dashboard`

## Audit Logging

Critical operations logged to `admin_audit_log`:
- Account deletion (`delete-account`)
- Resume generation (quantity/frequency tracking)
- Admin actions

## Future Improvements

- [ ] Add rate limiting per user (prevent generation spam)
- [ ] Add request signing validation for sensitive functions
- [ ] Log all PII access with user context
- [ ] Implement query timeout limits
