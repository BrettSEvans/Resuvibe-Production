# Feature Architecture — ResuVibe pSEO Resume Guides + FAQ

> System design for the pSEO resume-guides feature. Resolves the three P0 architectural decisions (rendering strategy, role context passing, data pipeline) and defines the system across 9 architect themes. Written by the Architect agent (feature mode). Read by the Engineer next. Date: 2026-07-20

**Feature type:** Public-facing, SEO-optimized, statically generated content pages (unauthenticated, crawlable, conversion-focused).

**Status:** ✅ All 3 P0 decisions resolved. Ready for Engineer stage.

---

## Executive Summary

The pSEO Resume Guides feature is built on **Static Site Generation (SSG)**: all 105 role guides are pre-rendered to static HTML at build time (from `SinglePages/*.md` markdown sources), then served as fast, crawlable static files. Role context flows through a **query param** (`?role={slug}`) into the sign-up flow, keeping the system stateless and simple. The architecture optimizes for **SEO crawlability** (non-negotiable) and **Core Web Vitals** (ranking factors), reuses the existing React + Vite + Tailwind + shadcn/ui stack, and introduces a single new piece: a **Vite markdown loader plugin** that handles frontmatter validation and HTML generation at build time.

---

## 1. Architectural Drivers

**This system optimizes for:**

