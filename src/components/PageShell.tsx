import { AdBanner } from "@/components/ads/AdBanner";

interface PageShellProps {
  children: React.ReactNode;
  /** Render a second 300×600 skyscraper below the first. Only shown when the
   *  caller determines the user qualifies (e.g. application list length > 5). */
  showSecondSkyscraper?: boolean;
}

export function PageShell({ children, showSecondSkyscraper = false }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-start justify-center">
        <div className="w-full max-w-[830px] min-w-0">
          {children}
        </div>
        <aside className="hidden xl:block shrink-0 pl-4 pt-4">
          <div className="sticky top-[160px] flex flex-col gap-4">
            <AdBanner size="skyscraper" />
            {showSecondSkyscraper && <AdBanner size="skyscraper-2" />}
          </div>
        </aside>
      </div>
    </div>
  );
}
