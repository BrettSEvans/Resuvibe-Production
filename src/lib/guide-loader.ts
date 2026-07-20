import { Guide, GuideIndex, parseGuideMarkdown, buildGuideIndex } from "./plugins/markdown-loader";
import { promises as fs } from "fs";
import path from "path";

/**
 * Load all markdown guides from the SinglePages directory
 * This function is called at build time to generate the guide index
 */
export async function loadAllGuides(): Promise<GuideIndex> {
  const docsDir = path.resolve(__dirname, "../../docs/pSEO project/SinglePages");

  try {
    const files = await fs.readdir(docsDir);
    const markdownFiles = files.filter((f) => f.endsWith(".md"));

    const guides: Guide[] = [];

    for (const file of markdownFiles) {
      const filePath = path.join(docsDir, file);
      const content = await fs.readFile(filePath, "utf-8");

      try {
        const guide = parseGuideMarkdown(content);
        guides.push(guide);
      } catch (error) {
        console.error(`Error parsing ${file}:`, error);
        throw error;
      }
    }

    return buildGuideIndex(guides);
  } catch (error) {
    console.error("Error loading guides:", error);
    throw error;
  }
}

/**
 * Generate a JSON string of the guide index for embedding in the build
 */
export function serializeGuideIndex(index: GuideIndex): string {
  // Convert Maps to objects for JSON serialization
  const serialized = {
    guides: index.guides,
    bySlug: index.bySlug,
    byCategory: index.byCategory,
    categories: index.categories,
  };
  return JSON.stringify(serialized);
}
