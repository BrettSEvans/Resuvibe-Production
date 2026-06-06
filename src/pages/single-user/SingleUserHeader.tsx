import { useNavigate, useLocation } from "react-router-dom";
import { FilePlus2, RefreshCw } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { clearSingleUserSessionResult } from "@/lib/singleUserSession";
import { cn } from "@/lib/utils";

export default function SingleUserHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const resetSession = () => {
    clearSingleUserSessionResult();
    navigate("/applications/new");
  };

  const links = [
    { to: "/applications", label: "Applications", match: (p: string) => p === "/applications" || p.startsWith("/applications/") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/applications/new")} className="focus:outline-none">
            <BrandLogo iconSize="2.2em" />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.to}
                href={l.to}
                className={cn(
                  "text-sm font-body underline-offset-4 hover:underline",
                  l.match(pathname) ? "text-primary" : "text-foreground"
                )}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate("/applications/new")}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            New Application
          </Button>
          <Button size="sm" variant="outline" onClick={resetSession}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Session
          </Button>
        </div>
      </div>
    </header>
  );
}
