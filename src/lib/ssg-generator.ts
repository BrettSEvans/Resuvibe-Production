import { promises as fs } from "fs";
import path from "path";
import { renderToString } from "react-dom/server";
import { Guide, GuideIndex } from "./plugins/markdown-loader";
import { GuidePage } from "@/pages/ResumeGuides/GuidePage";
import { DirectoryPage } from "@/pages/ResumeGuides/DirectoryPage";

/**
 * SSG Generator: Pre-renders all guide pages to static HTML at build time
 * This ensures content is crawlable by search engines without JavaScript
 */

/**
 * Generate static HTML for all guides
 */
export async function generateStaticGuides(
  guideIndex: GuideIndex,
  outputDir: string
): Promise<void> {
  // Create output directory if it doesn't exist
  const resumeGuidesDir = path.join(outputDir, "resume-guides");
  await fs.mkdir(resumeGuidesDir, { recursive: true });

  // Validate all guides have FAQ sections
  validateGuidesFaq(guideIndex);

  // Generate HTML for each individual guide
  for (const guide of guideIndex.guides) {
    const html = renderGuidePageToHtml(guide);
    const filePath = path.join(resumeGuidesDir, `${guide.slug}.html`);
    await fs.writeFile(filePath, html, "utf-8");
    console.log(`Generated: ${guide.slug}.html`);
  }

  // Generate directory page (index for /resume-guides)
  const directoryHtml = renderDirectoryPageToHtml(guideIndex);
  const directoryPath = path.join(resumeGuidesDir, "index.html");
  await fs.writeFile(directoryPath, directoryHtml, "utf-8");
  console.log(`Generated: index.html (directory)`);

  // Generate guide index JSON as well (for client-side fallback)
  const indexJson = JSON.stringify(guideIndex, null, 2);
  const indexPath = path.join(outputDir, "guide-index.json");
  await fs.writeFile(indexPath, indexJson, "utf-8");
  console.log(`Generated: guide-index.json`);
}

/**
 * Validate that all guides have FAQ sections
 */
function validateGuidesFaq(guideIndex: GuideIndex): void {
  const missingFaq: string[] = [];
  const insufficientFaq: string[] = [];

  for (const guide of guideIndex.guides) {
    if (!guide.faq || guide.faq.length === 0) {
      missingFaq.push(guide.slug);
    } else if (guide.faq.length < 7) {
      insufficientFaq.push(
        `${guide.slug} (has ${guide.faq.length}, needs 7)`
      );
    }
  }

  if (missingFaq.length > 0) {
    throw new Error(
      `Build failed: ${missingFaq.length} guides are missing FAQ sections: ${missingFaq.join(
        ", "
      )}`
    );
  }

  if (insufficientFaq.length > 0) {
    throw new Error(
      `Build failed: ${insufficientFaq.length} guides have fewer than 7 FAQ items: ${insufficientFaq.join(
        ", "
      )}`
    );
  }

  console.log(
    `✓ Validation passed: All ${guideIndex.guides.length} guides have FAQ sections (7+ items each)`
  );
}

/**
 * Render a guide page to static HTML
 */
function renderGuidePageToHtml(guide: Guide): string {
  // Generate structured data (schema.org FAQPage)
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

  // Build the HTML document
  const content = renderGuidePageContent(guide, structuredData);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(guide.title)}</title>
  <meta name="description" content="Resume guide for ${escapeHtml(guide.category)} roles - ATS optimization, interview prep, and resume tips" />
  <meta property="og:title" content="${escapeHtml(guide.title)}" />
  <meta property="og:description" content="Master your ${escapeHtml(guide.category)} resume with ResuVibe's role-specific guides" />
  <meta property="og:type" content="article" />
  <link rel="canonical" href="/resume-guides/${guide.slug}" />
  <script type="application/ld+json">
${JSON.stringify(structuredData, null, 2)}
  </script>
</head>
<body>
${content}
</body>
</html>`;

  return html;
}

/**
 * Render a directory page to static HTML
 */
function renderDirectoryPageToHtml(guideIndex: GuideIndex): string {
  const categoryGroups = guideIndex.categories.map((category) => {
    const guides = guideIndex.byCategory[category] || [];
    return {
      category,
      guides: guides.map((g) => ({
        slug: g.slug,
        title: g.title,
      })),
    };
  });

  const content = renderDirectoryPageContent(categoryGroups);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resume Guides by Role - ATS Optimization & Interview Prep | ResuVibe</title>
  <meta name="description" content="Explore ${guideIndex.guides.length} role-specific resume guides with ATS optimization tips, interview prep, and cover letter strategies" />
  <meta property="og:title" content="Resume Guides by Role - ResuVibe" />
  <meta property="og:description" content="Master your resume for any role - ${guideIndex.guides.length} guides covering Technology, Product, Design, Sales, and more" />
  <meta property="og:type" content="website" />
  <link rel="canonical" href="/resume-guides" />
</head>
<body>
${content}
</body>
</html>`;

  return html;
}

