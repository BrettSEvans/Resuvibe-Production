import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DirectoryPage } from "./DirectoryPage";
import { GuidePage } from "./GuidePage";
import { Guide, GuideIndex } from "@/lib/plugins/markdown-loader";
import NotFound from "@/pages/NotFound";
import { Skeleton } from "@/components/ui/skeleton";

// This will be replaced by the actual guide index at build time
declare global {
  interface Window {
    __GUIDE_INDEX__?: GuideIndex;
  }
}

interface ResumeGuidesProps {
  slug?: string;
}

export const ResumeGuidesDirectory = () => {
  const [guideIndex, setGuideIndex] = useState<GuideIndex | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load from window object first (injected at build time)
    if (window.__GUIDE_INDEX__) {
      setGuideIndex(window.__GUIDE_INDEX__);
      setLoading(false);
      return;
    }

    // Fall back to loading from public asset
    fetch("/guide-index.json")
      .then((res) => res.json())
      .then((data) => {
        setGuideIndex(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading guide index:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-20 w-full mb-8" />
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-1/4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-20 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!guideIndex) {
    return <NotFound />;
  }

  return <DirectoryPage guideIndex={guideIndex} />;
};

export const ResumeGuidesDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load from window object first
    if (window.__GUIDE_INDEX__ && slug) {
      const foundGuide = window.__GUIDE_INDEX__.bySlug[slug];
      setGuide(foundGuide || null);
      setLoading(false);
      return;
    }

    // Fall back to loading from public asset
    if (!slug) {
      setLoading(false);
      return;
    }

    fetch("/guide-index.json")
      .then((res) => res.json())
      .then((data: GuideIndex) => {
        const foundGuide = data.bySlug[slug];
        setGuide(foundGuide || null);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading guide:", error);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-12 w-full mb-8" />
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!guide) {
    return <NotFound />;
  }

  return <GuidePage guide={guide} />;
};
