# Changelog

## Unreleased

- Commit: 8506f77868919d47501e8329c3223c1f33b40792
- Branch runtime scope: run this branch across both the frontend app and backend/Supabase functions so the V2 UI and generation endpoints stay in sync.
- Added the feature-flagged V2 single-user workflow, active by default through `FUTURE_FLAG_SINGLE_USER`.
- Added a unified local-session application form for job details, base resume text, and base cover-letter text.
- Added in-memory generated result handling, session warning copy, resume/cover-letter tabs, and copy/PDF/DOCX export actions.
- Added focused tests for the feature flag, in-memory session store, and V2 workflow screens.