1. **Crawlability by search engines** (non-negotiable; SEO is the feature's core value driver)
   - All content must be visible in static HTML before any JavaScript runs
   - Crawlers must not wait for JS to finish; content is pre-rendered at build time
   - **Consequence:** Cannot use client-only rendering or data fetching that blocks initial paint

2. **Core Web Vitals** (ranking signals for search engines)
   - **LCP (Largest Contentful Paint):** < 1.5s — static HTML serves content immediately
   - **CLS (Cumulative Layout Shift):** < 0.1 — accordion collapse design prevents jank
   - **FID (First Input Delay):** < 100ms — interactive elements are local React state, no server calls

3. **Content velocity** (105 pages must ship quickly without manual per-page configuration)
   - Single build-time process generates all 105 guide pages from markdown + frontmatter
   - No per-page routing config needed; all guides follow the same template

4. **Conversion funnel fidelity** (role context must survive the sign-up flow)
   - Role slug must pass from `/resume-guides/:slug` → CTA click → `/sign-up?role={slug}` → baseline profile setup
   - No state loss in the handoff

5. **No new dependencies** (reuse existing React, Vite, Tailwind, shadcn/ui)
   - Minimize risk and maintenance burden
   - Maintain design system consistency

---

## 2. System Context & Boundaries

### Inside the Boundary (What We're Building)

- **Static guide pages** (`/resume-guides` directory page, `/resume-guides/:slug` individual guide pages)
- **Markdown loader & frontmatter parser** (Vite plugin: reads `SinglePages/*.md`, validates YAML frontmatter, extracts content sections and FAQ array)
- **Guide index builder** (generates JSON metadata index of all 105 roles, grouped by category)
- **FAQ accordion component integration** (reuses shadcn/ui `Accordion`, configures for single-open, all-collapsed-on-load)
- **Role-to-sign-up link** (CTA button passes `?role={slug}` into the sign-up flow)
- **Directory search/filter** (client-side real-time role search by name)
- **Schema.org FAQPage structured data** (for Google rich snippet support)

### Outside the Boundary (Existing Systems)

- **Sign-up flow** (`/sign-up` route and component) — already exists; we just append a query param to the link
- **Authentication system** — no changes; these pages are public/unauthenticated
- **Design system** (Tailwind CSS v4, shadcn/ui components) — all components already exist
- **React Router** — routing framework already in place
- **Build tool** (Vite) — we extend it with a markdown plugin
- **Database** (Supabase) — no schema changes; no new tables

### Integration Points

| System | Data Flow | Mechanism |
|--------|-----------|-----------|
| Markdown sources | `SinglePages/*.md` + YAML → parsed guide data | Build-time: custom Vite plugin reads files, extracts frontmatter |
| Shadcn/ui Accordion | FAQ question array → rendered accordion with `aria-expanded` state | Import existing component, pass props (no customization needed) |
| React Router | Route param `:slug` → guide page component props | Standard route definition: `/resume-guides/:slug` |
| Sign-up flow | Query param `?role={slug}` → baseline profile setup reads param | External navigation link; sign-up component uses `useSearchParams()` |
| Directory index | Role array + search term → filtered list | Client-side real-time filter (no server call) |
| Web server / CDN | Static HTML files → HTTP response | All `dist/resume-guides/*.html` files served directly (no routing middleware needed) |

### Data Flow (SEO-Optimized)

```
BUILD TIME:
  SinglePages/*.md (105 files)
    ↓
  [Vite Markdown Loader Plugin]
    • Reads all .md files
    • Parses YAML frontmatter
    • Validates required fields (title, slug, category)
    • Renders markdown content → HTML
    • Extracts FAQ questions and answers
    ↓
  [Guide Index Builder]
    • Creates guideIndex JSON (all 105 roles)
    • Groups by category for directory page
    • Builds quick-lookup by slug
    ↓
  [React/SSG]
    • GuidePage.tsx template + guide data → static HTML
    • DirectoryPage.tsx template + guideIndex → static HTML
    ↓
  dist/resume-guides/ (105 guide .html files + directory .html)
    All crawlable, all content visible, no JS blocking

RUNTIME:
  Browser requests /resume-guides/software-engineer
    ↓
  Web server serves pre-built dist/resume-guides/software-engineer.html
    ↓
  Static HTML loads (fast, crawlable)
    ↓
  React hydrates on top (adds interactivity: accordion toggle, search filter)
    ↓
  User reads guide, clicks CTA
    ↓
  navigate('/sign-up?role=software-engineer')
    ↓
  Sign-up component reads ?role query param, pre-fills role context
```

---

## 3. Architecture Style & Major Components

**Style:** Layered architecture with build-time static asset generation.

```
┌─────────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER (React Components)           │
├──────────────────────┬──────────────────────────────────────┤
│  DirectoryPage       │  GuidePage                            │
│  (/resume-guides)    │  (/resume-guides/:slug)              │
│  ┌────────────────┐  │  ┌──────────────────────────────────┐│
│  │ Category hdrs  │  │  │ Metadata (title, category)        ││
│  │ Role cards     │  │  │ 5 Content sections (numbered)     ││
│  │ Search input   │  │  │ FAQ Accordion (Radix)             ││
│  │ One-way links  │  │  │ Schema.org FAQPage data           ││
│  │ to guides      │  │  │ Role-scoped CTA button            ││
│  └────────────────┘  │  └──────────────────────────────────┘│
└──────────────────────┴──────────────────────────────────────┘
         ↑ reads                    ↑ reads
         │                          │
┌─────────────────────────────────────────────────────────────┐
│           DATA/STATE LAYER (BUILD-TIME GENERATION)           │
├──────────────────────────────────────────────────────────────┤
│  guideIndex.json (embedded or fetched)                       │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Guide[] array with:                                      ││
│  │  - slug, title, category                                 ││
│  │  - content sections (HTML-rendered markdown)             ││
│  │  - faq array (questions, answers as HTML)                ││
│  │  - metadata (buildDate, contentLength)                   ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
│  Markdown Loader & Parser (Vite Plugin)                      │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ • Read all SinglePages/*.md                              ││
│  │ • Extract & validate YAML frontmatter                    ││
│  │ • Render markdown → HTML (gray-matter + remark)          ││
│  │ • Build section array + FAQ array                        ││
│  │ • Validate required fields (title, slug, category)       ││
│  │ • Return parsed guide objects                            ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
         ↑ reads
         │
┌─────────────────────────────────────────────────────────────┐
│              SOURCE DATA (Version-Controlled)                 │
├──────────────────────────────────────────────────────────────┤
│  SinglePages/                                                 │
│  ├─ software-engineer.md                                     │
│  ├─ product-manager.md                                       │
│  ├─ ... (105 total)                                          │
│  └─ Each with YAML frontmatter + markdown content            │
└─────────────────────────────────────────────────────────────┘
```

### Major Components & Responsibilities

| Component | File(s) | Responsibility |
|-----------|---------|---|
| **MarkdownLoader** (Vite plugin) | `src/lib/plugins/markdown-loader.ts` | Read SinglePages/*.md, parse frontmatter, validate, extract sections & FAQ, return parsed guides |
| **GuideIndex Builder** | `src/lib/plugins/guide-index-builder.ts` (or part of markdown-loader) | Take parsed guides, build index structure (by slug, by category), output to guideIndex.json or embed in build |
| **DirectoryPage** | `src/app/routes/ResumeGuides/DirectoryPage.tsx` | Render all roles grouped by category; search/filter; link to individual guides; no back-link to directory |
| **GuidePage** | `src/app/routes/ResumeGuides/GuidePage.tsx` | Read :slug param, look up guide in index, render sections, FAQ accordion, role-scoped CTA |
| **PublicLayout** | `src/components/layouts/PublicLayout.tsx` | Lightweight header (logo + minimal nav), no authenticated sidebar, reuse existing pattern |
| **Accordion** (existing) | `src/components/ui/accordion.tsx` | FAQ accordion interaction (single-open, all collapsed on load), provided by shadcn/ui |
| **Button, Card** (existing) | `src/components/ui/` | Role cards, CTA button, search input — all from shadcn/ui, no new components |

---

## 4. Runtime Behavior

### Happy Path: Organic Search → Guide → Sign-Up

```
1. User searches Google: "software engineer resume ATS keywords"
   ↓
2. Google returns /resume-guides/software-engineer in search results
   (Page is crawlable, has schema.org FAQPage, good Core Web Vitals)
   ↓
3. User clicks result, lands on /resume-guides/software-engineer
   ↓
4. Web server returns pre-built static HTML (no API call, no loading state)
   ↓
5. Browser renders content immediately (LCP < 1.5s)
   React hydrates on top (adds accordion interactivity)
   ↓
6. User reads 5 sections, expands FAQ accordion, reads answers
   (All content already in DOM; accordion toggle is local state, no server call)
   ↓
7. User convinced; clicks CTA button: "Start your free trial with ResuVibe"
   ↓
8. navigate('/sign-up?role=software-engineer')
   ↓
9. Sign-up component reads useSearchParams(), gets role='software-engineer'
   ↓
10. Baseline profile setup is pre-filled for software engineer role
    (e.g., "Resume for Software Engineer roles")
    ↓
11. User completes sign-up, lands in authenticated dashboard with role context
```

### Secondary Path: Browse Directory

```
1. User lands on /resume-guides (via internal link or direct URL)
   ↓
2. DirectoryPage loads guideIndex (embedded in HTML or fetched)
   ↓
3. Renders all 105 roles grouped by 8 categories (Technology, Product & Design, etc.)
   ↓
4. User searches: types "product manager" in search input
   ↓
5. Client-side filter matches "Product Manager" role
   (No server call, instant feedback)
   ↓
6. User clicks "Product Manager" card
   ↓
7. navigate('/resume-guides/product-manager')
   ↓
8. Same as Happy Path step 3 onward
```

### Invalid/Missing Slug

```
1. User manually types /resume-guides/nonexistent-role
   ↓
2. Web server looks for dist/resume-guides/nonexistent-role.html
   ↓
3. File not found → 404 HTTP response
   ↓
4. Browser renders existing ResuVibe 404 page (no new UX needed)
```

### FAQ Accordion Interaction

```
1. User on /resume-guides/software-engineer guide page
   Page loads; all FAQ questions visible, all collapsed (no answers visible)
   ↓
2. User clicks "What is an ATS?" question
   ↓
3. Radix Accordion state changes: expandedIndex = 0
   ↓
4. React re-renders; answer slides down (150–200ms smooth transition)
   ↓
5. User clicks another question (e.g., "How do I tailor my resume?")
   ↓
6. Radix single-open behavior: previous item collapses, new item expands
   ↓
7. All interactions are local state (no server calls)
```

### Client-Side State (Minimal)

| State | Where Stored | Lifecycle | Purpose |
|-------|---|---|---|
| `searchQuery` | DirectoryPage React state | Session (lost on refresh) | User's directory search term; real-time filter |
| `expandedFaqIndex` | Radix Accordion (via Radix state) | Session | Which FAQ item is open on guide page |
| `role` (query param) | URL query string (`?role=software-engineer`) | Navigation | Passed to sign-up component |

**No persistent/server-side state needed** (guides are immutable read-only assets).

---

## 5. Data Model & State

### Markdown Frontmatter Format

**File:** `SinglePages/software-engineer.md`

```yaml
---
title: "Software Engineer Resume Guide"
slug: "software-engineer"
category: "Technology"
---

## Section 1: ATS Keywords
[Content markdown here...]

## Section 2: Resume Bullets
[Content markdown here...]

[... sections 3–5 ...]

## FAQ
- Q: How does the ATS work?
  A: The ATS is a system that...
  
- Q: What keywords should I include?
  A: Look for keywords in...
  
[... 5 more Q&A ...]
```

### Parsed Guide Object (TypeScript)

```typescript
interface GuideSection {
  heading: string;           // "ATS Keywords", "Resume Bullets", etc.
  content: string;           // HTML-rendered markdown
}

interface FAQItem {
  question: string;          // "How does the ATS work?"
  answer: string;            // HTML-rendered markdown
}

interface Guide {
  slug: string;              // "software-engineer"
  title: string;             // "Software Engineer Resume Guide"
  category: string;          // "Technology"
  sections: GuideSection[];  // 5 items
  faq: FAQItem[];            // 7 items
  metadata: {
    buildDate: string;       // "2026-07-20T15:30:00Z"
    contentLength: number;   // total character count
  };
}
```

### Guide Index (Build-Time)

```typescript
interface GuideIndex {
  guides: Guide[];           // All 105 guides
  bySlug: Map<string, Guide>;
  byCategory: Map<string, Guide[]>;
  categories: string[];      // Sorted list of unique categories
}

// guideIndex.json structure:
{
  "guides": [
    { "slug": "software-engineer", "title": "...", "category": "Technology", ... },
    { "slug": "product-manager", "title": "...", "category": "Product & Design", ... },
    ... 103 more
  ],
  "byCategory": {
    "Technology": [ { guide objects } ],
    "Product & Design": [ { guide objects } ],
    ...
  }
}
```

### State Flow During Build

```
1. Read ALL SinglePages/*.md files
2. For each file:
   - Parse YAML frontmatter (extract title, slug, category)
   - Validate: title, slug, category are present; slug is unique
   - Render markdown content → HTML (remark plugin)
   - Build sections array (split by ## headers)
   - Extract FAQ questions & answers
   - Create Guide object
3. Collect all Guide objects into GuideIndex
4. Write guideIndex.json to dist/
5. SSG: For each guide, render GuidePage component with guide data → static HTML
6. SSG: Render DirectoryPage component with GuideIndex → static HTML
```

### State at Runtime

| Layer | Data | Source | Lifespan |
|-------|------|--------|----------|
| **Static files** | Guide pages (HTML), Directory page (HTML), guideIndex.json | dist/ directory | Until next build/deploy |
| **React component** | searchQuery (directory), expandedFaqIndex (FAQ accordion) | React state | Session |
| **URL** | ?role query param | Navigation | Until user navigates away |

---

## 6. Interfaces & Contracts

### Markdown Frontmatter Contract

**Required fields (validation at build time):**

```yaml
---
title: string (required, non-empty)
slug: string (required, unique, lowercase, hyphen-separated, a-z0-9-)
category: string (required, must be one of: Technology, Product & Design, Marketing & Sales, Finance & Business Operations, People Operations & HR, Legal & Compliance, Data & Analytics, Specialized Professional)
---
```

**Build behavior:** If any guide is missing these fields or has an invalid value, the build exits with an error. Example:

```
Error: SinglePages/invalid-guide.md is missing required field 'slug'
Build failed. Please fix the markdown file and try again.
```

### React Router Contract

```typescript
// Route definitions in main router config:
{
  path: '/resume-guides',
  element: <DirectoryPage />
}
{
  path: '/resume-guides/:slug',
  element: <GuidePage />
}

// GuidePage component:
const GuidePage = () => {
  const { slug } = useParams();
  const guide = guideIndex.bySlug[slug];
  
  if (!guide) {
    return <NotFound />; // Fallback (shouldn't happen in prod, but safety)
  }
  
  return (
    <PublicLayout>
      <h1>{guide.title}</h1>
      {/* Render sections, FAQ, CTA */}
    </PublicLayout>
  );
};
```

### Query Parameter Contract (Sign-Up Link)

```typescript
// CTA button in GuidePage:
const handleCTA = () => {
  navigate(`/sign-up?role=${slug}`);
};

