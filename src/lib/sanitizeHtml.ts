import DOMPurify from "dompurify";

/**
 * Sanitize AI-generated HTML before it is stored in the database or rendered
 * in the DOM. Strips event handlers and javascript: hrefs while preserving
 * all structural and styling markup needed for resume/dashboard rendering.
 *
 * Safe for use in the browser; call this on the client before saveJobApplication.
 */
export function sanitizeAiHtml(html: string): string {
  if (!html) return html;
  return DOMPurify.sanitize(html, {
    // Allow the full set of HTML elements used in AI-generated documents
    FORCE_BODY: false,
    WHOLE_DOCUMENT: true,
    // Keep inline styles (required for resume/dashboard formatting)
    ALLOW_DATA_ATTR: false,
    // Remove all event handlers and javascript: URIs
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    // Allow <style> blocks and <link rel=stylesheet> so dashboards render correctly
    ADD_TAGS: ["style", "link"],
    ADD_ATTR: ["rel", "href", "type"],
  });
}
