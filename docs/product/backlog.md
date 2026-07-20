# Product Backlog

## pSEO Resume Guides + FAQ (deferred from 02-ux-workflow.md, 2026-07-20)

- [ ] Decide whether the `/resume-guides` directory needs pagination at 105
      roles, or whether category grouping + search is sufficient on its own
- [ ] Validate source-file data integrity (missing/malformed frontmatter in
      `SinglePages/*.md`) at build time — not handled as a runtime UX state
- [ ] Confirm the exact mechanism for passing "role" context into the sign-up
      flow (query param vs. route state vs. session storage) — left to
      Architect stage

## Agent-C System Improvements

### Auto-detect shipped status (Bug fix)
- **Issue:** state.json doesn't automatically recognize when final stage (QA) is approved-complete
- **Root cause:** currentStage points to final stage, but no flag distinguishes "in-progress" vs "fully-shipped"
- **Fix applied:** Added `stageOrder`, `_computed` fields to enable automatic shipped detection
- **Prevention:** Dashboard should check if all stages are `approved-complete` and auto-set status to "shipped"
- **Status:** Fixed in this project; should be applied to agent-c system

---

## Security & Compliance (High Priority)

### TypeScript Type Safety (Deferred APPLY items from architect review)
- [ ] Fix remaining `any` types in components (54 lint errors introduced by strict mode)
  - Priority: High for PII-handling system
  - Files: BatchJobInput, BulletCoach, CoverLetterAgent, CoverLetterRevisions, DashboardCustomizationDialog, DashboardRevisions, DynamicMaterialsSection, etc.
  - Effort: 1-2 days
  - Related: `tsconfig.json` now has `strict: true` enabled

### Test Coverage (Deferred APPLY items from architect review)
- [ ] Add integration tests for RLS policies
  - Verify users can't access others' job applications
  - Test is_linked_or_self() function
  - Verify auth-protected edge functions
  - Effort: 2-3 days

- [ ] Add auth state transition tests
  - Test login/logout flows
  - Test session expiry and token refresh
  - Test inactivity logout (8h timeout)
  - Effort: 1-2 days

- [ ] Add data sanitization tests
  - Test DOMPurify blocks XSS payloads
  - Test HTML input sanitization before storage
  - Test job description and résumé text validation
  - Effort: 1 day

- [ ] Add error boundary tests
  - Test graceful degradation on errors
  - Test error recovery flows
  - Effort: 0.5 days

## Data Retention & Privacy

### Privacy Request Implementation
- [ ] Implement data export endpoint (`POST /api/privacy-request/export`)
  - Package user data as ZIP file
  - Send to user email
  - Log to audit trail
  - Effort: 1 day

- [ ] Implement automated hard delete cron job
  - Delete soft-deleted accounts after 30-day grace period
  - Log to admin_audit_log
  - Effort: 1 day

- [ ] Add user data download feature
  - Allow users to download their résumés/cover letters as ZIP
  - Implement on Settings page
  - Effort: 0.5 days

## Observability & Monitoring (Deferred APPLY items from architect review)

### Error Tracking Integration
- [ ] Integrate Sentry for error tracking
  - Set up Sentry project
  - Initialize Sentry in main.tsx
  - Hook error logger to Sentry
  - Effort: 0.5 days

- [ ] Add performance monitoring
  - Measure resume generation time
  - Track API latency
  - Monitor page load performance
  - Effort: 1 day

### Logging & Debugging
- [ ] Enhance logger.ts with additional context
  - Add request ID tracking for distributed tracing
  - Add performance timing
  - Add user agent/browser info
  - Effort: 0.5 days

## Infrastructure & Security (Deferred APPLY items from architect review)

### Authentication & Session Security
- [ ] Migrate localStorage → httpOnly cookies
  - Requires backend cookie support (Supabase session handling)
  - Eliminates XSS auth token theft vector
  - Effort: 2 days

- [ ] Add periodic token validation
  - Check if token is still valid every 60 minutes
  - Detect server-side revocation (logout on another device)
  - Effort: 0.5 days

### Rate Limiting
- [ ] Implement client-side rate limiting UI
  - Disable "Generate" button during generation
  - Show cooldown timer
  - Prevent button spam
  - Effort: 0.5 days

### Security Monitoring
- [ ] Monitor CSS data exfiltration patterns
  - Review DOMPurify config for CSS injection risks
  - Document policy (style/link tags allowed for resume rendering)
  - Effort: 0.5 days

## Architecture Refactoring (Deferred APPLY items from architect review)

### Component & Hook Coupling
- [ ] Extract data fetching from useApplicationDetail
  - Create queries.ts for data layer
  - Separate concerns: UI state vs. data state
  - Effort: 2-3 days
  - Impact: Improves testability and auditability

### State Management
- [ ] Document single source of truth for each domain
  - Where does active résumé live? (React Query cache? Server state?)
  - Where does application data live?
  - Clarify client cache invalidation strategy
  - Effort: 0.5 days

## Admin Dashboard

### Admin Interface
- [ ] Implement `/admin` page with full functionality
  - User search and management
  - View audit logs
  - Handle privacy requests
  - View generation usage statistics
  - Effort: 2 days

## WebSocket & Real-Time Features (Deferred APPLY items from architect review)

### Job Status Updates
- [ ] Replace polling with WebSocket (job generation status)
  - Real-time updates instead of 2-5 second polling
  - Reduced server load
  - Better UX (no refresh delays)
  - Effort: 2 days

### Live Updates
- [ ] Add live document updates when shared
  - Real-time collab on linked accounts
  - Effort: 3 days (post-MVP)

## Documentation

- [x] Data retention & privacy policy (APPLY 7)
- [x] Admin guide (APPLY 9)
- [x] Supabase security manifest (APPLY 5)
- [ ] User-facing privacy policy
- [ ] Security audit findings summary
- [ ] Architecture deep-dive (04-architecture.md needs to be written)

## Completed in Engineer Phase (from critic APPLY findings)

- [x] Enable TypeScript strict mode (APPLY 1)
- [x] Fix initial `any` type in useApplicationDetail (APPLY 1)
- [x] Add Supabase type definitions (APPLY 1)
- [x] Add env var validation at startup (APPLY 3)
- [x] Create structured error logging utility (APPLY 6)
- [x] Add error logging to auth hooks (APPLY 6)
- [x] Create account linking UI component (APPLY 8)
- [x] Add account linking to profile page (APPLY 8)
- [x] Create data retention policy doc (APPLY 7)
- [x] Create admin guide (APPLY 9)
- [x] Create security manifest for edge functions (APPLY 5)

## Notes

- CSP headers already present in index.html (APPLY 4 — no action needed)
- Account linking table already exists in database (APPLY 8 — UI was the missing piece)
- Most Supabase edge functions already using authGuard (APPLY 5 — documentation was the missing piece)
- Strict TypeScript mode introduced 54 lint errors requiring systematic fixes (prioritize critical paths: auth, data access, PII handling)
