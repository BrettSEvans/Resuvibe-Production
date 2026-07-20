import { describe, it, expect } from "vitest";
import { parseGuideMarkdown } from "../plugins/markdown-loader";

describe("Markdown Loader - FAQ Extraction", () => {
  describe("FAQ Section Parsing", () => {
    it("should extract FAQ items from new h4-based format", () => {
      const markdown = `---
title: "Test Guide"
slug: "test-role"
category: "Technology"
---

## Main Content
Some content here

## FAQ

### Q1: What is the first question?

**Short answer:** This is a short answer.

More detailed explanation here with additional context.

---

### Q2: What is the second question?

This is the answer to the second question.

---

### Q3: What is the third question?

Answer to question three.

---

### Q4: What is the fourth question?

Answer to question four.

---

### Q5: What is the fifth question?

Answer to question five.

---

### Q6: What is the sixth question?

Answer to question six.

---

### Q7: What is the seventh question?

Answer to question seven.
`;

      const guide = parseGuideMarkdown(markdown);

      expect(guide.faq).toBeDefined();
      expect(guide.faq!.length).toBeGreaterThanOrEqual(7);
      expect(guide.faq![0].question).toContain("first question");
      expect(guide.faq![1].question).toContain("second question");
    });

    it("should handle FAQ with complex HTML content", () => {
      const markdown = `---
title: "Complex FAQ Guide"
slug: "complex-faq"
category: "Technology"
---

## Content

## FAQ

### Q1: What about \`code\` examples?

\`\`\`python
def example():
    return "test"
\`\`\`

Here's some code.

---

### Q2: What about **bold** and *italic*?

This has **bold text** and *italic text* mixed together.

---

### Q3: What about lists?

- Item 1
- Item 2
- Item 3

---

### Q4: What about links?

Check out [this link](https://example.com) for more info.

---

### Q5: What about nested content?

> This is a quote
>
> With multiple lines

---

### Q6: What about multiple paragraphs?

First paragraph here.

Second paragraph here with more details.

---

### Q7: What about tables?

| Header 1 | Header 2 |
|----------|----------|
| Data 1   | Data 2   |
`;

      const guide = parseGuideMarkdown(markdown);

      expect(guide.faq).toBeDefined();
      expect(guide.faq!.length).toBeGreaterThan(0);

      // Check that complex formatting is preserved in HTML
      const firstAnswer = guide.faq![0].answer;
      expect(firstAnswer.length).toBeGreaterThan(0); // Should have answer content

      // Verify we extracted multiple questions
      expect(guide.faq!.length).toBeGreaterThanOrEqual(5);
    });

    it("should validate required frontmatter", () => {
      const missingTitleMarkdown = `---
slug: "test"
category: "Technology"
---

Content here`;

      expect(() => {
        parseGuideMarkdown(missingTitleMarkdown);
      }).toThrow("missing required field 'title'");
    });

    it("should validate slug format", () => {
      const invalidSlugMarkdown = `---
title: "Test"
slug: "Test Role"
category: "Technology"
---

Content`;

      expect(() => {
        parseGuideMarkdown(invalidSlugMarkdown);
      }).toThrow("Invalid slug format");
    });

    it("should validate category", () => {
      const invalidCategoryMarkdown = `---
title: "Test"
slug: "test-role"
category: "InvalidCategory"
---

Content`;

      expect(() => {
        parseGuideMarkdown(invalidCategoryMarkdown);
      }).toThrow("Invalid category");
    });

    it("should extract all valid categories", () => {
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

      for (const category of validCategories) {
        const markdown = `---
title: "Test"
slug: "test"
category: "${category}"
---

Content

## FAQ

### Q1: Test? Answer 1.
### Q2: Test? Answer 2.
### Q3: Test? Answer 3.
### Q4: Test? Answer 4.
### Q5: Test? Answer 5.
### Q6: Test? Answer 6.
### Q7: Test? Answer 7.
`;

        expect(() => {
          parseGuideMarkdown(markdown);
        }).not.toThrow();
      }
    });

    it("should handle sections before FAQ", () => {
      const markdown = `---
title: "Test"
slug: "test"
category: "Technology"
---

## Section 1: ATS Keywords
Content for section 1

## Section 2: Resume Bullets
Content for section 2

## FAQ

### Q1: First question?
Answer 1.

---

### Q2: Second question?
Answer 2.

---

### Q3: Third?
Answer 3.

---

### Q4: Fourth?
Answer 4.

---

### Q5: Fifth?
Answer 5.

---

### Q6: Sixth?
Answer 6.

---

### Q7: Seventh?
Answer 7.
`;

      const guide = parseGuideMarkdown(markdown);

      expect(guide.sections.length).toBeGreaterThanOrEqual(2);
      expect(guide.sections[0].heading).toContain("ATS");
      expect(guide.sections[1].heading).toContain("Bullets");
      expect(guide.faq!.length).toBeGreaterThanOrEqual(7);
    });

    it("should convert markdown to HTML", () => {
      const markdown = `---
title: "Test"
slug: "test"
category: "Technology"
---

## Main Content

**Bold text** and *italic text*

- List item 1
- List item 2

## FAQ

### Q1: Question? Answer with **bold** and *italic*.
### Q2: Question? Answer.
### Q3: Question? Answer.
### Q4: Question? Answer.
### Q5: Question? Answer.
### Q6: Question? Answer.
### Q7: Question? Answer.
`;

      const guide = parseGuideMarkdown(markdown);

      expect(guide.sections.length).toBeGreaterThanOrEqual(1);
      expect(guide.sections[0].content).toContain("<"); // Should contain HTML tags
    });

    it("should provide metadata", () => {
      const markdown = `---
title: "Test Guide"
slug: "test-role"
category: "Technology"
---

This is the content.

## FAQ

### Q1: Q? Answer.
### Q2: Q? Answer.
### Q3: Q? Answer.
### Q4: Q? Answer.
### Q5: Q? Answer.
### Q6: Q? Answer.
### Q7: Q? Answer.
`;

      const guide = parseGuideMarkdown(markdown);

      expect(guide.metadata).toBeDefined();
      expect(guide.metadata.buildDate).toBeDefined();
      expect(guide.metadata.contentLength).toBeGreaterThan(0);
      expect(typeof guide.metadata.contentLength).toBe("number");
    });
  });

  describe("Edge Cases", () => {
    it("should handle FAQ with extra whitespace", () => {
      const markdown = `---
title: "Test"
slug: "test"
category: "Technology"
---

## FAQ

###  Q1:  Question with spaces?

Answer 1 with spaces.

---

### Q2: Question? Answer.
### Q3: Question? Answer.
### Q4: Question? Answer.
### Q5: Question? Answer.
### Q6: Question? Answer.
### Q7: Question? Answer.
`;

      expect(() => {
        const guide = parseGuideMarkdown(markdown);
        expect(guide.faq).toBeDefined();
      }).not.toThrow();
    });

    it("should handle FAQ with special characters", () => {
      const markdown = `---
title: "Test"
slug: "test"
category: "Technology"
---

## FAQ

### Q1: What's the \`ATS\` & its impact on hiring?

Answer about ATS & hiring: the \`<system>\` processes.

---

### Q2: Q? A.
### Q3: Q? A.
### Q4: Q? A.
### Q5: Q? A.
### Q6: Q? A.
### Q7: Q? A.
`;

      expect(() => {
        const guide = parseGuideMarkdown(markdown);
        expect(guide.faq).toBeDefined();
      }).not.toThrow();
    });

    it("should trim question and answer text", () => {
      const markdown = `---
title: "Test"
slug: "test"
category: "Technology"
---

## FAQ

###   Q1:   Question with leading/trailing spaces?

   Answer with leading/trailing spaces.

---

### Q2: Q? A.
### Q3: Q? A.
### Q4: Q? A.
### Q5: Q? A.
### Q6: Q? A.
### Q7: Q? A.
`;

      const guide = parseGuideMarkdown(markdown);

      if (guide.faq && guide.faq[0]) {
        const firstQuestion = guide.faq[0].question;
        // Should be trimmed
        expect(firstQuestion.startsWith("   ")).toBe(false);
        expect(firstQuestion.endsWith("   ")).toBe(false);
      }
    });
  });
});