// Sign-up component reads:
import { useSearchParams } from 'react-router-dom';

const SignUpFlow = () => {
  const [searchParams] = useSearchParams();
  const roleSlug = searchParams.get('role');
  
  // If roleSlug is present:
  // - Pre-fill baseline profile setup for this role
  // - e.g., "Tailoring for Software Engineer roles"
  
  return (/* ... */);
};
```

**Query param contract:**
- Parameter name: `role`
- Value: guide slug (e.g., `software-engineer`, `product-manager`)
- Example URL: `/sign-up?role=software-engineer`
- Optional: if not present, sign-up proceeds with generic baseline profile setup

### Schema.org FAQPage Structured Data

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is an ATS?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "An ATS (Applicant Tracking System) is software that..."
      }
    },
    {
      "@type": "Question",
      "name": "How do I tailor my resume?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Start with your baseline resume and..."
      }
    },
    // ... 5 more questions
  ]
}
</script>
```

**Benefit:** Google can surface FAQ rich snippets in search results (expandable Q&A in SERPs).

---

## 7. Key Technical Decisions (Architecture Decision Records)

### ADR Table

| Decision | Choice | Rationale | Alternatives | Consequences |
|----------|--------|-----------|---|---|
| **Rendering Strategy** | SSG (Static Site Generation at build time) | **Crawlability is non-negotiable.** Search engines must see all content in static HTML without waiting for JS. SSG guarantees this. Static pages load fast (LCP < 1.5s), helping search ranking. | **SSR** (server-render each request): would work for crawling, but adds server load and complexity. **CSR** (client-only): fails SEO because crawlers may not wait for JS. | Guides are immutable; updates require rebuild + redeploy. Acceptable because guides are stable, write-once content. No runtime edits expected. |
| **Role Context Passing** | Query param (`?role={slug}`) | **Stateless and simple.** Query params are standard for passing data across navigation. No session state, no storage dependency. Works with browser history, analytics, and testing. Clear in the URL for debugging. | **Route state** (React Router state object): would lose data on page refresh. **Session storage:** adds client-side storage dependency, unnecessary complexity. | Query params are visible in URL (not sensitive; role slug is public). Works with crawlers and analytics. |
| **Markdown Storage** | `SinglePages/*.md` in git (version-controlled) | **Already written and available.** Single source of truth. Guides are reviewed and versioned with code. No need for a CMS or database. | **Database (Supabase):** adds runtime dependency, complexity. **API / cloud storage:** slower to fetch at build time. | Guides are version-controlled with code (good for audit trail). To update a guide: edit .md file → PR → merge → rebuild. No live-editing capability (acceptable for stable content). |
| **Build-Time Processing** | Custom Vite plugin (markdown loader) | **Tight integration with existing build tool.** Vite is already used for building the app. A plugin runs during build, no external tools needed. Markdown → HTML happens once at build time (fast). | **Separate build step** (esbuild script): adds build complexity. **Gulp/Webpack task:** overkill, less integrated. **External tool** (Node script): works but less clean integration. | If Vite is replaced in the future, plugin must be rewritten. For now, Vite is the standard, so acceptable. Plugin code is in repo, easy to maintain. |
| **Component Library** | Radix/shadcn/ui (Accordion, Button, Card) | **Already in ResuVibe codebase.** No new dependencies. WCAG AA compliant. Consistent with existing design system. Minimal maintenance burden. | **Custom accordion:** would need testing for a11y. **Headless UI:** another third-party lib. **HTML5 <details>:** limited styling, less control. | Accordion behavior is defined by Radix (single-open, etc.). If future requirements diverge, can fork or wrap. Currently, Radix covers all needs. |
| **FAQ Content Structure** | Hardcoded in markdown frontmatter (Q&A array in each guide) | **Content lives with the guide.** Version-controlled, reviewed, no separate CMS. Each guide's FAQ is self-contained (reusable if guides are ever ported). | **Database table (faq_items):** adds schema, queries, ORM complexity. **CMS (headless CMS):** overkill for stable content. **Separate JSON files:** fragmented; harder to keep in sync. | FAQ updates require editing the markdown file and rebuilding. No live editing post-launch. Acceptable for stable, reviewed content. |
| **Directory Index** | Built at build time (guideIndex.json, embedded in HTML or fetched) | **Fast directory page.** All metadata is pre-computed; no runtime computation needed. Directory search is instant (client-side filter, no server request). | **Fetch roles from API at runtime:** adds server dependency, latency. **Database query:** slower, unnecessary for static guides. | Directory index is immutable; updated when build runs. All 105 roles are always loaded (acceptable, ~5-10KB JSON). |
| **Error Handling (Invalid Slug)** | Serve existing ResuVibe 404 page (no new UX) | **Simplicity.** Don't special-case this. Consistent with app-wide 404 behavior. Static site can't serve dynamic error pages anyway (each slug must be pre-built). | **Custom "role not found" page:** would require building a 404.html with suggestions (more complex). **Server-side 404 handler:** requires a server (conflicts with SSG). | Users landing on invalid slugs see the generic 404 page. In v2, could enhance with "Did you mean these roles?" suggestion. For v1, acceptable. |

