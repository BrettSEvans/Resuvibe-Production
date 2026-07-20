# Feature Brief — ResuVibe pSEO Resume Guides + FAQ

> What & why for the pSEO resume-guides feature on the shipped ResuVibe product. This feature adds a public-facing, unauthenticated content surface (105 role-specific resume guides with FAQ sections) to drive organic search traffic and convert cold visitors into sign-ups. Written by the Sr. Product Manager (feature mode). Read by UX next (`02-feature-ux.md`). Date: 2026-07-20

**Feature type:** Public-facing content pages (unauthenticated, SEO-optimized, conversion-focused).

**Scope of change (existing product areas):**
- **Authentication & routing:** Add new routes `/resume-guides` and `/resume-guides/:slug` (no collision with existing `/templates` authenticated route). **Keep:** existing auth system; no changes to login/session handling.
- **Content/data:** Create 105 markdown-sourced role guides (already unbundled into `docs/pSEO project/SinglePages/*.md`). **Add:** data pipeline to render Markdown into live pages. **Keep:** existing Supabase schema; no new tables.
- **Public header/chrome:** Reuse existing `StaticPage.tsx` pattern (lightweight header, no dashboard sidebar). **Keep:** authenticated `PageShell`; no changes to user dashboard.
- **Components:** Reuse existing Tailwind + shadcn/ui system (Button, Card, Accordion, etc.). **Add:** no new components; extend existing patterns.
- **CTA/sign-up flow:** Link from guide pages into existing sign-up flow, passing role context (role-scoped baseline profile setup). **Keep:** sign-up mechanics; add optional role parameter.

---

## 1. Problem & Pain

**Organic search is an untapped acquisition channel for ResuVibe.**

Most job seekers search Google for "Software Engineer resume tips," "Product Manager interview prep," etc. — they're looking for educational content *before* they know ResuVibe exists. ResuVibe's content platform (role-specific guides, interview prep, resume optimization) is exactly what they need, but that value is hidden behind authentication — search engines can't crawl it, and cold visitors have no way in.

**The pain:** 0% organic search traffic today. Job seekers land on competitor landing pages (generic resume templates, career advice blogs) instead of ResuVibe's deeper, more valuable guidance.

---

## 2. Target Users & Jobs-to-be-Done

**Users:** Job seekers preparing for specific roles (Software Engineer, Product Manager, Data Analyst, etc.) — ages 22–55, actively applying to jobs, stressed about resume quality and interview prep.

**Job they're hiring ResuVibe for:** "Help me understand what hiring managers actually look for in my resume, give me specific examples of strong bullets, and coach me through behavioral interviews — I don't want to waste time on generic advice that doesn't apply to my role."

**Entry point:** Organic search ("software engineer resume ATS keywords," "product manager cover letter," "data analyst interview questions") → lands on role-specific guide → reads FAQ → signs up for ResuVibe.

---

## 3. Current Alternatives

**How they cope today:**
- **Generic resume templates** (Indeed, LinkedIn, Canva) — don't teach *why* things matter, one-size-fits-all.
- **Career advice blogs** (TheMuseLabs, Copyblogger, HubSpot) — detailed and free, but generic (not role-scoped), don't lead to a tool.
- **Glassdoor / blind.com** — real interview questions but no interview coaching.
- **ChatGPT** — fast but generic, doesn't know the applicant's resume or role context.
- **Do nothing** — apply with their current resume, hope it gets through ATS, stress on interviews.

**Why insufficient:** None of these combine role-specific guidance + resume optimization tool + interview coaching in one place. ResuVibe's value prop is the *combination*, not any single piece.

---

## 4. Value Proposition & Differentiation

**Why this, why better:**

