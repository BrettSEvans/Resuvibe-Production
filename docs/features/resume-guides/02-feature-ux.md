# Feature UX Workflow — ResuVibe pSEO Resume Guides + FAQ

> How the pSEO role-guide pages (with FAQ section) work: flows & structure, not visual style. Written by the UX agent (feature mode). Read by UI next (`03-feature-ui.md`). Date: 2026-07-20

**Product type:** GUI web app (public, unauthenticated content pages) — React + Vite + TypeScript, Tailwind, shadcn/ui, react-router. This is new public-facing surface layered onto the existing authenticated ResuVibe dashboard app.

## 1. Primary user flows

**Main flow — organic search to sign-up:**

1. Visitor searches Google for something like "software engineer resume ATS keywords" — no prior context on ResuVibe.
2. Lands on `/resume-guides/{role-slug}` (e.g. `/resume-guides/software-engineer`).
3. Reads the 5 existing content sections (ATS keywords, resume bullets, cover letter structure, STAR interview prep, ResuVibe features).
4. Reads the FAQ section (7 questions, single-open accordion) — resolves remaining objections/doubts.
5. Clicks the CTA at the bottom of the page.
6. Lands in the sign-up flow with the **role pre-filled** as context, so their first in-app experience (baseline profile setup) is already scoped to that role.

**Secondary flow — directory browsing:**

1. Visitor lands on `/resume-guides` (via internal link, sitemap, or direct navigation).
2. Browses roles grouped by category, or searches/filters by role name.
3. Clicks into a specific role's guide page → same as step 3 above.
4. **One-directional linking:** the directory links out to guide pages, but guide pages do **not** link back to the directory. This keeps SEO link equity flowing outward from the directory and keeps a converting reader focused on the CTA rather than re-browsing.

## 2. Entry points & information architecture

