import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";

export interface GuideSection {
  heading: string;
  content: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface Guide {
  slug: string;
  title: string;
  category: string;
  sections: GuideSection[];
  faq?: FAQItem[];
  metadata: {
    buildDate: string;
    contentLength: number;
  };
}

export interface GuideIndex {
  guides: Guide[];
  bySlug: Record<string, Guide>;
  byCategory: Record<string, Guide[]>;
  categories: string[];
}

const VALID_CATEGORIES = [
  "Technology",
  "Product & Design",
  "Marketing & Sales",
  "Finance & Business Operations",
  "People Operations & HR",
  "Legal & Compliance",
  "Data & Analytics",
  "Specialized Professional",
];

/**
 * Parse a markdown file with YAML frontmatter into a Guide object
 */
export function parseGuideMarkdown(markdown: string): Guide {
  // Parse frontmatter
  const { data, content } = matter(markdown);

  // Validate required frontmatter fields
  const title = data.title as string | undefined;
  const slug = data.slug as string | undefined;
  const category = data.category as string | undefined;

  if (!title || title.trim().length === 0) {
    throw new Error("Markdown is missing required field 'title' in frontmatter");
  }

  if (!slug || slug.trim().length === 0) {
    throw new Error("Markdown is missing required field 'slug' in frontmatter");
  }

  if (!category || category.trim().length === 0) {
    throw new Error(
      "Markdown is missing required field 'category' in frontmatter"
    );
  }

  // Validate slug format: lowercase, hyphens, alphanumeric
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    throw new Error(
      `Invalid slug format: '${slug}'. Slug must be lowercase, alphanumeric, with hyphens only.`
    );
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(
      `Invalid category: '${category}'. Must be one of: ${VALID_CATEGORIES.join(
        ", "
      )}`
    );
  }

  // Parse markdown content to HTML
  const htmlContent = parseMarkdownToHtml(content);

  // Extract sections and FAQ
  const { sections, faq } = extractSectionsAndFaq(htmlContent);

  return {
    slug,
    title,
    category,
    sections,
    faq,
    metadata: {
      buildDate: new Date().toISOString(),
      contentLength: htmlContent.length,
    },
  };
}

/**
 * Parse markdown to HTML
 */
function parseMarkdownToHtml(markdown: string): string {
  const processor = unified()
    .use(remarkParse)
    .use(remarkHtml);

  const result = processor.processSync(markdown);
  return String(result);
}

/**
 * Extract sections and FAQ from HTML content
 */
function extractSectionsAndFaq(htmlContent: string): {
  sections: GuideSection[];
  faq?: FAQItem[];
} {
  const sections: GuideSection[] = [];

  // Split by h2 headers (## in markdown)
  const h2Regex = /<h2[^>]*>([^<]*)<\/h2>/g;
  let lastIndex = 0;
  let match;

  const matches: Array<{ heading: string; index: number; endIndex: number }> =
    [];

  // Find all h2 headers
  while ((match = h2Regex.exec(htmlContent)) !== null) {
    matches.push({
      heading: match[1],
      index: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Extract content between headers
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    // Skip FAQ section (it's handled separately)
    if (current.heading.toLowerCase().includes("faq")) {
      continue;
    }

    const contentStart = current.endIndex;
    const contentEnd = next ? next.index : htmlContent.length;
    const sectionContent = htmlContent.substring(contentStart, contentEnd);

    sections.push({
      heading: current.heading,
      content: sectionContent.trim(),
    });
  }

  // Extract FAQ
  let faq: FAQItem[] | undefined;
  const faqMatch = htmlContent.match(
    /<h2[^>]*>FAQ<\/h2>([\s\S]*?)(?=<h2|$)/i
  );
  if (faqMatch) {
    faq = extractFaqItems(faqMatch[1]);
  }

  return { sections, faq };
}

/**
 * Extract FAQ items from HTML
 * Handles both old list format and new h3/h4 format
 */
function extractFaqItems(faqHtml: string): FAQItem[] {
  const items: FAQItem[] = [];

  // First try new h3/h4-based format (### Q1: Question → <h3>Q1: Question</h3> or <h4>Q1: Question</h4>)
  const headerRegex = /<h[234][^>]*>Q(\d+):\s*([^<]*)<\/h[234]>/gi;
  let match;

  while ((match = headerRegex.exec(faqHtml)) !== null) {
    const qNumber = match[1];
    const qText = stripHtml(match[2]).trim();

    // Find the answer that follows this header
    const startIndex = match.index + match[0].length;
    const nextHeaderRegex = /<h[234][^>]*>Q\d+:/i;
    const nextMatch = faqHtml.substring(startIndex).match(nextHeaderRegex);

    const answerEndIndex = nextMatch
      ? startIndex + nextMatch.index
      : faqHtml.length;

    const answerHtml = faqHtml.substring(startIndex, answerEndIndex);

    // Extract the answer content - get everything until the next h[234] or hr
    let answerText = answerHtml;

    // Remove leading/trailing hr tags and whitespace
    answerText = answerText.replace(/^\s*<hr[^>]*>\s*/, "").replace(/\s*<hr[^>]*>\s*$/, "");
    answerText = answerText.trim();

    if (qText && answerText.length > 0) {
      items.push({
        question: qText,
        answer: answerText,
      });
    }
  }

  // If we found questions in the new format, return them
  if (items.length > 0) {
    return items;
  }

  // Fall back to old list format for backward compatibility
  // Look for Q&A patterns in the HTML
  // Match <li>Q: ... A: ...</li> or similar patterns
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;

  while ((match = liRegex.exec(faqHtml)) !== null) {
    const itemText = match[1];

    // Extract Q and A
    const qMatch = itemText.match(/Q:\s*([^A]*?)(?=\s*A:)/i);
    const aMatch = itemText.match(/A:\s*([\s\S]*?)$/i);

    if (qMatch && aMatch) {
      items.push({
        question: stripHtml(qMatch[1]).trim(),
        answer: stripHtml(aMatch[1]).trim(),
      });
    }
  }

  return items;
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Build a guide index from multiple guides
 */
export function buildGuideIndex(guides: Guide[]): GuideIndex {
  const bySlug: Record<string, Guide> = {};
  const byCategory: Record<string, Guide[]> = {};
  const categories = new Set<string>();

  for (const guide of guides) {
    // Check for duplicate slugs
    if (bySlug[guide.slug]) {
      throw new Error(
        `Duplicate slug found: '${guide.slug}'. Each guide must have a unique slug.`
      );
    }

    bySlug[guide.slug] = guide;

    if (!byCategory[guide.category]) {
      byCategory[guide.category] = [];
    }
    byCategory[guide.category].push(guide);
    categories.add(guide.category);
  }

  // Sort categories for consistent ordering
  const sortedCategories = Array.from(categories).sort();

  // Sort guides within each category
  for (const category of sortedCategories) {
    byCategory[category].sort((a, b) => a.title.localeCompare(b.title));
  }

  return {
    guides,
    bySlug,
    byCategory,
    categories: sortedCategories,
  };
}

/**
 * Vite plugin for markdown loading
 * This runs at build time to load and parse all markdown files
 */
export function markdownLoaderPlugin() {
  return {
    name: "markdown-loader",
    resolveId(id: string) {
      if (id === "virtual-guide-index") {
        return id;
      }
    },
    load(id: string) {
      if (id === "virtual-guide-index") {
        // This will be replaced with actual guide loading at build time
        return `export const guideIndex = {};`;
      }
    },
  };
}
