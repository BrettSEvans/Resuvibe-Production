import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdConsent, setStoredConsent } from "@/hooks/useAdConsent";
import { Button } from "@/components/ui/button";

const ADSENSE_CLIENT = "ca-pub-9524682161824217";

function injectAdSense() {
  if (document.getElementById("adsense-script")) return;
  const script = document.createElement("script");
  script.id = "adsense-script";
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}

export function CookieConsent() {
  const { consent } = useAdConsent();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (consent === null) {
      setVisible(true);
    } else if (consent === "accepted") {
      injectAdSense();
      setVisible(false);
    } else {
      setVisible(false);
    }
  }, [consent]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
    >
      <p className="text-sm text-muted-foreground">
        We use cookies and display ads to keep ResuVibe free.{" "}
        <Link to="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
      </p>
      <div className="flex gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={() => setStoredConsent("declined")}>
          Decline
        </Button>
        <Button size="sm" onClick={() => setStoredConsent("accepted")}>
          Accept
        </Button>
      </div>
    </div>
  );
}
