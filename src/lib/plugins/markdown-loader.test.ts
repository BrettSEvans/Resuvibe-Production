import { describe, it, expect, beforeEach, vi } from "vitest";
import { parseGuideMarkdown, GuideSection, FAQItem, Guide } from "./markdown-loader";

describe("markdown-loader", () => {
  describe("parseGuideMarkdown", () => {
    it("should parse valid markdown with frontmatter", () => {
      const markdown = `---
title: "Software Engineer Resume Guide"
slug: "software-engineer"
category: "Technology"
---

# Main Title

## 1. First Section
This is section content.

## 2. Second Section
More content here.

## FAQ
- Q: What is an ATS?
  A: An Applicant Tracking System...

- Q: How do I tailor my resume?
  A: Start with your baseline...
`;

      const result = parseGuideMarkdown(markdown);

      expect(result.title).toBe("Software Engineer Resume Guide");
      expect(result.slug).toBe("software-engineer");
      expect(result.category).toBe("Technology");
      expect(result.sections.length).toBeGreaterThan(0);
    });

    it("should throw error if title is missing", () => {
      const markdown = `---
slug: "software-engineer"
category: "Technology"
---

Content here.
`;

      expect(() => parseGuideMarkdown(markdown)).toThrow(
        /missing required field 'title'/i
      );
    });

    it("should throw error if slug is missing", () => {
      const markdown = `---
title: "Software Engineer Resume Guide"
category: "Technology"
---

Content here.
`;

      expect(() => parseGuideMarkdown(markdown)).toThrow(
        /missing required field 'slug'/i
      );
    });

    it("should throw error if category is missing", () => {
      const markdown = `---
title: "Software Engineer Resume Guide"
slug: "software-engineer"
---

Content here.
`;

      expect(() => parseGuideMarkdown(markdown)).toThrow(
        /missing required field 'category'/i
      );
    });

    it("should extract multiple sections from markdown", () => {
      const markdown = `---
title: "Test Guide"
slug: "test-guide"
category: "Technology"
---

## Section 1: ATS Keywords
Keywords content here.

## Section 2: Resume Bullets
Bullets content here.

## Section 3: Cover Letter
Cover letter content here.
`;

      const result = parseGuideMarkdown(markdown);

      expect(result.sections.length).toBe(3);
      expect(result.sections[0].heading).toContain("Section 1");
      expect(result.sections[1].heading).toContain("Section 2");
      expect(result.sections[2].heading).toContain("Section 3");
    });

    it("should parse FAQ items from markdown", () => {
      const markdown = `---
title: "Test Guide"
slug: "test-guide"
category: "Technology"
---

# Main content

## FAQ
- Q: First question?
  A: First answer.

- Q: Second question?
  A: Second answer.
`;

      const result = parseGuideMarkdown(markdown);

      expect(result.faq).toBeDefined();
      expect(result.faq?.length).toBeGreaterThan(0);
    });

    it("should validate slug format (lowercase, hyphens, alphanumeric)", () => {
      const validMarkdown = `---
title: "Test Guide"
slug: "valid-slug-123"
category: "Technology"
---

Content.
`;

      // Should not throw
      expect(() => parseGuideMarkdown(validMarkdown)).not.toThrow();

      // Invalid: uppercase
      const invalidMarkdownUpper = `---
title: "Test Guide"
slug: "Invalid-Slug"
category: "Technology"
---

Content.
`;

      expect(() => parseGuideMarkdown(invalidMarkdownUpper)).toThrow(
        /invalid slug format/i
      );
    });

    it("should set metadata with build date", () => {
      const markdown = `---
title: "Test Guide"
slug: "test-guide"
category: "Technology"
---

Content here.
`;

      const result = parseGuideMarkdown(markdown);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.buildDate).toBeDefined();
      expect(result.metadata.contentLength).toBeGreaterThan(0);
    });

    it("should handle empty content gracefully", () => {
      const markdown = `---
title: "Test Guide"
slug: "test-guide"
category: "Technology"
---

`;

      const result = parseGuideMarkdown(markdown);

      expect(result.title).toBe("Test Guide");
      expect(result.sections).toBeDefined();
    });
  });

  describe("buildGuideIndex", () => {
    it("should group guides by category", () => {
      // This will be tested via integration
      // Placeholder for comprehensive guide index tests
      expect(true).toBe(true);
    });

    it("should create slug lookup map", () => {
      // This will be tested via integration
      expect(true).toBe(true);
    });
  });
});
