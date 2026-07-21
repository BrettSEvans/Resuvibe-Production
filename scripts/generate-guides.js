#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkHtml from "remark-html";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parser for YAML frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Invalid markdown format: missing frontmatter");
  }

  const [, frontmatterStr, body] = match;
  const frontmatter = {};

  // Simple YAML parser for our use case
  frontmatterStr.split("\n").forEach((line) => {
    if (!line.trim()) return;
    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();
    // Remove quotes if present
    frontmatter[key.trim()] = value.replace(/^["']|["']$/g, "");
  });

  return { frontmatter, body };
}

// Validate required frontmatter fields
function validateFrontmatter(frontmatter, filename) {
  const required = ["title", "slug", "category"];
  for (const field of required) {
    if (!frontmatter[field]) {
      throw new Error(`${filename}: missing required field '${field}'`);
    }
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugRegex.test(frontmatter.slug)) {
    throw new Error(
      `${filename}: invalid slug format '${frontmatter.slug}'. Must be lowercase, alphanumeric, with hyphens only.`
    );
  }

  // Validate category
  const validCategories = [
    "Technology",
    "Product & Design",
    "Marketing & Sales",
    "Finance & Business Operations",
    "People Operations & HR",
    "Legal & Compliance",
    "Data & Analytics",
    "Specialized Professional",
  ];
  if (!validCategories.includes(frontmatter.category)) {
    throw new Error(
      `${filename}: invalid category '${frontmatter.category}'. Must be one of: ${validCategories.join(
        ", "
      )}`
    );
  }
}

// Convert markdown to HTML
function markdownToHtml(markdown) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkHtml);

  const result = processor.processSync(markdown);
  return String(result);
}

// Extract sections from markdown body
function extractSections(body) {
  const sections = [];
  const lines = body.split("\n");
  let currentSection = null;
  let currentContent = [];

  for (const line of lines) {
    // Match h3 headers (### Section Title) or h2 headers (## Section Title)
    // But exclude "FAQ" section
    const headerMatch = line.match(/^(#{2,3})\s+(?!FAQ)(.+)$/);

    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections.push({
          heading: currentSection,
          content: markdownToHtml(currentContent.join("\n").trim()),
        });
      }
      let heading = headerMatch[2].trim();
      // Remove leading number and dot (e.g., "1. " or "10. ")
      heading = heading.replace(/^\d+\.\s+/, '');
      currentSection = heading;
      currentContent = [];
    } else if (currentSection && line.match(/^#{2,3}\s+FAQ/i)) {
      // Stop at FAQ section
      if (currentSection) {
        sections.push({
          heading: currentSection,
          content: markdownToHtml(currentContent.join("\n").trim()),
        });
      }
      break;
    } else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection) {
    sections.push({
      heading: currentSection,
      content: markdownToHtml(currentContent.join("\n").trim()),
    });
  }

  return sections;
}

// Extract FAQ items from markdown
function extractFaq(body) {
  const faqMatch = body.match(/^##\s+FAQ\n([\s\S]*)$/m);
  if (!faqMatch) return [];

  const faqContent = faqMatch[1];
  const items = [];

  // Match ### Qn: question... followed by answer content (h3-header based format)
  const itemRegex = /###\s+Q\d+:\s*(.+?)\n+([\s\S]*?)(?=\n###\s+Q\d+:|$)/g;
  let match;

  while ((match = itemRegex.exec(faqContent)) !== null) {
    items.push({
      question: match[1].trim(),
      answer: markdownToHtml(match[2].trim()),
    });
  }

  return items;
}

// Detect CTA focus based on section content sizes
function detectCtaFocus(sections) {
  const resumeFocusedHeadings = ['ats', 'keywords', 'resume', 'bullets', 'cover letter'];
  const interviewFocusedHeadings = ['star', 'interview', 'behavioral'];

  let resumeContentSize = 0;
  let interviewContentSize = 0;

  for (const section of sections) {
    const headingLower = section.heading.toLowerCase();
    const contentSize = section.content.length;

    if (resumeFocusedHeadings.some(keyword => headingLower.includes(keyword))) {
      resumeContentSize += contentSize;
    } else if (interviewFocusedHeadings.some(keyword => headingLower.includes(keyword))) {
      interviewContentSize += contentSize;
    }
  }

  const totalContent = resumeContentSize + interviewContentSize;
  if (totalContent === 0) {
    return 'hybrid';
  }

  const resumeRatio = resumeContentSize / totalContent;
  if (resumeRatio > 0.6) {
    return 'resume';
  } else if (resumeRatio < 0.4) {
    return 'interview';
  } else {
    return 'hybrid';
  }
}

// Parse a guide markdown file
function parseGuide(content, filename) {
  const { frontmatter, body } = parseFrontmatter(content);
  validateFrontmatter(frontmatter, filename);

  const sections = extractSections(body);
  const faq = extractFaq(body);
  const ctaFocus = detectCtaFocus(sections);

  return {
    slug: frontmatter.slug,
    title: frontmatter.title,
    category: frontmatter.category,
    sections,
    faq: faq.length > 0 ? faq : undefined,
    ctaFocus,
    metadata: {
      buildDate: new Date().toISOString(),
      contentLength: content.length,
    },
  };
}

// Build guide index
function buildGuideIndex(guides) {
  const bySlug = {};
  const byCategory = {};
  const categories = new Set();

  for (const guide of guides) {
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

  // Sort categories
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

// Main function
async function generateGuides() {
  const docsDir = path.resolve(__dirname, "../docs/pSEO project/SinglePages");
  const publicDir = path.resolve(__dirname, "../public");
  const outputFile = path.join(publicDir, "guide-index.json");

  try {
    console.log("📚 Generating guide index...");

    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Read all markdown files
    const files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));
    console.log(`Found ${files.length} markdown files`);

    const guides = [];

    for (const file of files) {
      const filePath = path.join(docsDir, file);
      const content = fs.readFileSync(filePath, "utf-8");

      try {
        const guide = parseGuide(content, file);
        guides.push(guide);
        console.log(`✓ Parsed ${file}`);
      } catch (error) {
        console.error(`✗ Error parsing ${file}:`, error.message);
        throw error;
      }
    }

    // Build index
    const index = buildGuideIndex(guides);
    console.log(
      `✓ Built index with ${guides.length} guides in ${index.categories.length} categories`
    );

    // Write to file
    fs.writeFileSync(outputFile, JSON.stringify(index, null, 2));
    console.log(`✓ Guide index written to ${outputFile}`);

    return { success: true, count: guides.length };
  } catch (error) {
    console.error("❌ Error generating guides:", error.message);
    process.exit(1);
  }
}

generateGuides().then((result) => {
  console.log(`\n✅ Successfully generated guides for ${result.count} roles`);
});