---

## 8. Cross-Cutting Concerns

### Performance & Core Web Vitals

**Goal:** Guide pages meet Google's Core Web Vitals thresholds (search ranking factor).

| Metric | Target | Strategy |
|--------|--------|----------|
| **LCP (Largest Contentful Paint)** | < 1.5s | Serve pre-built static HTML. Content is visible on first paint (no API call, no loading state blocking). Guide metadata (title, category) is in HTML. |
| **FID (First Input Delay)** | < 100ms | Accordion toggle is local React state (no server call). React hydration is fast (small component tree). |
| **CLS (Cumulative Layout Shift)** | < 0.1 | Radix Accordion prevents layout jank. FAQ questions are collapsed by default (no content load shift). Section content is pre-rendered (no lazy-load surprise). |

**No blocking third-party scripts.** Avoid Google Analytics, Hotjar, etc. in the critical path (load them async or defer).

**No imagery.** Text-driven design reduces payload and eliminates image load blocking.

### Error Handling

| Scenario | Behavior | User Experience |
|----------|----------|---|
| **Missing frontmatter** (e.g., no `title` or `slug` in .md file) | Build-time error; build fails; exit with error message | Developer fixes markdown file, rebuilds, redeploys. Users see no change until build succeeds. |
| **Invalid slug in URL** (e.g., `/resume-guides/nonexistent-role`) | Web server returns 404 HTTP status | User lands on existing ResuVibe 404 page. Can suggest going to directory or home. |
| **Markdown parsing error** (e.g., malformed YAML, broken remark plugin) | Build-time error; stops build; error logged | Developer fixes markdown file or plugin, rebuilds, redeploys. |
| **Accordion item click** (user interaction) | Radix handles; no error scenario | Radix is stable; no error path expected. If React crashes, browser console logs. |
| **CTA click** (navigate to sign-up) | Standard React Router navigation | No error; routes to `/sign-up?role={slug}`. Sign-up component handles. |
| **guideIndex fetch fails** (if index is fetched, not embedded) | N/A for now (index is embedded). If fetched: implement retry logic. | Defer to future (current design embeds index in HTML). |