/**
 * Generate the main content for a guide page
 */
function renderGuidePageContent(guide: Guide, structuredData: any): string {
  const sections = guide.sections
    .map((section, index) => {
      return `
    <section>
      <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 1rem;">
        <span style="color: var(--primary); font-weight: normal; font-size: 1.25rem;">${index + 1}.</span>
        <h2 style="font-size: 1.5rem; font-weight: 600;">${escapeHtml(section.heading)}</h2>
      </div>
      <div style="line-height: 1.6; color: var(--foreground);">
        ${section.content}
      </div>
    </section>`;
    })
    .join("\n");

  const faqItems = (guide.faq || [])
    .map(
      (item, index) => `
    <details style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 0.5rem;">
      <summary style="cursor: pointer; font-weight: 600; color: var(--foreground);">
        ${escapeHtml(item.question)}
      </summary>
      <div style="margin-top: 1rem; color: var(--muted-foreground); line-height: 1.6;">
        ${item.answer}
      </div>
    </details>`
    )
    .join("\n");

  return `
  <div style="max-width: 56rem; margin: 0 auto; padding: 3rem 1rem;">
    <header style="margin-bottom: 3rem;">
      <p style="font-size: 0.875rem; color: var(--muted-foreground); margin-bottom: 0.5rem;">${escapeHtml(guide.category)}</p>
      <h1 style="font-size: 2.25rem; font-weight: 600; margin-bottom: 1rem;">${escapeHtml(guide.title)}</h1>
      <p style="font-size: 1.125rem; color: var(--muted-foreground); max-width: 42rem;">
        Everything you need to know about tailoring your resume, acing your interview, and landing your next ${escapeHtml(guide.category.toLowerCase())} role.
      </p>
    </header>

    <div style="margin-bottom: 4rem; display: flex; flex-direction: column; gap: 3rem;">
      ${sections}
    </div>

    <section style="margin-bottom: 4rem; background: rgba(0,0,0,0.03); padding: 2rem; border-radius: 0.5rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem;">
        Frequently Asked Questions
      </h2>
      <div>
        ${faqItems}
      </div>
    </section>

    <section style="background: rgba(0,0,0,0.02); padding: 2rem; border-radius: 0.5rem; border: 1px solid var(--border); text-align: center;">
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">
        Ready to land your ${escapeHtml(guide.category)} position?
      </h2>
      <p style="color: var(--muted-foreground); margin-bottom: 1.5rem; max-width: 42rem; margin-left: auto; margin-right: auto;">
        Use ResuVibe to tailor your resume, generate cover letters, and practice interview answers—all customized for your target role.
      </p>
      <a href="/sign-up?role=${guide.slug}" style="display: inline-block; background: var(--primary); color: white; padding: 0.75rem 1.5rem; border-radius: 0.375rem; text-decoration: none; font-weight: 600;">
        Start your free trial with ResuVibe
      </a>
    </section>
  </div>`;
}

/**
 * Generate content for the directory page
 */
function renderDirectoryPageContent(
  categoryGroups: Array<{ category: string; guides: Array<{ slug: string; title: string }> }>
): string {
  const categories = categoryGroups
    .map(
      (group) => `
    <section style="margin-bottom: 3rem;">
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1.5rem;">${escapeHtml(group.category)}</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
        ${group.guides
          .map(
            (guide) => `
        <a href="/resume-guides/${guide.slug}" style="padding: 1.5rem; border: 1px solid var(--border); border-radius: 0.5rem; text-decoration: none; color: var(--foreground); display: block; transition: all 0.2s;">
          <h3 style="font-weight: 600; margin-bottom: 0.5rem;">${escapeHtml(guide.title)}</h3>
          <p style="color: var(--muted-foreground); font-size: 0.875rem;">View guide →</p>
        </a>`
          )
          .join("\n")}
      </div>
    </section>`
    )
    .join("\n");

  return `
  <div style="max-width: 56rem; margin: 0 auto; padding: 3rem 1rem;">
    <header style="margin-bottom: 3rem;">
      <h1 style="font-size: 2.25rem; font-weight: 600; margin-bottom: 1rem;">Resume Guides by Role</h1>
      <p style="font-size: 1.125rem; color: var(--muted-foreground); max-width: 42rem;">
        Browse role-specific resume guides with ATS optimization tips, interview prep strategies, and cover letter guidance for 100+ positions.
      </p>
      <input type="text" placeholder="Search roles..." style="width: 100%; max-width: 400px; padding: 0.75rem; margin-top: 1.5rem; border: 1px solid var(--border); border-radius: 0.375rem;" />
    </header>

    <div>
      ${categories}
    </div>
  </div>`;
}

/**
 * Escape HTML special characters
 */
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

/**
 * Strip HTML tags from text (for plain text use)
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
