import { defineTool } from "@lovable.dev/mcp-js";
import { getAllGuides, summarizeGuide } from "../faq-data";

export default defineTool({
  name: "list_faq_guides",
  title: "List FAQ guides",
  description:
    "List every public FAQ / resume guide published on ResuVibe. Returns slug, title, category, short description, and canonical URL for each guide.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const items = (await getAllGuides()).map(summarizeGuide);
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { guides: items, count: items.length },
    };
  },
});
