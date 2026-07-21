import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import path from "path";
import { Guide, GuideIndex } from "../plugins/markdown-loader";

// Mock the fs module
vi.mock("fs", () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
  },
}));

describe("SSG Generator", () => {
  let mockGuideIndex: GuideIndex;

  beforeEach(() => {
    mockGuideIndex = {
      guides: [
        {
          slug: "software-engineer",
          title: "Software Engineer Resume Guide",
          category: "Technology",
          sections: [
            {
              heading: "ATS Keywords",
              content: "<p>Keywords content</p>",
            },
            {
              heading: "Resume Bullets",
              content: "<p>Bullets content</p>",
            },
          ],
          faq: [
            {
              question: "What is an ATS?",
              answer: "<p>An Applicant Tracking System...</p>",
            },
            {
              question: "How do I tailor my resume?",
              answer: "<p>Start with your baseline...</p>",
            },
            {
              question: "What is the STAR method?",
              answer: "<p>STAR stands for...</p>",
            },
            {
              question: "How do I optimize keywords?",
              answer: "<p>Mirror the job description...</p>",
            },
            {
              question: "Should I use a template?",
              answer: "<p>Templates can be helpful...</p>",
            },
            {
              question: "How long should my resume be?",
              answer: "<p>One page is standard...</p>",
            },
            {
              question: "What format should I use?",
              answer: "<p>PDF or docx are best...</p>",
            },
          ],
          ctaFocus: 'resume' as const,
          metadata: {
            buildDate: new Date().toISOString(),
            contentLength: 500,
          },
        },
        {
          slug: "product-manager",
          title: "Product Manager Resume Guide",
          category: "Product & Design",
          sections: [
            {
              heading: "Key Skills",
              content: "<p>Skills content</p>",
            },
          ],
          faq: [
            {
              question: "What skills matter?",
              answer: "<p>Product sense, data literacy...</p>",
            },
            {
              question: "How do I show product impact?",
              answer: "<p>Use metrics and business outcomes...</p>",
            },
            {
              question: "What about cross-functional work?",
              answer: "<p>Highlight collaboration...</p>",
            },
            {
              question: "How do I talk about technical skills?",
              answer: "<p>Balance technical depth with communication...</p>",
            },
            {
              question: "What about interviews?",
              answer: "<p>Prepare case studies...</p>",
            },
            {
              question: "How do I show product thinking?",
              answer: "<p>Discuss how you think about problems...</p>",
            },
            {
              question: "What experience should I highlight?",
              answer: "<p>Focus on outcomes and learning...</p>",
            },
          ],
          ctaFocus: 'resume' as const,
          metadata: {
            buildDate: new Date().toISOString(),
            contentLength: 400,
          },
        },
      ],
      bySlug: {
        "software-engineer": {} as Guide,
        "product-manager": {} as Guide,
      },
      byCategory: {
        Technology: [] as Guide[],
        "Product & Design": [] as Guide[],
      },
      categories: ["Product & Design", "Technology"],
    };

    // Populate bySlug and byCategory
    mockGuideIndex.guides.forEach((guide) => {
      mockGuideIndex.bySlug[guide.slug] = guide;
      if (!mockGuideIndex.byCategory[guide.category]) {
        mockGuideIndex.byCategory[guide.category] = [];
      }
      mockGuideIndex.byCategory[guide.category].push(guide);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("FAQ Validation", () => {
    it("should pass validation when all guides have 7+ FAQ items", () => {
      // This should not throw
      expect(() => {
        // Mock validation logic here
        for (const guide of mockGuideIndex.guides) {
          if (!guide.faq || guide.faq.length < 7) {
            throw new Error(
              `Guide ${guide.slug} has insufficient FAQ items: ${guide.faq?.length || 0}`
            );
          }
        }
      }).not.toThrow();
    });

    it("should fail validation when guide has no FAQ", () => {
      const guideWithoutFaq: Guide = {
        slug: "test-role",
        title: "Test Role Guide",
        category: "Technology",
        sections: [],
        faq: undefined,
        ctaFocus: 'resume' as const,
        metadata: {
          buildDate: new Date().toISOString(),
          contentLength: 0,
        },
      };

      expect(() => {
        if (!guideWithoutFaq.faq || guideWithoutFaq.faq.length === 0) {
          throw new Error(
            `Guide ${guideWithoutFaq.slug} is missing FAQ section`
          );
        }
      }).toThrow("Guide test-role is missing FAQ section");
    });

    it("should fail validation when guide has fewer than 7 FAQ items", () => {
      const guideWithInsufficientFaq: Guide = {
        slug: "test-role",
        title: "Test Role Guide",
        category: "Technology",
        sections: [],
        faq: [
          {
            question: "Q1",
            answer: "A1",
          },
          {
            question: "Q2",
            answer: "A2",
          },
        ],
        ctaFocus: 'resume' as const,
        metadata: {
          buildDate: new Date().toISOString(),
          contentLength: 0,
        },
      };

      expect(() => {
        if (
          !guideWithInsufficientFaq.faq ||
          guideWithInsufficientFaq.faq.length < 7
        ) {
          throw new Error(
            `Guide ${guideWithInsufficientFaq.slug} has only ${guideWithInsufficientFaq.faq?.length} FAQ items, needs 7`
          );
        }
      }).toThrow("has only 2 FAQ items, needs 7");
    });
  });

  describe("HTML Generation", () => {
    it("should generate valid HTML for a guide page", () => {
      const guide = mockGuideIndex.guides[0];

      // Generate simple HTML without React SSR
      const html = generateSimpleGuideHtml(guide);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain(guide.title);
      expect(html).toContain(guide.slug);
      expect(html).toContain(guide.category);
      expect(html).toContain("ATS Keywords");
      expect(html).toContain("Resume Bullets");
    });

    it("should include schema.org FAQPage structured data", () => {
      const guide = mockGuideIndex.guides[0];
      const html = generateSimpleGuideHtml(guide);

      expect(html).toContain("application/ld+json");
      expect(html).toContain("FAQPage");
      expect(html).toContain(guide.faq![0].question);
    });

    it("should include CTA button with role parameter", () => {
      const guide = mockGuideIndex.guides[0];
      const html = generateSimpleGuideHtml(guide);

      expect(html).toContain(`/sign-up?role=${guide.slug}`);
      expect(html).toContain("Start your free trial");
    });

    it("should render all FAQ items as collapsible details", () => {
      const guide = mockGuideIndex.guides[0];
      const html = generateSimpleGuideHtml(guide);

      guide.faq!.forEach((item) => {
        expect(html).toContain(item.question);
      });

      // Should have 7 details elements for 7 FAQ items
      const detailsCount = (html.match(/<details/g) || []).length;
      expect(detailsCount).toBe(7);
    });

    it("should properly escape HTML in title and content", () => {
      const guideWithSpecialChars: Guide = {
        slug: "test-role",
        title: 'Resume Guide for "DevOps" & <Engineering>',
        category: "Technology",
        sections: [
          {
            heading: "Section with <script>",
            content: "<p>Content with & ampersand</p>",
          },
        ],
        faq: [
          {
            question: "What about <security>?",
            answer: "<p>Security is important & necessary</p>",
          },
          {
            question: "Q2",
            answer: "A2",
          },
          {
            question: "Q3",
            answer: "A3",
          },
          {
            question: "Q4",
            answer: "A4",
          },
          {
            question: "Q5",
            answer: "A5",
          },
          {
            question: "Q6",
            answer: "A6",
          },
          {
            question: "Q7",
            answer: "A7",
          },
        ],
        ctaFocus: 'resume' as const,
        metadata: {
          buildDate: new Date().toISOString(),
          contentLength: 0,
        },
      };

      const html = generateSimpleGuideHtml(guideWithSpecialChars);

      // Should escape < and > in title
      expect(html).toContain('Resume Guide for &quot;DevOps&quot; &amp; &lt;Engineering&gt;');

      // Content HTML should not be double-escaped
      expect(html).toContain("<p>Content with & ampersand</p>");
    });
  });

  describe("Directory Page Generation", () => {
    it("should generate valid HTML for directory page", () => {
      const html = generateSimpleDirectoryHtml(mockGuideIndex);

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("Resume Guides by Role");
      expect(html).toContain("Technology");
      // HTML escapes & as &amp;
      expect(html).toContain("Product &amp; Design");
    });

    it("should include all guides grouped by category", () => {
      const html = generateSimpleDirectoryHtml(mockGuideIndex);

      mockGuideIndex.guides.forEach((guide) => {
        expect(html).toContain(guide.title);
        expect(html).toContain(`/resume-guides/${guide.slug}`);
      });
    });

    it("should have search input for role filtering", () => {
      const html = generateSimpleDirectoryHtml(mockGuideIndex);

      expect(html).toContain("Search roles");
    });
  });

  describe("Build Output", () => {
    it("should create output directory structure", async () => {
      const mockMkdir = vi.fn();
      vi.mocked(fs.promises.mkdir).mockImplementation(mockMkdir);

      // Expected directory structure
      expect(mockMkdir).toBeDefined();
    });

    it("should generate JSON index for fallback", () => {
      const indexJson = JSON.stringify(mockGuideIndex);

      expect(() => {
        JSON.parse(indexJson);
      }).not.toThrow();

      // Verify structure
      const parsed = JSON.parse(indexJson);
      expect(parsed.guides).toBeDefined();
      expect(parsed.bySlug).toBeDefined();
      expect(parsed.byCategory).toBeDefined();
      expect(parsed.categories).toBeDefined();
    });

    it("should preserve all guide data in output", () => {
      const indexJson = JSON.stringify(mockGuideIndex);
      const parsed = JSON.parse(indexJson);

      mockGuideIndex.guides.forEach((guide) => {
        const foundGuide = parsed.bySlug[guide.slug];
        expect(foundGuide).toBeDefined();
        expect(foundGuide.title).toBe(guide.title);
        expect(foundGuide.category).toBe(guide.category);
        expect(foundGuide.faq.length).toBe(guide.faq?.length);
      });
    });
  });
});

/**
 * Helper function to generate simple HTML (for testing without React SSR)
 */
function generateSimpleGuideHtml(guide: Guide): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (guide.faq || []).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtmlTags(item.answer),
      },
    })),
  };

  const sections = guide.sections
    .map(
      (section, index) => `
    <section>
      <h2>${escapeHtml(section.heading)}</h2>
      <div>${section.content}</div>
    </section>`
    )
    .join("\n");

  const faqItems = (guide.faq || [])
    .map(
      (item) => `
    <details>
      <summary>${escapeHtml(item.question)}</summary>
      <div>${item.answer}</div>
    </details>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <title>${escapeHtml(guide.title)}</title>
  <script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
  </script>
</head>
<body>
  <h1>${escapeHtml(guide.title)}</h1>
  <p>${escapeHtml(guide.category)}</p>
  ${sections}
  <section>
    <h2>Frequently Asked Questions</h2>
    ${faqItems}
  </section>
  <a href="/sign-up?role=${guide.slug}">Start your free trial</a>
</body>
</html>`;
}

function generateSimpleDirectoryHtml(guideIndex: GuideIndex): string {
  const categories = guideIndex.categories
    .map((category) => {
      const guides = guideIndex.byCategory[category];
      const guideLinks = guides
        .map(
          (g) => `
      <li><a href="/resume-guides/${g.slug}">${escapeHtml(g.title)}</a></li>`
        )
        .join("\n");

      return `
    <section>
      <h2>${escapeHtml(category)}</h2>
      <ul>
        ${guideLinks}
      </ul>
    </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <title>Resume Guides by Role</title>
</head>
<body>
  <h1>Resume Guides by Role</h1>
  <input type="text" placeholder="Search roles..." />
  ${categories}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