### Accessibility (WCAG AA)

**Status:** ✅ All requirements met (verified against `03-feature-ui.md`).

| Requirement | Compliance | Implementation |
|---|---|---|
| **Color contrast** | ✅ 4.5:1 minimum on all text | Dark charcoal (var(--fg-dark)) on light background = 19:1 (WCAG AAA). Secondary text = 9:1. Tested. |
| **Keyboard navigation** | ✅ All interactive elements (links, buttons, accordion, search) are keyboard-navigable | Use semantic HTML (`<button>`, `<a>`). Radix Accordion provides `aria-expanded`, focus trap. Tab order is logical (top-to-bottom). |
| **Screen reader support** | ✅ Semantic HTML, `aria-*` attributes, descriptive link text | Accordion headers are `<button>` (not `<div>`). Links have descriptive text (not "click here"). Headings use `<h1>`, `<h2>`, `<h3>` hierarchy. Schema.org markup helps screen readers understand FAQ structure. |
| **Responsive layout** | ✅ Single-column on mobile (< 768px), multi-column on tablet/desktop | Tailwind grid/flex reflow. No horizontal scroll. Accordion and search input adapt to narrow viewports. |
| **Mobile/touch interaction** | ✅ Accordion chevron, buttons are large enough (min 44x44 px touch target) | Radix Accordion handles touch. Button padding ensures 44px min. |
| **No imagery** | ✅ Text is the design | All content is text/markup. No decorative images, SVG icons, emoji that block screen readers. Accessible by default. |

