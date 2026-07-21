import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { guides, summarizeGuide } from "../faq-data";

export default defineTool({
  name: "search_faq",
  title: "Search FAQ guides",
  description:
    "Case-insensitive substring search across ResuVibe's public FAQ / resume guides. Matches on title, slug, category, and description. Returns summaries; call get_faq_guide for full contents.",
  inputSchema: {
    query: z.string().min(1).describe("Free-text search query."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query }) => {
    const q = query.toLowerCase();
    const matches = guides.filter((g) => {
      const hay = [g.slug, g.title, g.category ?? "", g.description ?? ""].join(" ").toLowerCase();
      return hay.includes(q);
    });
    const items = matches.map(summarizeGuide);
    return {
      content: [
        {
          type: "text",
          text:
            items.length === 0
              ? `No FAQ guides matched '${query}'.`
              : JSON.stringify(items, null, 2),
        },
      ],
      structuredContent: { guides: items, count: items.length, query },
    };
  },
});
