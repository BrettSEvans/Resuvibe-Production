import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { GuideIndex } from "@/lib/plugins/markdown-loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layouts/PublicLayout";

interface DirectoryPageProps {
  guideIndex: GuideIndex;
}

export const DirectoryPage = ({ guideIndex }: DirectoryPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter guides by search query in real-time
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      // Return all categories with their guides
      const result: Record<string, typeof guideIndex.guides> = {};
      for (const category of guideIndex.categories) {
        result[category] = guideIndex.byCategory[category] || [];
      }
      return result;
    }

    // Filter guides by search query
    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof guideIndex.guides> = {};

    for (const category of guideIndex.categories) {
      const categoryGuides = guideIndex.byCategory[category] || [];
      const matchingGuides = categoryGuides.filter(
        (guide) =>
          guide.title.toLowerCase().includes(query) ||
          guide.slug.toLowerCase().includes(query)
      );

      if (matchingGuides.length > 0) {
        filtered[category] = matchingGuides;
      }
    }

    return filtered;
  }, [searchQuery, guideIndex]);

  const hasResults = Object.values(filteredCategories).some(
    (guides) => guides.length > 0
  );

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-serif mb-4">Resume Guides by Role</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Find role-specific resume tips, interview prep strategies, and cover
            letter guidance tailored to your target position.
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-12 flex gap-2">
          <Input
            placeholder="Search by role (e.g., Software Engineer, Product Manager)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
            >
              Clear
            </Button>
          )}
        </div>

        {/* No Results State */}
        {searchQuery && !hasResults && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">
              No roles match "{searchQuery}"
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
            >
              Browse all roles
            </Button>
          </div>
        )}

        {/* Categories and Guides */}
        {hasResults && (
          <div className="space-y-12">
            {guideIndex.categories.map((category) => {
              const categoryGuides = filteredCategories[category];
              if (!categoryGuides || categoryGuides.length === 0) {
                return null;
              }

              return (
                <div key={category}>
                  <h2 className="text-2xl font-serif mb-6 pb-2 border-b-2 border-primary">
                    {category}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryGuides.map((guide) => (
                      <Link
                        key={guide.slug}
                        to={`/resume-guides/${guide.slug}`}
                        className="block p-6 border border-border rounded-md hover:border-primary hover:shadow-md transition-all"
                      >
                        <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                          {guide.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {guide.category}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};