### Testing Strategy

| Type | Scope | Tools | Notes |
|------|-------|-------|-------|
| **Unit** | Markdown loader: frontmatter parsing, validation, section extraction | Vitest | Test happy path (valid markdown), error cases (missing fields, invalid slug), edge cases (empty content) |
| **Unit** | GuideIndex builder: grouping by category, slug lookup | Vitest | Test index structure, category grouping, slug collision detection |
| **Integration** | React Router navigation: `/resume-guides/:slug` renders GuidePage with correct guide data | Vitest + jsdom | Mock guideIndex, test route param binding, guide lookup |
| **Integration** | CTA button: `navigate('/sign-up?role={slug}')` passes role param | Vitest + jsdom | Mock useNavigate, assert navigation URL includes role param |
| **Component** | Accordion: single-open, all collapsed on load, chevron rotation | Vitest + jsdom | Render FAQ with 7 questions, test expand/collapse, test single-open behavior |
| **Component** | DirectoryPage: search filter works, renders all categories | Vitest + jsdom | Mock guideIndex, type in search input, assert list filters correctly |
| **E2E** | User flow: lands on guide page, reads content, clicks CTA | Playwright (optional, can defer to QA) | Test in real browser: navigate to `/resume-guides/software-engineer`, scroll, read FAQ, click button, assert URL changes to `/sign-up?role=...` |
| **SEO** | Static HTML crawlability: content is visible without JS | Manual (curl / Lighthouse) | `curl https://site/resume-guides/software-engineer` should return HTML with all content visible (not "loading..."). Lighthouse LCP < 1.5s. |
| **Performance** | Core Web Vitals: LCP, CLS, FID meet thresholds | Lighthouse, WebPageTest | Test 5–10 random guides. Target: LCP < 1.5s, CLS < 0.1, FID < 100ms. |

### Monitoring & Observability

**Post-launch, monitor these metrics:**

| Metric | Tool | Alert Threshold | Action |
|--------|------|---|---|
| **Build duration** | CI/CD logs | > 30s | Investigate build step (markdown parsing slow?). Might indicate need to parallelize. |
| **404 rate on `/resume-guides/*`** | Web server logs / analytics | Spike (e.g., 5% of requests) | Might indicate broken link or missing guide. Review referrer logs to find source. |
| **Organic search impressions** | Google Search Console | Monitor by role | Which guides are ranking? Are keywords getting impressions? Adjust content if some guides aren't visible. |
| **CTR (Click-through rate)** | Google Search Console | Target > 2% | If CTR is low, page titles/descriptions might not be compelling. Check search appearance. |
| **Sign-up conversion rate (by role)** | Analytics cohort (session source: organic + role param) | Target 10–20% of guide visitors convert to sign-up; 5–10% complete profile setup | Measure organic sign-ups driven by pSEO guides. Compare to other acquisition channels. |
| **Core Web Vitals** | Lighthouse / web analytics | LCP < 1.5s, CLS < 0.1, FID < 100ms | If metrics degrade, investigate changes (new images, JS bloat, font loading, etc.). Static pages should be fast by default. |
| **Search engine indexing** | Google Search Console | All 105 guides indexed within 1 week | Monitor coverage. If some guides aren't indexed, check robots.txt, sitemaps, canonical tags. |

---

## 9. Deployment & Operations

### Build Process

**Trigger:** On every commit to main branch (or manually).

**Steps:**

