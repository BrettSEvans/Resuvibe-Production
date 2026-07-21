import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getGuideBySlug } from "../faq-data";

export default defineTool({
  name: "get_faq_guide",
  title: "Get FAQ guide",
  description:
    "Fetch the full contents of one public ResuVibe FAQ / resume guide by its slug. Returns title, category, canonical URL, and all section headings and HTML bodies.",
  inputSchema: {
    slug: z
      .string()
      .min(1)
      .describe("Guide slug, e.g. 'account-executive'. Use list_faq_guides to discover available slugs."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ slug }) => {
    const guide = getGuideBySlug(slug);
    if (!guide) {
      return {
        content: [{ type: "text", text: `No FAQ guide found for slug '${slug}'.` }],
        isError: true,
      };
    }
    const payload = {
      slug: guide.slug,
      title: guide.title,
      category: guide.category,
      description: guide.description,
      url: `https://resuvibe.ai/FAQ/${guide.slug}`,
      sections: guide.sections ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
