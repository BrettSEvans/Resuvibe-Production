/**
 * Lightweight, on-device punctuation & capitalization helpers for dictated
 * speech. No model download, no network. Intended for Web Speech API output
 * where each `isFinal` chunk roughly corresponds to a pause / sentence.
 */

// Spoken punctuation cues → literal characters. Order matters for multi-word
// phrases (longest first).
const SPOKEN_CUES: Array<[RegExp, string]> = [
  [/\b(question mark)\b/gi, "?"],
  [/\b(exclamation (point|mark))\b/gi, "!"],
  [/\b(open (paren|parenthesis))\b/gi, "("],
  [/\b(close (paren|parenthesis))\b/gi, ")"],
  [/\b(new paragraph)\b/gi, "\n\n"],
  [/\b(new line)\b/gi, "\n"],
  [/\b(semicolon)\b/gi, ";"],
  [/\b(colon)\b/gi, ":"],
  [/\b(dash)\b/gi, " — "],
  [/\b(period|full stop|dot)\b/gi, "."],
  [/\b(comma)\b/gi, ","],
];

function applySpokenCues(text: string): string {
  let out = text;
  for (const [re, rep] of SPOKEN_CUES) out = out.replace(re, rep);
  // Cleanup: " ." → "." ,  "  " → " "
  out = out.replace(/\s+([.,;:!?])/g, "$1");
  out = out.replace(/[ \t]{2,}/g, " ");
  return out;
}

function capitalizeFirst(s: string): string {
  const m = s.match(/^(\s*)(\S)(.*)$/s);
  if (!m) return s;
  return m[1] + m[2].toUpperCase() + m[3];
}

function fixStandaloneI(s: string): string {
  return s.replace(/(^|[\s(“"'])i(\b)/g, (_m, pre, post) => `${pre}I${post}`);
}

/**
 * Format a single finalized speech chunk into a sentence: convert spoken cues,
 * ensure sentence-ending punctuation, capitalize the first character, and
 * normalize standalone "i" → "I".
 */
export function formatDictationChunk(raw: string): string {
  let s = raw.trim();
  if (!s) return "";
  s = applySpokenCues(s);
  s = fixStandaloneI(s);
  s = capitalizeFirst(s);
  // If it doesn't already end with sentence punctuation, add a period.
  if (!/[.!?…]["')\]]?\s*$/.test(s)) s += ".";
  return s;
}

/**
 * Append a formatted dictation chunk to the existing answer text with
 * appropriate spacing.
 */
export function appendDictationChunk(existing: string, chunk: string): string {
  const formatted = formatDictationChunk(chunk);
  if (!formatted) return existing;
  const base = existing.replace(/\s+$/, "");
  if (!base) return formatted;
  // If existing ends mid-sentence (no terminal punctuation), the previous chunk
  // was almost certainly ended with "." by us — just space-join.
  return `${base} ${formatted}`;
}
