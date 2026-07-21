## Goal

Add an MCP (Model Context Protocol) server to this app so AI assistants (ChatGPT, Claude, Cursor, etc.) can read the /FAQ content. Scope is limited to the public FAQ guides — nothing behind Google sign-in, no user data, no application/resume/cover-letter data.

## Auth model

Public, no-login MCP server. The /FAQ content is already fully public (served from `public/guide-index.json`, no RLS, no personalization). No user identity is needed to answer FAQ questions.

Because a public MCP server is callable by anyone on the internet, I'll confirm this choice with a one-question consent prompt before implementing (per Lovable's MCP authoring rules). Only the FAQ tools will be exposed — authenticated tables (applications, resumes, cover letters, interview data, entitlements, profiles, etc.) will not be reachable through MCP.

## What gets exposed

Three read-only tools, all backed by the existing `public/guide-index.json`:

1. `list_faq_guides` — returns the list of FAQ guides (slug, title, category, short description). No input.
2. `get_faq_guide` — input: `slug`. Returns the full guide content (title, category, HTML/markdown body, canonical `/FAQ/<slug>` URL).
3. `search_faq` — input: `query` (string). Case-insensitive substring search across title, description, category, and slug; returns matching guides with the same shape as `list_faq_guides`.

Every tool is marked `readOnlyHint: true`, `openWorldHint: false`. No writes, no database access, no service-role key.

## Files to add

- `src/lib/mcp/tools/list-faq-guides.ts` — `defineTool` wrapping the guide index.
- `src/lib/mcp/tools/get-faq-guide.ts` — `defineTool` returning one guide by slug.
- `src/lib/mcp/tools/search-faq.ts` — `defineTool` running the substring filter.
- `src/lib/mcp/faq-data.ts` — small helper that loads `public/guide-index.json` at build time (via `import ... assert { type: "json" }` or an inline copy) so the emitted Deno function has no filesystem/network dependency at runtime. Keeps `src/lib/mcp/index.ts` import-safe (no env reads, no I/O at module top level).
- `src/lib/mcp/index.ts` — `defineMcp({ name: "resuvibe-faq-mcp", title: "ResuVibe FAQ", version: "0.1.0", instructions: "...", tools: [...] })`. No `auth` field (public server).

## Files to edit

- `vite.config.ts` — add `mcpPlugin()` from `@lovable.dev/mcp-js/stacks/supabase/vite` to the plugins array. The plugin generates `supabase/functions/mcp/index.ts` on build; that file must not be hand-edited.

## Dependencies

- Install `@lovable.dev/mcp-js` and confirm `zod` is present (it already is via existing edge functions).

## Post-authoring steps

- Run `app_mcp_server--extract_mcp_manifest` so Lovable's Agent integrations panel and the connectors list see the new server.
- Deploy the generated edge function via `supabase--deploy_edge_functions` with `function_names: ["mcp"]`. Endpoint will be `https://<project-ref>.supabase.co/functions/v1/mcp`.

## Explicitly out of scope

- No access to `job_applications`, `resumes`, `cover_letters`, `interview_*`, `user_entitlements`, `profiles`, or storage buckets.
- No OAuth / Supabase auth server changes (the app's Google SSO is untouched).
- No changes to the /FAQ pages themselves — this only adds a read-only API surface over the same content.

## Consent step before build

Before writing any code, I'll ask one question confirming a Public (no-login) MCP server is what you want, given anyone on the internet will be able to call these three FAQ tools. Since the data is already published on your public /FAQ pages, this matches the current exposure level — but the confirmation is required.