- **Primary entry point:** organic search engine results — pages must stand alone and build trust from zero context.
- **Secondary entry point:** the `/resume-guides` directory page.
- **Chrome:** lightweight public header only (logo + minimal nav, following the pattern in `StaticPage.tsx`) — **not** the authenticated `PageShell` (which bakes in an ad-sidebar meant for logged-in users).
- **Routing — naming collision resolved:** the pSEO source doc originally specified `/templates/{slug}`, which collides with the existing authenticated `/templates` route (a logged-in user's saved-template manager, unrelated to this feature). Resolved: **new routes live under `/resume-guides/{slug}` and `/resume-guides`** (index). `/templates` is untouched.
- **No back-link from guide pages to the directory** — see flow 2 above.

## 3. Key screens/views & purpose

### `/resume-guides` — Directory page
Purpose: SEO landing/index surface + self-navigation aid for visitors who want to browse rather than search.
- Roles grouped under category headers (Technology, Product & Design, Marketing & Sales, Finance & Business Operations, People Operations & HR, Legal & Compliance, Data & Analytics, Specialized Professional) — matches the `category` frontmatter already present in each of the 105 source files.
- A search/filter input narrows the list by role name in real time.
- Each role renders as a link/card to `/resume-guides/{slug}`.

### `/resume-guides/:slug` — Guide + FAQ page
Purpose: standalone, trust-building SEO landing page that converts a cold search visitor into a sign-up.
- Renders the existing 5 content sections from the source markdown (`SinglePages/{slug}.md`), driven by the `title`/`slug`/`category` frontmatter.
- **FAQ section** (new): 7 universal questions in an accordion, positioned after section 5, before the final CTA. Content and copy were finalized earlier in this project (see the FAQ template work) — this stage defines *how it behaves*, not the copy itself.
  - Reuses the existing `Accordion` component (`src/components/ui/accordion.tsx`, Radix-based) rather than a custom-built widget.
  - **Single-open** — expanding one question collapses any other open one.
  - **All collapsed on page load** — clean, scannable question list; content is still present in the DOM for crawlers regardless of visual state.
  - Carries **schema.org `FAQPage` structured data** so Google can surface expandable FAQ rich snippets in search results for the long-tail queries these pages target.
- **CTA** at the bottom: role-specific copy, links into sign-up with the role passed as context (query param or route state — exact mechanism is an Architect-stage decision).

## 4. States & feedback

- **Guide page loading:** content skeleton while the markdown file loads — matches the shape of the rendered sections so there's no layout shift.
- **Invalid/missing slug:** routes to the app's existing `NotFound` page — no new error UI needed for this pass.
- **Directory search with no matches:** explicit empty state — `"No roles match '{query}'"` with a prompt to clear the search and browse categories.
- **Accordion interaction:** standard Radix accordion affordances (chevron rotation, `aria-expanded` state) — already built into the existing component, no new interaction pattern needed.

## 5. Edge cases & off-happy-path

- **Empty/no-match directory search** — handled above (explicit empty state, not a blank area).
- **Invalid slug in URL** — handled above (existing 404).
- **A source markdown file missing expected frontmatter** (e.g. no `category`) — out of scope for this workflow stage; flagged to Architect/Engineer as a data-integrity assumption to validate at build time, not a runtime UX state.
- **Mobile/narrow viewports** — the accordion and directory grid must reflow to a single column; no separate mobile-specific flow, just responsive layout (a UI-stage concern, noted here as a constraint).

## 6. Workflow constraints

- Pages must be public and unauthenticated — no auth check, no dashboard chrome.
- Must be crawlable and fast — this is the core SEO value driver of the entire pSEO project; avoid anything that blocks first-contentful-paint (e.g. client-only rendering with a long loading state) — flagged as an architecture-stage concern (SSR/SSG vs. client fetch).
- FAQ accordion must be keyboard-accessible and screen-reader friendly — satisfied by reusing the existing Radix-based `Accordion` component rather than a custom widget.
- Directory page must not link back from guide pages (SEO/focus decision, confirmed above) — this is an intentional one-way IA, not an oversight.

## Wireframes
Declined — none produced. The user opted to skip wireframes for this pass given the structure was already well-defined through the elicitation themes above.

## Deltas (required quality improvements)

| Risk (P0/P1) | Recommendation | Rationale | Prerequisite for next stage? |
|---|---|---|---|
| P0 — URL collision | Route pSEO pages under `/resume-guides/{slug}` and `/resume-guides`, not `/templates/{slug}` as the source doc specified | `/templates` is already a live authenticated route (saved-template manager); reusing it would break routing and confuse IA | Yes — UI/Architect must use the new prefix, not the pSEO doc's original slug scheme |
| P1 — Missing render pipeline | No existing route/component turns `SinglePages/*.md` + frontmatter into a live page; `StaticPage.tsx` is an unused, unwired shell with no markdown rendering | Without this, the 105 source files remain inert content with no way to reach a browser | Yes — Architect must define the data-loading/rendering approach (build-time SSG vs. client fetch) before Engineer builds |
| P1 — SEO rendering strategy undecided | Determine SSR/SSG vs. client-side rendering for `/resume-guides/:slug` before implementation | Client-only rendering with a loading state undermines the project's core SEO goal (crawlers may not wait for JS) | Yes — must be resolved at Architect stage |

---

## Decisions (confirmed)

- New route prefix `/resume-guides/{slug}` (directory: `/resume-guides`), avoiding collision with the existing `/templates` route.
- This is a real, shippable feature — live route + component, not just a content/markdown exercise.
- Entry point is primarily organic search; pages must stand alone.
- CTA sends to sign-up with the role pre-filled as context.
- Lightweight public header (not the authenticated `PageShell`).
- Directory page exists, grouped by category with search/filter; one-way linking only (directory → guide, never guide → directory).
- FAQ accordion: single-open, all collapsed by default, reuses the existing `Accordion` component.
- Invalid slug → existing `NotFound` page. Empty directory search → explicit empty-state message.
- FAQ includes schema.org `FAQPage` structured data for search rich snippets.

## Assumptions

- The exact mechanism for passing "role" into the sign-up flow (query param vs. route state vs. session storage) is left to the Architect stage.
- Source-file data integrity (missing frontmatter fields) is treated as a build-time/data concern, not a runtime UX state, for this pass.
- FAQ question content/copy itself (the 7 questions and their answers) was already finalized earlier in this project and is not re-litigated here — this document defines structure and behavior only.

## Open questions

- SSR/SSG vs. client-fetch rendering strategy for the guide pages — flagged as a P1 Delta above, owned by Architect.
- Whether the directory page needs pagination at 105 roles, or whether grouped-by-category + search is sufficient without it (leaning toward "no pagination needed" given the category grouping, but not explicitly confirmed).

## Next handoff
UI agent → reads this feature workflow + `01-feature-brief.md`, defines look and feel, writes `03-feature-ui.md`.
