// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://resuvibe.ai";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "monthly", priority: "0.3" },
  { path: "/privacy-request", changefreq: "monthly", priority: "0.3" },
  { path: "/terms", changefreq: "monthly", priority: "0.3" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/resume-guides", changefreq: "weekly", priority: "0.8" },
  { path: "/premium", changefreq: "monthly", priority: "0.7" },
  { path: "/login", changefreq: "monthly", priority: "0.3" },
  { path: "/signup", changefreq: "monthly", priority: "0.3" },
  { path: "/reset-password", changefreq: "monthly", priority: "0.2" },
];

function loadGuideSlugs(): string[] {
  try {
    const guideIndexPath = resolve("public/guide-index.json");
    const raw = readFileSync(guideIndexPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.guides)) return [];
    return parsed.guides
      .filter((g: unknown) => g && typeof (g as { slug?: unknown }).slug === "string")
      .map((g: { slug: string }) => `/resume-guides/${g.slug}`);
  } catch (err) {
    console.warn("Could not load resume guide slugs:", err);
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const today = new Date().toISOString().split("T")[0];
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      `    <lastmod>${e.lastmod ?? today}</lastmod>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const guideEntries: SitemapEntry[] = loadGuideSlugs().map((slug) => ({
  path: slug,
  changefreq: "monthly",
  priority: "0.6",
}));

const entries = [...staticEntries, ...guideEntries];

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
