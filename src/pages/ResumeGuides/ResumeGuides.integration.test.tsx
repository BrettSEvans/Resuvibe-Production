import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DirectoryPage } from "./DirectoryPage";
import { GuidePage } from "./GuidePage";
import { Guide, GuideIndex } from "@/lib/plugins/markdown-loader";

// Mock guide data for testing
const mockGuides: Guide[] = [
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
        answer: "An Applicant Tracking System...",
      },
      {
        question: "How do I tailor my resume?",
        answer: "Start with your baseline...",
      },
    ],
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
        answer: "Product sense, data literacy...",
      },
    ],
    metadata: {
      buildDate: new Date().toISOString(),
      contentLength: 400,
    },
  },
];

const mockGuideIndex: GuideIndex = {
  guides: mockGuides,
  bySlug: {
    "software-engineer": mockGuides[0],
    "product-manager": mockGuides[1],
  },
  byCategory: {
    Technology: [mockGuides[0]],
    "Product & Design": [mockGuides[1]],
  },
  categories: ["Product & Design", "Technology"],
};

describe("ResumeGuides Components", () => {
  describe("DirectoryPage", () => {
    it("should render all roles grouped by category", () => {
      const { container } = render(
        <BrowserRouter>
          <DirectoryPage guideIndex={mockGuideIndex} />
        </BrowserRouter>
      );

      // Check for category headers in main content (not footer)
      const categoryHeaders = container.querySelectorAll("main h2");
      const categories = Array.from(categoryHeaders).map((h) => h.textContent);
      expect(categories).toContain("Product & Design");
      expect(categories).toContain("Technology");

      expect(
        screen.getByText("Product Manager Resume Guide")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Software Engineer Resume Guide")
      ).toBeInTheDocument();
    });

    it("should filter roles by search query in real-time", async () => {
      render(
        <BrowserRouter>
          <DirectoryPage guideIndex={mockGuideIndex} />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: "product" } });

      await waitFor(() => {
        expect(
          screen.getByText("Product Manager Resume Guide")
        ).toBeInTheDocument();
        expect(
          screen.queryByText("Software Engineer Resume Guide")
        ).not.toBeInTheDocument();
      });
    });

    it("should show empty state when search has no matches", async () => {
      render(
        <BrowserRouter>
          <DirectoryPage guideIndex={mockGuideIndex} />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });

      await waitFor(() => {
        expect(screen.getByText(/no roles match/i)).toBeInTheDocument();
      });
    });

    it("should clear search when clear button is clicked", async () => {
      render(
        <BrowserRouter>
          <DirectoryPage guideIndex={mockGuideIndex} />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: "product" } });

      const clearButton = screen.getByText(/clear/i);
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(
          screen.getByText("Software Engineer Resume Guide")
        ).toBeInTheDocument();
      });
    });

    it("should have links to individual guide pages", () => {
      render(
        <BrowserRouter>
          <DirectoryPage guideIndex={mockGuideIndex} />
        </BrowserRouter>
      );

      const softwareEngineerLink = screen.getByRole("link", {
        name: /software engineer/i,
      });
      expect(softwareEngineerLink).toHaveAttribute(
        "href",
        "/resume-guides/software-engineer"
      );
    });
  });

  describe("GuidePage", () => {
    it("should render guide title and all sections", () => {
      const guidePageProps = {
        guide: mockGuides[0],
      };

      render(
        <BrowserRouter>
          <GuidePage {...guidePageProps} />
        </BrowserRouter>
      );

      expect(
        screen.getByText("Software Engineer Resume Guide")
      ).toBeInTheDocument();
      expect(screen.getByText("ATS Keywords")).toBeInTheDocument();
      expect(screen.getByText("Resume Bullets")).toBeInTheDocument();
    });

    it("should render FAQ accordion with all questions collapsed by default", () => {
      const guidePageProps = {
        guide: mockGuides[0],
      };

      render(
        <BrowserRouter>
          <GuidePage {...guidePageProps} />
        </BrowserRouter>
      );

      expect(screen.getByText("What is an ATS?")).toBeInTheDocument();
      expect(screen.getByText("How do I tailor my resume?")).toBeInTheDocument();

      // FAQ answers should not be visible initially (collapsed)
      const answers = screen.queryAllByText(/Applicant Tracking System/);
      expect(answers.length).toBe(0);
    });

    it("should expand and collapse FAQ accordion items", async () => {
      const guidePageProps = {
        guide: mockGuides[0],
      };

      render(
        <BrowserRouter>
          <GuidePage {...guidePageProps} />
        </BrowserRouter>
      );

      const firstQuestion = screen.getByText("What is an ATS?");
      fireEvent.click(firstQuestion);

      await waitFor(() => {
        expect(screen.getByText(/Applicant Tracking System/)).toBeInTheDocument();
      });
    });

    it("should implement single-open FAQ behavior", async () => {
      const guidePageProps = {
        guide: mockGuides[0],
      };

      render(
        <BrowserRouter>
          <GuidePage {...guidePageProps} />
        </BrowserRouter>
      );

      // Open first question
      const firstQuestion = screen.getByText("What is an ATS?");
      fireEvent.click(firstQuestion);

      await waitFor(() => {
        expect(screen.getByText(/Applicant Tracking System/)).toBeInTheDocument();
      });

      // Open second question (should close first)
      const secondQuestion = screen.getByText("How do I tailor my resume?");
      fireEvent.click(secondQuestion);

      await waitFor(() => {
        expect(screen.getByText(/Start with your baseline/)).toBeInTheDocument();
      });

      // First answer should no longer be visible
      expect(
        screen.queryByText(/Applicant Tracking System/)
      ).not.toBeInTheDocument();
    });

    it("should have CTA button that links to sign-up with role param", () => {
      const guidePageProps = {
        guide: mockGuides[0],
      };

      render(
        <BrowserRouter>
          <GuidePage {...guidePageProps} />
        </BrowserRouter>
      );

      const ctaButton = screen.getByText(/start your free trial/i);
      expect(ctaButton).toBeInTheDocument();

      // Check that it's a link to sign-up with role param
      const ctaLink = ctaButton.closest("a");
      expect(ctaLink).toHaveAttribute("href", "/sign-up?role=software-engineer");
    });

    it("should include schema.org FAQPage structured data", () => {
      const guidePageProps = {
        guide: mockGuides[0],
      };

      const { container } = render(
        <BrowserRouter>
          <GuidePage {...guidePageProps} />
        </BrowserRouter>
      );

      // Check for structured data script
      const scriptTag = container.querySelector(
        'script[type="application/ld+json"]'
      );
      expect(scriptTag).toBeInTheDocument();

      // Parse and verify structure
      const structuredData = JSON.parse(scriptTag?.textContent || "{}");
      expect(structuredData["@type"]).toBe("FAQPage");
      expect(structuredData.mainEntity).toBeDefined();
      expect(Array.isArray(structuredData.mainEntity)).toBe(true);
    });

    it("should render numbered section headings", () => {
      const guidePageProps = {
        guide: mockGuides[0],
      };

      const { container } = render(
        <BrowserRouter>
          <GuidePage {...guidePageProps} />
        </BrowserRouter>
      );

      // Check for numbered headings (1., 2., etc.) in main content
      const mainContent = container.querySelector("main");
      const numberedText = mainContent?.textContent || "";
      expect(numberedText).toContain("1.");
      expect(numberedText).toContain("2.");
    });
  });

  describe("CTA and Sign-Up Integration", () => {
    it("should pass role slug in query parameter to sign-up", () => {
      const guidePageProps = {
        guide: mockGuides[0],
      };

      render(
        <BrowserRouter>
          <GuidePage {...guidePageProps} />
        </BrowserRouter>
      );

      const ctaButton = screen.getByText(/start your free trial/i);
      const href = ctaButton.closest("a")?.getAttribute("href");

      expect(href).toContain("?role=software-engineer");
    });
  });
});
