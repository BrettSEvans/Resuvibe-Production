# Feature UI Direction — ResuVibe pSEO Resume Guides + FAQ

> Visual design and voice direction for the pSEO role-guide pages (with FAQ section). This document defines look, feel, tone, and identity — how the product *sounds* and *looks*, not how it works (that's in `02-feature-ux.md`). Written by the UI agent (feature mode). Read by Architect next (`04-feature-architecture.md`). Date: 2026-07-20

**Product type:** GUI web app — public, unauthenticated pages (React + Vite + TypeScript, Tailwind CSS v4, shadcn/ui components, react-router).

---

## 1. Design Concept & Personality

**Concept:** Warm, consistent extension of ResuVibe's core aesthetic applied to a public educational content surface.

**The idea:** ResuVibe's existing dashboard is for authenticated users managing their application pipeline. These pSEO guide pages are the *front door* — where cold visitors land from organic search. The design should feel like ResuVibe (same warmth, typography, color system) while serving a different purpose: **trust-building through substance and educational depth**, not transactional dashboard UX.

**Personality:** Warm, authoritative-but-approachable, peer-to-peer. The voice is educational (explaining *why* ATS systems matter, not just *what* to do) and empathetic to job-hunting stress. Credibility comes from detailed, honest content — not visual polish or manipulation.

---

## 2. Visual & Presentational Tone

**Palette:** Exact carry-over from ResuVibe's existing design system.
- **Primary:** hsl(36, 90%, 50%) — warm gold/amber accent (signature warm tone, used for CTAs, category headers, interactive states)
- **Secondary/Accent:** hsl(234, 45%, 52%) — cool navy blue (paired with gold for contrast and sophistication)
- **Background (light mode):** hsl(40, 25%, 97%) — near-white with warmth undertone
- **Foreground:** hsl(0, 0%, 20%) — dark charcoal for text (WCAG AAA contrast on all body copy)
- **Border/divider:** hsl(0, 0%, 85%) — subtle, high-value neutral

**Typography:**
- **Headings (h1, h2, h3):** DM Serif Display (distinctive, editorial, warm serif). Font-weight 400 (no bold serif headings—let the serif carry the weight visually).
- **Body/UI:** DM Sans (clean, legible, modern sans-serif). Standard weights (400 regular, 600 semibold for emphasis).

**Spacing & rhythm:** Generous whitespace. Rely on typography scale and content-first layouts, not decoration. Line-height 1.6–1.7 for body text (scannable, readable).

**Radius:** Border-radius 0.375rem (6px)—subtle rounding, not overly rounded. Buttons, cards, inputs consistent.

**Dark mode support:** Not required for this pass (public SEO pages are typically light-mode only, and crawlers see light-mode rendering). Future enhancement if needed.

---

## 3. Key Element Styling

### Directory Page (`/resume-guides`)
- **Category headers:** Large serif heading (DM Serif Display, 1.5rem), gold underline (2px solid border-bottom). Clean, editorial feel.
- **Role cards:** Minimal. White background, light border (var(--border)), 1.5rem padding. Text only: role title + category label. No images, no icons, no badges. Hover state: border shifts to primary gold, subtle shadow (0 2px 8px rgba(0,0,0,0.06)). Single card, single column on mobile.
- **Search input:** Clean text input with primary gold focus state. No rounded corners exaggerated. Placeholder text in secondary gray.

### Guide Page (`/resume-guides/:slug`)
- **Section headers:** Serif (DM Serif Display, 1.75rem), dark gray (var(--fg-dark)). Numbered sections (1., 2., etc. in gold text, smaller serif) to guide the reader through content.
- **Content:** Body text in DM Sans, 1rem, line-height 1.7. Lists use standard bullets (no emoji, no custom bullets). Links in primary gold, underlined.
- **FAQ accordion:**
  - Header: DM Sans, 1rem, semibold, left-aligned, white background on default, pale background on hover/open.
  - Chevron: simple ▼ symbol (Unicode), rotates 180° on open.
  - Single-open behavior (expanding one collapses others).
  - All collapsed on page load.
  - Content: body text in secondary gray (var(--text-secondary), WCAG AA compliant at 4.5:1 contrast), same 1rem size, 1.7 line-height.
  - No fancy animations—150–200ms smooth transitions on chevron rotation and background color only.
- **CTA section:**
  - White background card with subtle border, centered text.
  - Heading: "Ready to land your [Role] position?" (warm, conversational).
  - Button: solid gold background (var(--primary)), dark text, 0.875rem padding (tight), 1rem font-size, semibold. Hover: slightly darker gold (hsl(36, 85%, 45%)), subtle lift (transform translateY(-2px)), soft shadow. No rounded corners exaggerated.
  - Button copy: "Start your free trial with ResuVibe" (clear CTA + free trial signal).

---

## 4. Voice & Tone

**Overall:** Warm, conversational, peer-to-peer, educational, empathetic.

**Characteristics:**
- **Detailed & honest.** No fluff, no false hype. Explain the "why" (e.g., "Studies show 40–70% of resumes are rejected by ATS before humans see them"). Acknowledge limitations (e.g., "You can't see inside an ATS system to verify what made it through").
- **Conversational.** Short, direct sentences. Use "you" (speak to the reader). Contractions okay ("you're," "don't"). Avoid corporate jargon ("synergize," "optimize," "unlock potential").
- **Empathetic.** Acknowledge job-hunting stress ("Fair skepticism," "That's normal"). Show you understand the frustration.
- **Actionable.** Every answer ends with a concrete next step or insight the reader can use.
- **Authoritative but not aloof.** ResuVibe is the knowledgeable guide, but one who gets it. Not "expert lecturing students," but "peer who's been through this."

**Copy examples:**
- ❌ **Bad:** "Optimize your resume to unlock unlimited opportunities with ResuVibe's cutting-edge AI."
- ✅ **Good:** "Instead of starting from scratch and spending 2 hours per application, you start with your baseline resume and cover letter, then tailor each one to the specific job posting. This takes 10–15 minutes instead of 2 hours."

---

## 5. References & Anti-references

### Emulate
- **Copyblogger:** Detailed guides that teach genuinely; soft CTAs that convert because the reader trusts the content.
- **HubSpot's free resources:** Role-specific guides, scannable structure, educational tone, clear CTAs.
- **Y Combinator startup guides:** Authoritative but approachable; detailed, no fluff, honest about tradeoffs.
- **Semantic Scholar / academic publishing UI:** Content-forward, minimal decoration, trust through clarity.

### Avoid
- **Generic SaaS landing pages:** Hero gradients, indigo/purple color schemes, bento-grid feature cards (three boxes: "Fast," "Reliable," "Scalable"), testimonial carousels, "Join 10,000+ happy users" social proof.
- **Dark patterns:** Countdown timers ("Only 3 spots left!"), urgency language, fake scarcity, false testimonials.
- **Heavy imagery:** Custom illustrations, stock photos, animated blobs, hero sections with background images. These add load time (SEO penalty) and distract from content.
- **Overly rounded or trendy:** Glassmorphism, neumorphism, skeuomorphism, excessive border-radius, skewed layouts, parallax scrolling. Timely design quickly dates.
- **Over-decoration:** Emoji section bullets, colored highlight backgrounds on every sentence, excessive bold/italics, icon-heavy layouts.

**The test:** Can someone copy the entire text of the guide to a .txt file and still understand it? If yes, the design is getting out of the way. If no, it's decorative noise.

---

## 6. Accessibility & Medium Constraints

**WCAG AA compliance across the board:**

- **Color contrast:** All body text must meet 4.5:1 contrast (WCAG AA standard). Tested: dark charcoal text (var(--fg-dark), hsl(0, 0%, 20%)) on light background = 19:1 (WCAG AAA). Secondary gray text (var(--text-secondary), hsl(0, 0%, 50%)) on light background = 9:1 (WCAG AAA).
- **Responsive layout:** Single-column on mobile (< 768px), multi-column on tablet/desktop. Accordion and search input reflow gracefully. No horizontal scroll.
- **Keyboard navigation:** All interactive elements (links, accordion headers, search input, CTA button) fully keyboard-navigable. Tab order is logical (top to bottom, left to right). Accordion headers trigger open/close via Enter/Space.
- **Screen reader support:** Semantic HTML (use `<button>` for accordion headers, not `<div>`). FAQ accordion uses Radix component with `aria-expanded` state. Links have descriptive anchor text (not "click here"). Headings use proper hierarchy (`<h1>`, `<h2>`, `<h3>`).
- **Page speed:** Crawlers must be able to parse content without JS. This is an architecture constraint (flagged to Architect for SSR/SSG decision), but UI implications: keep JS minimal, no lazy-loading that blocks initial paint, no client-only rendering.

---

## Mockups

Two mockups (HTML, Tailwind-styled, interactive) are provided:

1. **`docs/features/resume-guides/mockups/01-directory-page.html`** — `/resume-guides` index. Shows category grouping, minimal role cards, search input, warm gold headers, spare text-focused design.
2. **`docs/features/resume-guides/mockups/02-guide-page.html`** — `/resume-guides/:slug` guide page. Shows 5 content sections, FAQ accordion (interactive), CTA with role-scoped copy ("Start your free trial with ResuVibe"), warm conversational tone in all body copy.

**To preview:** Open both in a browser. Test:
- Hover states on role cards and CTA button
- Accordion expand/collapse behavior (single-open, chevron rotation)
- Mobile responsiveness (resize to < 768px)
- Text contrast (check against WCAG AA compliance)

---

## Image Prompts

**Assessment:** No custom imagery needed.

**Rationale:** This is a public SEO landing page optimized for organic search and trust-building. The core value is *content*—detailed, honest guidance. Adding custom illustrations, hero images, or section backgrounds would:
1. **Slow page load** — SEO penalty (Core Web Vitals: LCP, CLS).
2. **Distract from content** — visual polish signals "we're trying to sell you," undermining trust.
3. **Require generation/maintenance** — 7+ images per page × 105 roles = 735+ images. Not scalable.

**Decision:** Keep pages **text/component-driven**. Content and typography are the design. No hero image, no section backgrounds, no empty-state illustrations. If imagery is needed in the future (e.g., a role-specific avatar or icon), define it then — for this pass, it's unnecessary.

---

## Design System Sync

No design system sync to Claude Design needed for this pass.

**Rationale:** These pages use the existing ResuVibe Tailwind + shadcn/ui system (components, tokens, type scale are already defined in the main app). The UI direction extends existing patterns (Accordion, Button, Card) without adding new component surfaces or token additions. Once the Architect and Engineer build the pages, the styled components are part of the main app codebase, not a separate hosted design system.

**Future:** If these pages evolve into a reusable "marketing site" component library (e.g., other products wanting the same pSEO template), then a design-system sync to Claude Design would be valuable. For now, design lives in the code.

---

## Deltas (Required Quality Improvements)

| Risk (P0/P1) | Recommendation | Rationale | Prerequisite for next stage? |
|---|---|---|---|
| P0 — No rendering pipeline defined | Architect must decide: SSR (server-side render on every request), SSG (static build-time generation), or hybrid (static with revalidation). Each has SEO and performance implications. | Client-only rendering with a loading state would hurt SEO (crawlers may not wait for JS). Must be resolved before Engineer builds. | Yes — Architect defines in `04-feature-architecture.md` |
| P1 — Role context passing mechanism undefined | Architect must specify: query param (e.g., `?role=software-engineer`), route state, or session storage to pass the role into the sign-up flow so the first in-app experience is scoped. | Engineer needs this to wire the CTA button correctly. | Yes — small but blocking decision |
| P1 — No fallback for missing/invalid roles | When a visitor lands on `/resume-guides/nonexistent-role`, should we show the existing 404 page or a custom "role not found" surface with suggestions? | Spec says existing 404, but UX recommends confirming. | No — can be deferred to QA/polish phase |

---

## Decisions (Confirmed)

- Warm, consistent with main ResuVibe app aesthetic.
- Exact gold/navy palette and DM Serif/Sans typography (no new tokens or fonts).
- Spare, text-focused design (minimal cards, no imagery, no decoration).
- Warm & conversational voice (peer-to-peer, empathetic, educational).
- Content-forward references (Copyblogger, HubSpot guides); avoid generic SaaS defaults.
- WCAG AA compliance across the board.
- Mockups approved; CTA copy is "Start your free trial with ResuVibe."
- No custom imagery needed.

---

## Assumptions

- The Architect will decide the rendering strategy (SSR/SSG) before Engineer builds.
- Role context passing mechanism will be defined in the architecture stage.
- Existing ResuVibe Tailwind tokens and shadcn/ui components are the source of truth (no new design system needed).
- Crawlers can parse the content (no client-only rendering blocking initial paint).

---

## Open Questions

- Should the directory page include pagination at 105 roles, or is category grouping + search sufficient? (Minor — lean toward "no pagination needed," but not explicitly confirmed.)

---

## Next Handoff

**Recommended next:** The Architect reads `01-feature-brief.md`, `02-feature-ux.md`, and `03-feature-ui.md` and designs the system in `04-feature-architecture.md`. Key decisions to make:
- Rendering strategy (SSR/SSG/hybrid) for `/resume-guides/:slug` pages.
- Role context passing mechanism (query param vs. route state vs. session storage).
- Data loading and caching strategy (are roles fetched from the filesystem, a database, or pre-built static files?).
- Where the Markdown content lives (SinglePages directory, database, or embedded in the build).