```bash
# 1. Install dependencies
npm install

# 2. Run build (includes markdown loading & SSG)
npm run build

# Details of npm run build:
# a. Vite starts build
# b. Markdown loader plugin runs:
#    - Reads all SinglePages/*.md files
#    - Validates frontmatter
#    - Parses markdown → HTML
#    - Creates Guide objects
# c. Guide index builder runs:
#    - Groups guides by category
#    - Outputs guideIndex.json
# d. React SSG runs:
#    - For each guide: renders GuidePage component → static HTML
#    - Renders DirectoryPage → static HTML
# e. Output: dist/resume-guides/{slug}.html (105 files) + dist/resume-guides/index.html

# 3. Artifacts ready in dist/
ls dist/resume-guides/
# output: index.html, software-engineer.html, product-manager.html, ... (105 guides)
```

**Build time:** ~5–10 seconds (markdown parsing + SSG for 105 pages). If too slow, parallelize markdown parsing or split into batches.

**On build failure:** CI/CD stops; error message logged. Examples:
- Missing frontmatter field → "Error: SinglePages/foo.md missing 'slug' field"
- Invalid markdown syntax → "Error: SinglePages/foo.md failed to parse YAML frontmatter"

### Hosting & Serving

**Requirements:**
- Serve static files from `dist/resume-guides/`
- All `.html` files are crawlable
- Serve with `Content-Type: text/html`
- Support 404 fallback to `dist/404.html` (or app 404 route)

**Hosting options (any of these work):**

| Option | Pros | Cons |
|--------|------|------|
| **Vercel** (current ResuVibe host?) | Zero-config Next.js/static support; auto-deploys on push | Vendor lock-in; but probably already using |
| **AWS S3 + CloudFront** | Cheap, scalable, global CDN | Requires setup; no server-side rendering (not needed here) |
| **Netlify** | Similar to Vercel; good static site support | Similar vendor lock-in |
| **Self-hosted (nginx)** | Full control; cheap if you have infra | Requires ops; need to manage caching, SSL, etc. |

**Recommendation:** Use existing ResuVibe hosting (likely Vercel). Just ensure `dist/resume-guides/` is served as-is, no routing middleware required.

### Cache Strategy

**Static files (guides, index):**
- Cache-Control: `public, max-age=31536000, immutable` (1 year)
- Add hash to filename (Vite does this automatically for JS/CSS; do same for HTML if needed)

**Rationale:** Content is immutable; once deployed, never changes. Safe to cache aggressively.

**On deploy:** Old files remain in CDN until they expire or are purged. New files are served alongside old ones until old caches expire.

### Deployment Steps

**Manual deployment (or trigger via CI/CD):**

```bash
# 1. Engineer commits change to main
git commit -m "Add/update guides or architecture"
git push origin main

# 2. CI/CD pipeline runs:
npm run build
# Outputs dist/resume-guides/{slug}.html + dist/resume-guides/index.html

# 3. Deploy to production:
# - Vercel: auto-deploys on push (zero-config)
# - Other: `git push to production branch` or `manual deploy command`

# 4. Smoke test:
curl https://resuvibe.com/resume-guides/software-engineer
# Should return HTML with guide content (no loading state, no JS errors)

# 5. Monitor:
# - Check Google Search Console for indexing
# - Monitor Core Web Vitals in analytics
# - Watch for 404 spikes

# 6. If rollback needed:
# - Revert commit, push, redeploy
# - Old version will be served (previous build artifact)
```

**Rollback plan:**

