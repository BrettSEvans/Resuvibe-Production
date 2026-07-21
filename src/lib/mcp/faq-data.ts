// Load the FAQ guide index at build time so the emitted Deno MCP function
// has no filesystem or network dependency at runtime.
import guideIndex from "../../../public/guide-index.json" with { type: "json" };

export interface GuideSection {
  heading: string;
  content: string;
}

export interface Guide {
  slug: string;
  title: string;
  category?: string;
  description?: string;
  sections?: GuideSection[];
}

interface GuideIndexShape {
  guides: Guide[];
  bySlug?: Record<string, Guide>;
}

const index = guideIndex as GuideIndexShape;

export const guides: Guide[] = index.guides ?? [];

export function getGuideBySlug(slug: string): Guide | undefined {
  if (index.bySlug && index.bySlug[slug]) return index.bySlug[slug];
  return guides.find((g) => g.slug === slug);
}

export function summarizeGuide(g: Guide) {
  return {
    slug: g.slug,
    title: g.title,
    category: g.category,
    description: g.description,
    url: `https://resuvibe.ai/FAQ/${g.slug}`,
  };
}
