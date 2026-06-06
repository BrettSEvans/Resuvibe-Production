import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { AdBanner } from "@/components/ads/AdBanner";

type AppRow = {
  id: string;
  company_name: string | null;
  job_title: string | null;
  company_icon_url: string | null;
  created_at: string;
};

export default function SingleUserApplications() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("id, company_name, job_title, company_icon_url, created_at")
        .eq("generation_status", "complete")
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setApps((data ?? []) as AppRow[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell showSecondSkyscraper={apps.length >= 8}>
      <main className="px-4 md:px-8 py-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl text-foreground">Applications</h1>
          <p className="text-muted-foreground font-body mt-1">
            Completed job applications.
          </p>
        </header>

        {/* Top leaderboard / mobile banner ad */}
        <div className="mb-6 flex justify-center">
          <AdBanner size="leaderboard" className="hidden md:flex" />
          <AdBanner size="mobile-banner" className="flex md:hidden" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading applications…
          </div>
        ) : apps.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No completed applications yet.
          </Card>
        ) : (
          <ul className="grid gap-3">
            {apps.map((app, i) => (
              <div key={app.id}>
                <li>
                  <Link to={`/applications/${app.id}`} className="block group">
                    <Card className="p-4 flex items-center gap-4 hover:border-primary/50 transition-colors">
                      {app.company_icon_url ? (
                        <img
                          src={app.company_icon_url}
                          alt=""
                          className="w-10 h-10 rounded object-contain bg-muted"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground font-display">
                          {(app.company_name ?? "?").charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-lg text-foreground truncate group-hover:text-primary transition-colors">
                          {app.company_name ?? "Untitled company"}
                        </div>
                        <div className="text-sm text-muted-foreground font-body truncate">
                          {app.job_title ?? "—"}
                        </div>
                      </div>
                      <Badge variant="secondary">Complete</Badge>
                    </Card>
                  </Link>
                </li>
                {/* In-feed ad after the 5th application */}
                {i === 4 && apps.length > 5 && (
                  <li className="flex justify-center my-3">
                    <AdBanner size="leaderboard" className="hidden md:flex" />
                    <AdBanner size="mobile-banner" className="flex md:hidden" />
                  </li>
                )}
              </div>
            ))}
          </ul>
        )}
      </main>
    </PageShell>
  );
}