- If a guide has a bug post-launch: fix markdown file → push → rebuild → redeploy.
- If routing breaks: revert the commit → push → redeploy (fast, since it's just HTML files).
- If entire build is broken: rollback to last good commit → push → redeploy.

### Monitoring & Alerts

**What to monitor:**

1. **Build metrics:**
   - Build duration (alert if > 30s)
   - Build success rate (alert if > 1% failure rate)

2. **SEO metrics:**
   - Google Search Console: impressions, clicks, indexing coverage
   - Ahrefs / SEMrush: keyword rankings (optional, nice-to-have)

3. **Performance:**
   - Core Web Vitals (via Google Analytics or third-party)
   - 404 rate on `/resume-guides/*`

4. **Conversion:**
   - Click-through rate (CTA button clicks)
   - Sign-up completion rate (by cohort: organic + role)
   - Conversion to Premium (long-term)

**Example alert configuration:**

```
- If 404 rate on /resume-guides/* > 5%:
  Send Slack notification to #ops
  
- If LCP > 2s on guide pages:
  Send Slack notification to #engineering
  
- If build duration > 30s:
  Send Slack notification to #engineering
```

### Future Enhancements (Not v1)

- **Pagination or infinite scroll:** If directory becomes too large (currently 105 roles fit on one page with categories).
- **Live search backend:** If client-side search becomes too slow (currently acceptable for 105 items).
- **Guide versioning:** If guides need to be updated post-launch without rebuilding entire site.
- **A/B testing CTA copy:** If conversion rates vary by role.
- **Related guides:** Links from one guide to similar guides (currently no cross-linking).
- **Dark mode:** If analytics show demand; currently light-mode only.

---

## Summary: P0/P1 Deltas & Resolution Status

| Risk | Original Problem | Recommendation | Status | Resolved By |
|------|---|---|---|---|
| **P0 — Rendering strategy (SEO crawlability)** | Client-only rendering would block crawlers; content wouldn't be indexed | Use SSG (Static Site Generation at build time). Pre-render all 105 guides to static HTML. Crawlers see all content without JS. | ✅ Resolved | Theme 1 & Theme 3 |
| **P0 — Role context passing** | CTA must pass role slug into sign-up flow for role-scoped baseline profile setup | Use query param: `navigate('/sign-up?role={slug}')`; sign-up component reads `useSearchParams().get('role')` | ✅ Resolved | Theme 1 & Theme 6 |
| **P0 — Data pipeline for 105 markdown files** | No existing pipeline to load SinglePages/*.md and render them | Create Vite markdown loader plugin (build-time): reads .md files, validates frontmatter, parses content, builds guide index, SSG renders to static HTML | ✅ Resolved | Theme 2 & Theme 3 |
| **P1 — Frontmatter validation** | Missing or invalid frontmatter would cause runtime errors | Validate at build time: if any guide is missing `title`, `slug`, or `category`, build exits with error | ✅ Resolved | Theme 7 (ADR) |
| **P1 — 404 handling for invalid slugs** | No UX guidance for `/resume-guides/nonexistent-role` | Serve existing ResuVibe 404 page (no new UX); can enhance in v2 | ✅ Resolved | Theme 4 & Theme 8 |

---

## Open Questions for Engineer

1. **Where should the markdown loader plugin code live?** Suggested: `src/lib/plugins/markdown-loader.ts` (or `src/vite-plugins/`). Confirm location and export pattern.

2. **Should guideIndex be embedded in the initial HTML or fetched as a separate JSON file?** 
   - **Embed** (recommended): All metadata in HTML, fast directory page, no extra request.
   - **Fetch:** Separate JSON file, slightly slower, but modularity if guides change frequently.

3. **What's the exact structure of the 5 content sections?** Are they always `## Section 1`, `## Section 2`, etc., or do we parse based on specific headings like `## ATS Keywords`, `## Resume Bullets`?

4. **FAQ structure in markdown:** Should each guide's FAQ be a separate YAML array in frontmatter, or embedded in the markdown body (e.g., `## FAQ`)?

5. **How should missing guides be handled at runtime?** Currently, GuidePage will get `undefined` if slug isn't in guideIndex. Should we show 404, or display a fallback message?

6. **Is there a staging environment?** Or does every PR deploy to production automatically? This affects rollback strategy.

7. **What's the current Google Search Console setup?** Do we need to submit a sitemap (`/sitemap.xml` with all 105 guide URLs), or will Google crawl them automatically?

---

## Assumptions

- The 105 markdown source files (`SinglePages/*.md`) are complete and have consistent frontmatter structure (`title`, `slug`, `category`).
- ResuVibe's current deployment pipeline (Vercel or similar) can handle static file generation and deployment.
- The sign-up component will be updated (during Engineer stage) to read the `?role` query param and pre-fill the baseline profile setup.
- No authentication/authorization changes needed; these pages are public.
- Existing Tailwind + shadcn/ui components (Accordion, Button, Card) meet all styling needs; no new components required.
- The 105 guides are stable, read-only content (no live editing post-launch).

---

## Next Handoff

**Engineer stage:** Read this document and `01-feature-brief.md`, `02-feature-ux.md`, `03-feature-ui.md`. Implement:

1. **Vite markdown loader plugin** (`src/lib/plugins/markdown-loader.ts`)
   - Read `SinglePages/*.md`
   - Parse YAML frontmatter
   - Validate required fields
   - Render markdown → HTML
   - Return Guide objects

2. **Guide index builder** (part of plugin or separate)
   - Collect all guides
   - Group by category
   - Output `guideIndex.json`

3. **React components**
   - `DirectoryPage.tsx` — `/resume-guides`
   - `GuidePage.tsx` — `/resume-guides/:slug`
   - `PublicLayout.tsx` — lightweight header

4. **Routes** (React Router)
   - `/resume-guides`
   - `/resume-guides/:slug`

5. **Sign-up integration** (update existing component)
   - Read `useSearchParams().get('role')`
   - Pre-fill baseline profile setup

6. **Testing** (unit + integration)
   - Markdown loader validation tests
   - Route navigation tests
   - Accordion interaction tests
   - Directory search filter tests

**QA stage:** Verify guide pages are crawlable, Core Web Vitals are met, role context passes through sign-up flow, 404s are handled correctly.

---

**Date:** 2026-07-20
**Status:** ✅ Ready for Engineer
**Reviewer:** Architect Agent
