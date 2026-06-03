## Goal

Copy one complete job application (Brett Evans → "primer") from the source Lovable project (`08bcecff-2a74-4a5b-9bf5-8b5d373e4a90`, project name "ResuVibe") into this project, including every related DB row and every referenced storage object.

This is a one-time data migration, not a product feature. No UI changes.

## Prerequisites I need from you

1. **Source project Supabase URL** and **service-role key** — added via the secrets tool as `SOURCE_SUPABASE_URL` and `SOURCE_SUPABASE_SERVICE_ROLE_KEY`. I'll use them once, then you rotate the source key in the source project's settings.
2. **Target owner**: there is no Brett profile in this project. Tell me which existing user in *this* project should own the copied application (email or user_id). If you want, I can create a placeholder profile for `brett@saasless.ai` — but they'd need to sign up to actually log in and see it.
3. Confirm "primer" = the application whose `company_name ILIKE '%primer%'`. If there's more than one, I'll pick the most recent unless you say otherwise.

## What gets copied

Both projects share the same schema, so this is a 1:1 row copy with id remapping.

**Primary row**
- `job_applications` (one row) — all 40 columns kept verbatim except: new `id`, new `user_id` (target owner), `source_resume_id` remapped to the new resume id, `resume_style_id` / `persona_id` nulled if not present in target, `deleted_at`/`deleted_by` cleared.

**Related rows (FK = application_id)**
- `resume_revisions`
- `cover_letter_revisions`
- `dashboard_revisions`
- `executive_report_revisions`
- `raid_log_revisions`
- `roadmap_revisions`
- `architecture_diagram_revisions`
- `generated_assets` + `generated_asset_revisions`
- `pipeline_stage_history`
- `asset_download_signals`

**User-scoped rows referenced by the application**
- `user_resumes` — the source resume row (if `source_resume_id` is set), reassigned to the target user, `is_active=false` to avoid clobbering their current active resume.

**Storage**
- `resume-uploads` (private): download by `storage_path` from source, re-upload to target under a new path scoped to the target user id, update `user_resumes.storage_path`.
- `dashboard-assets` (public): scan `dashboard_html`, `branding`, `company_icon_url`, and revision HTML for URLs matching the source project's `dashboard-assets` bucket; download each, re-upload to target, rewrite URLs in the copied row.

Tables explicitly **not** copied (out of scope or user-global): `profiles`, `user_roles`, `user_subscriptions`, `user_style_preferences`, `resume_prompt_styles`, `dashboard_templates`, `asset_best_practices`, `system_documents`, `prompt_log`, `generation_usage`, `qa_*`, `stories`/`epics`/`sprints`.

## How it will run

A throwaway Deno script at `scripts/copy-application.ts` (not wired into the app, not deployed):

1. Connect to source with `SOURCE_SUPABASE_URL` + `SOURCE_SUPABASE_SERVICE_ROLE_KEY`.
2. Connect to target with this project's `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (already in secrets).
3. Resolve Brett's `user_id` in source by `profiles.email ILIKE '%brett%'`.
4. Find the application: `company_name ILIKE '%primer%'`, newest first, pick one.
5. Pull the row + every related row listed above into memory.
6. Download storage objects (resume PDF + any dashboard assets referenced).
7. In a target transaction-equivalent sequence: insert `user_resumes` (new id) → insert `job_applications` (new id, remapped FKs, rewritten URLs) → insert each related table in dependency order with remapped `application_id`.
8. Upload storage objects to target buckets under target-user paths.
9. Print a JSON summary: new application id, new resume id, counts per table, list of storage paths uploaded.

I'll execute it via `code--exec` in the sandbox once and then delete `scripts/copy-application.ts`. No production code paths touch the source project.

## Safety

- Source service-role key is used read-only by the script.
- All inserts use fresh UUIDs — no collision with existing rows.
- `user_resumes.is_active=false` on the imported resume so the target user's current active resume is preserved.
- If any step fails mid-way, I'll print what was inserted so you can decide whether to keep partial state or run a cleanup query.

## Open questions (answer before I implement)

1. Which target user owns the copy? (email or user_id, or "create placeholder for brett@saasless.ai")
2. Confirm "primer" match heuristic, or give me the exact source `job_applications.id`.
3. OK to add `SOURCE_SUPABASE_URL` and `SOURCE_SUPABASE_SERVICE_ROLE_KEY` as project secrets for this one run?
