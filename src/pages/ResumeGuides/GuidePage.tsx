import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Guide } from "@/lib/plugins/markdown-loader";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layouts/PublicLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface GuidePageProps {
  guide: Guide;
}

export const GuidePage = ({ guide }: GuidePageProps) => {
  // Filter out CTA sections (like "Ready to land more interviews?")
  const contentSections = useMemo(() => {
    return guide.sections.filter(
      (section) =>
        !section.heading.toLowerCase().includes("ready to land") &&
        !section.heading.toLowerCase().includes("sign up")
    );
  }, [guide.sections]);

  // Generate schema.org FAQPage structured data
  const structuredData = useMemo(() => {
    if (!guide.faq || guide.faq.length === 0) {
      return null;
    }

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };
  }, [guide.faq]);

  const sectionNumber = (index: number) => index + 1;

  // Extract role name from title (e.g., "Software Engineer" from "How to Write an ATS-Optimized Software Engineer Resume | ResuVibe")
  const extractRoleName = (title: string): string => {
    // Match pattern: extract text before "Resume |", then clean up
    const match = title.match(/(.+?)\s+Resume\s*\|/);
    if (!match) return title;

    let roleName = match[1].trim();
    // Remove "How to Write an " prefix
    roleName = roleName.replace(/^How to Write an\s+/, '').trim();
    // Remove "ATS-Optimized " prefix
    roleName = roleName.replace(/^ATS-Optimized\s+/, '').trim();

    return roleName;
  };

  const roleName = useMemo(() => extractRoleName(guide.title), [guide.title]);

  // Generate CTA heading - simpler and more concise
  const ctaHeading = useMemo(() => {
    switch (guide.ctaFocus) {
      case 'resume':
        return `Let's get started on your ${roleName} resume`;
      case 'interview':
        return `Let's get ready to interview for ${roleName}`;
      default: // 'hybrid'
        return `Let's get started on your ${roleName} resume`;
    }
  }, [guide.ctaFocus, roleName]);

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm text-muted-foreground mb-2">{guide.category}</p>
          <h1 className="text-4xl font-serif mb-4">{guide.title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Everything you need to know about tailoring your resume, acing your
            interview, and landing your next {guide.category.toLowerCase()} role.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-12 mb-16">
          {contentSections.map((section, index) => (
            <section key={index}>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-primary font-serif text-xl">
                  {sectionNumber(index)}.
                </span>
                <h2 className="text-2xl font-serif">{section.heading}</h2>
              </div>
              <div
                className="prose prose-sm max-w-none text-foreground [&_p]:mb-4 [&_li]:mb-2 [&_ul]:mb-4"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </section>
          ))}
        </div>

        {/* FAQ Section */}
        {guide.faq && guide.faq.length > 0 && (
          <section className="mb-16 bg-muted/30 p-8 rounded-lg">
            <h2 className="text-2xl font-serif mb-8">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible defaultValue="">
              {guide.faq.map((item, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold text-foreground">
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-4">
                    <div
                      className="prose prose-sm max-w-none text-muted-foreground [&_p]:mb-2 [&_li]:mb-1"
                      dangerouslySetInnerHTML={{ __html: item.answer }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-muted/20 p-8 rounded-lg border border-border text-center">
          <h2 className="text-2xl font-serif mb-4">
            {ctaHeading}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Use ResuVibe to tailor your resume, generate cover letters, and
            practice interview answers—all customized for your target role.
          </p>
          <Link to={`/sign-up?role=${guide.slug}`}>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Start your free Resuvibe Trial
            </Button>
          </Link>
        </section>

        {/* Structured Data */}
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </div>
    </PublicLayout>
  );
};
