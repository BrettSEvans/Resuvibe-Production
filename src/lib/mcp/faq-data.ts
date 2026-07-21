// Fetch the FAQ guide index at request time from the app's own public site so
// the emitted Deno MCP function stays small (the full JSON is ~5 MB, well over
// Supabase's 5 MB function-source limit). Result is cached in module scope for
// the lifetime of the isolate.

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

const GUIDE_INDEX_URL = "https://resuvibe.ai/guide-index.json";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

let cache: { data: GuideIndexShape; fetchedAt: number } | null = null;
let inflight: Promise<GuideIndexShape> | null = null;

async function loadIndex(): Promise<GuideIndexShape> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.data;
  if (inflight) return inflight;
  inflight = (async () => {
    const res = await fetch(GUIDE_INDEX_URL, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`Failed to load FAQ index: ${res.status}`);
    const data = (await res.json()) as GuideIndexShape;
    cache = { data, fetchedAt: Date.now() };
    return data;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export async function getAllGuides(): Promise<Guide[]> {
  const idx = await loadIndex();
  return idx.guides ?? [];
}

export async function getGuideBySlug(slug: string): Promise<Guide | undefined> {
  const idx = await loadIndex();
  if (idx.bySlug && idx.bySlug[slug]) return idx.bySlug[slug];
  return (idx.guides ?? []).find((g) => g.slug === slug);
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
