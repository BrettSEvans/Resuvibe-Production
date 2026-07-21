import { defineMcp } from "@lovable.dev/mcp-js";
import listFaqGuides from "./tools/list-faq-guides";
import getFaqGuide from "./tools/get-faq-guide";
import searchFaq from "./tools/search-faq";

export default defineMcp({
  name: "resuvibe-faq-mcp",
  title: "ResuVibe FAQ",
  version: "0.1.0",
  instructions:
    "Read-only access to ResuVibe's public FAQ and resume-guide library (the same content published at https://resuvibe.ai/FAQ). Use list_faq_guides to discover topics, search_faq to find guides by keyword, and get_faq_guide to read the full text of one guide. No user account data, applications, resumes, cover letters, or interview data are available through this server.",
  tools: [listFaqGuides, getFaqGuide, searchFaq],
});