ResuVibe's guides are **role-scoped, detailed, and trust-building** — they explain the *why* (40–70% of resumes rejected by ATS, here's the mechanism), show real examples, and acknowledge limitations (honest about what we don't know). This builds trust with cold visitors *before* asking for sign-up.

The sign-up CTA is also role-scoped ("Get ready to ace your Software Engineer interview") — showing the visitor that ResuVibe understands their specific role, not just generic job seekers.

**Against competitors:** Generic content blogs don't have a conversion tool; ChatGPT doesn't have role context or interview coaching; resume templates don't teach. ResuVibe bridges all three.

**Against other resume tools:** Most are ATS-optimization-only; ResuVibe adds interview prep + resume tailoring + cover letter generation. The guides establish authority and trust *before* the tool even loads.

---

## 5. Success Metrics

**Leading indicators (can measure during feature build):**
- All 105 role guides are live and crawlable (no client-only rendering blocking search indexing).
- Pages render in < 1.5s (Core Web Vitals LCP, CLS acceptable for search ranking).
- FAQ accordion is accessible (WCAG AA, keyboard-navigable, screen-reader friendly).

**Lagging indicators (measure 30–90 days post-launch):**
- Organic search traffic: 500+ visitors/month from long-tail role-specific keywords.
- Click-through rate on CTA: 2–5% of guide-page visitors click "Start free trial."
- Sign-up conversion: 10–20% of CTA clickers complete baseline profile setup.
- **North star:** Organic sign-ups (from pSEO guides) = 5–10% of total monthly sign-ups (indicates feature is working as acquisition lever).

---

## 6. Scope & Non-Goals

**What this feature IS:**
- 105 public, unauthenticated role-specific resume guides.
- Each guide has 5 content sections (ATS keywords, resume bullets, cover letter, STAR interview prep, ResuVibe features) + FAQ accordion.
- SEO-optimized (server-rendered or static, crawlable by search engines).
- Converts cold visitors → sign-ups with role-scoped CTA.
- Reuses existing Tailwind + shadcn/ui component system, no new design tokens.

**What this feature is NOT:**
- Not a blog platform or CMS — guides are markdown-sourced, not user-editable.
- Not a premium/paywall feature — all guides are free (the paywall is ResuVibe's tools, not the guides).
- Not an authenticated feature — no user accounts required to read guides.
- Not a redesign of the existing dashboard — guides are a separate public surface.
- Not full-stack refactoring — minimal changes to existing routes, auth, or components.
- Not a global search / browse-all-roles feature yet — directory page groups by category + search (no pagination or advanced filtering in v1).

---

## 7. Constraints & Risks

**Constraints:**
- **Content source:** 105 markdown files are already written (in `docs/pSEO project/resuvibe-all-100-pseo-pages.md`), unbundled into `SinglePages/*.md`. No additional content writing needed.
- **Timeline:** If architecture+engineering+QA each take ~1 week, feature is live in 3–4 weeks.
- **Tech stack:** Must use existing React + Vite + Tailwind + shadcn/ui; no new frameworks or design systems.
- **SEO requirement:** Pages must be server-rendered or statically generated (crawlers must not wait for JS). This is a prerequisite architectural decision.

**Risks:**
- **P0 — Rendering strategy:** If pages are client-only with a loading state, crawlers may not wait for JS to finish, hurting SEO (undermines the feature's core value). Mitigation: decide SSR/SSG before engineering.
- **P1 — Role context passing:** If CTA doesn't pass the role slug into sign-up, the baseline profile setup won't be role-scoped. Mitigation: finalize mechanism (query param vs. route state) in architecture.
- **P1 — Source data integrity:** If any source markdown is missing required frontmatter (`title`, `slug`, `category`), the page won't render. Mitigation: validate at build time, not runtime.

---

## 8. Business Model & Monetization

**How this makes money:** Indirectly (acquisition lever).

- **Not directly:** Guides are free, no paywall.
- **Indirectly:** Drives organic sign-ups → free tier users (with ad-sidebar revenue) → some convert to Premium ($10/mo) → higher customer lifetime value from lower-CAC acquisition.

**Expected unit economics:**
- Organic sign-ups from pSEO: 5–10% of monthly sign-ups (low CAC vs. paid ads).
- Conversion to Premium: baseline 5–10% (same as current free-tier conversion).
- **Net:** Each organic sign-up has ~2–3x higher LTV vs. paid ads due to lower CAC.

---

## Decisions (Confirmed)

- Feature is real, live, public — not a content-only exercise.
- Routes: `/resume-guides` (directory) and `/resume-guides/:slug` (guide page).
- 105 roles, grouped by category, with search/filter.
- FAQ accordion, single-open, all collapsed on load.
- Warm, conversational tone; trust through substance (content-forward design).
- No custom imagery (text-driven pages).
- WCAG AA accessibility compliance.
- Role-scoped CTA: "Start your free trial with ResuVibe."

---

## Assumptions

- Source markdown files are complete and consistent (no missing frontmatter).
- Architect will decide SSR/SSG rendering strategy.
- Role context passing mechanism will be defined by Architect.
- Feature reuses existing Tailwind + shadcn/ui; no new design system.
- FAQ content (7 questions) is finalized; UX/UI stages define only *how* it behaves, not what it says.

---

## Open Questions

- Should directory pagination be added if 105 roles load slowly, or is category grouping + search sufficient? (Likely defer to v2.)

---

## Next Handoff

UX agent → reads this feature brief + existing `02-ux-workflow.md`, refines if needed, writes `02-feature-ux.md` (feature-scoped version). Then UI → `03-feature-ui.md`, then Architect → `04-feature-architecture.md`, etc.
