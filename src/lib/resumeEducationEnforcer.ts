/**
 * resumeEducationEnforcer.ts
 *
 * Deterministically replaces the AI-generated Education section in a resume
 * HTML string with verbatim content extracted from the candidate's source
 * resume text.  This removes hallucination risk entirely — the AI decides
 * structure and ordering, but the Education section's *content* is always
 * sourced directly from what the user uploaded or pasted.
 */

// ---------------------------------------------------------------------------
// 1. Extract the Education section from plain-text resume
// ---------------------------------------------------------------------------

/**
 * Normalise a single line for header comparison:
 *   - strip leading markdown / bullet / hash markers
 *   - lowercase
 *   - strip trailing punctuation (colon, period)
 *   - collapse inner whitespace
 */
function normaliseHeaderLine(line: string): string {
  return line
    .trim()
    .replace(/^[#*\-•>]+\s*/, "")   // leading markdown / bullet chars
    .toLowerCase()
    .replace(/[:.]+$/, "")           // trailing colon or period
    .replace(/\s+/g, " ")            // collapse inner whitespace
    .trim();
}

const EDUCATION_HEADER_SET = new Set([
  "education",
  "academic background",
  "educational background",
  "academic qualifications",
  "academic history",
  "education & training",
  "education and training",
  "education &amp; training",
  "degrees",
  "academic credentials",
  "educational qualifications",
  "education section",
]);

/** True if the line looks like the start of an Education section. */
function isEducationHeader(line: string): boolean {
  const n = normaliseHeaderLine(line);
  if (!n) return false;
  if (EDUCATION_HEADER_SET.has(n)) return true;
  // Flexible fallback: "education" optionally followed by a qualifier word
  // Matches: "EDUCATION", "Education:", "Education & Development", etc.
  if (/^education(?:\s*(?:&|and|\/)\s*\w+)?$/.test(n)) return true;
  return false;
}

/**
 * Known resume section names used only to detect the END of the education
 * block.  We deliberately do NOT use an all-caps heuristic here because
 * school names (e.g. "UNIVERSITY OF MICHIGAN") are indistinguishable from
 * section headers by capitalisation alone.
 */
const KNOWN_SECTIONS = new Set([
  "experience", "work experience", "professional experience", "employment",
  "employment history", "career history", "work history",
  "skills", "key skills", "core skills", "technical skills", "hard skills",
  "soft skills", "competencies", "core competencies", "areas of expertise",
  "summary", "professional summary", "executive summary",
  "objective", "career objective", "profile", "professional profile",
  "certifications", "certification", "licenses", "licensure",
  "projects", "personal projects", "side projects", "portfolio",
  "awards", "honors", "honours", "achievements", "accomplishments",
  "publications", "research", "presentations",
  "volunteer", "volunteering", "volunteer experience", "community service",
  "languages", "references", "professional references",
  "interests", "hobbies", "activities", "extracurricular activities",
  "affiliations", "professional affiliations", "memberships",
  "additional information", "additional", "other",
  "military", "military service", "military experience",
  "training", "professional development", "continuing education",
]);

function looksLikeSectionHeader(line: string): boolean {
  const n = normaliseHeaderLine(line);
  if (!n) return false;
  // Match against the known-sections list only — avoids false positives on
  // all-caps school / employer names.
  return KNOWN_SECTIONS.has(n);
}

/**
 * Return the raw text of the Education section from a plain-text resume, or
 * null if no recognisable Education header is found.
 */
export function extractResumeEducation(resumeText: string): string | null {
  const lines = resumeText.split(/\r?\n/);

  // Find the line that is an Education header
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isEducationHeader(lines[i])) {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1) return null;

  // Collect lines after the header until the next known section header.
  // Allow 3 lines of grace so a blank line + first entry are always included.
  const GRACE = 3;
  const content: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (i > startIdx + GRACE && looksLikeSectionHeader(lines[i])) break;
    content.push(lines[i]);
  }

  const result = content.join("\n").trim();
  return result.length > 0 ? result : null;
}

// ---------------------------------------------------------------------------
// 2. Escape plain text for safe embedding in HTML
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// 3. Find the Education <h2> in the generated HTML
// ---------------------------------------------------------------------------

const EDUCATION_H2_TEXTS = new Set([
  "education",
  "academic background",
  "educational background",
  "academic qualifications",
  "academic history",
  "education & training",
  "education and training",
  "education &amp; training",
  "degrees",
  "academic credentials",
  "educational qualifications",
]);

/**
 * Locate the <h2>…</h2> block that represents the Education section.
 *
 * Strips ALL inner HTML tags from the heading's text before comparing so
 * that patterns like <h2><strong>Education</strong></h2> are handled
 * correctly.
 */
function findEducationH2(
  html: string,
): { index: number; headingEnd: number } | null {
  // Non-greedy match of any <h2 …>…</h2> block (handles multiline / attributes)
  const h2Re = /<h2[^>]*>[\s\S]*?<\/h2>/gi;
  let m: RegExpExecArray | null;

  while ((m = h2Re.exec(html)) !== null) {
    const innerText = m[0]
      .replace(/<[^>]+>/g, "") // strip all inner tags
      .trim()
      .toLowerCase()
      .replace(/[:.]+$/, "")   // trailing colon / period
      .replace(/\s+/g, " ");   // normalise whitespace

    if (
      EDUCATION_H2_TEXTS.has(innerText) ||
      /\beducation\b/.test(innerText)
    ) {
      return { index: m.index, headingEnd: m.index + m[0].length };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// 4. Replace the AI-written Education section in the generated HTML
// ---------------------------------------------------------------------------

/**
 * Given:
 *   • `html`        — the AI-generated resume HTML
 *   • `resumeText`  — the candidate's source resume as plain text
 *
 * Returns the HTML with the Education section's content replaced by verbatim
 * lines extracted from `resumeText`.  If no Education section can be found in
 * the source text or the generated HTML, the HTML is returned unchanged.
 */
export function enforceVerbatimEducation(
  html: string,
  resumeText: string,
): string {
  const verbatim = extractResumeEducation(resumeText);

  // If the source resume has no education section we still want to prevent
  // hallucination: remove any Education section the AI invented.
  const hasSourceEducation = verbatim !== null;

  const h2Info = findEducationH2(html);
  if (!h2Info) return html; // AI didn't emit an Education heading — nothing to fix

  const afterHeading = html.slice(h2Info.headingEnd);

  // Find where the next <h2> (or end of document) starts — that delimits the
  // education section's content.
  const nextH2Match = /<h2[\s>]/i.exec(afterHeading);
  const tail = nextH2Match ? afterHeading.slice(nextH2Match.index) : "";

  if (!hasSourceEducation) {
    // No education in source resume → remove the entire section (heading + content)
    return html.slice(0, h2Info.index) + tail;
  }

  // Convert verbatim plain-text lines into minimal inline-styled paragraphs
  // that match the ATS/Clarity font rules already applied by the preview layer.
  const educationHtml = verbatim
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="font-family:Arial,sans-serif;font-size:11pt;margin:0 0 3px 0;line-height:1.2;">${escapeHtml(line)}</p>`,
    )
    .join("\n");

  return (
    html.slice(0, h2Info.headingEnd) +
    "\n" +
    educationHtml +
    "\n" +
    tail
  );
}
