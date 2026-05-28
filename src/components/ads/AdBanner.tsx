/**
 * AdBanner.tsx
 *
 * Live AdSense display unit. Each <AdBanner size="..."> renders a real
 * <ins class="adsbygoogle"> tag and calls adsbygoogle.push({}) on mount.
 *
 * ─── SETUP CHECKLIST ────────────────────────────────────────────────────────
 *  1. Go to adsense.google.com → Ads → By ad unit → Display ads
 *  2. Create one unit for each size (names below are suggestions).
 *     After saving, click "Get code" — copy the data-ad-slot value (10 digits).
 *  3. Paste each slot ID into SLOT_IDS below, replacing the placeholder string.
 *  4. Once all four IDs are filled the component automatically goes live.
 *
 *  Unit names → suggested sizes:
 *    "ResuVibe – Leaderboard"    728 × 90   (fixed)
 *    "ResuVibe – Skyscraper"     300 × 600  (fixed)
 *    "ResuVibe – Mobile Banner"  320 × 100  (fixed)
 *    "ResuVibe – Sticky Footer"  320 × 50   (fixed)
 *
 *  Tip: set data-adtest="on" (see constant below) during initial QA so test
 *  clicks don't count as real traffic. Remove before going to production.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * SPA / tab-routing behaviour
 * ───────────────────────────
 * Components that unmount when their tab is inactive (TabsContent default)
 * automatically get a fresh push() on every remount — no extra work needed.
 *
 * Persistent units that never unmount (sidebar skyscrapers in PageShell,
 * the leaderboard in App.tsx) serve one impression per full page load.
 * To trigger a fresh impression on each tab switch for those units, pass
 * a `key` that changes with the route in the parent:
 *
 *   <AdBanner size="skyscraper" key={location.pathname} />
 *
 * This forces React to unmount + remount the component, firing push() again.
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAdConsent } from "@/hooks/useAdConsent";

// ─── AdSense config ──────────────────────────────────────────────────────────

const ADSENSE_CLIENT = "ca-pub-9524682161824217";

/**
 * Replace each placeholder with the real 10-digit data-ad-slot value from
 * adsense.google.com. While a placeholder is present the component renders
 * the grey wireframe box so layout stays intact during development.
 */
const SLOT_IDS = {
  "leaderboard":   "LEADERBOARD_SLOT_ID",   // TODO: paste slot ID
  "mobile-banner": "MOBILE_BANNER_SLOT_ID", // TODO: paste slot ID
  "skyscraper":    "SKYSCRAPER_SLOT_ID",    // TODO: paste slot ID
  "sticky-footer": "STICKY_FOOTER_SLOT_ID", // TODO: paste slot ID
} as const;

/**
 * Set to "on" during QA to serve test ads (no real impressions counted).
 * Remove or set to "" before shipping to production.
 */
const AD_TEST_MODE = "" as ("on" | "");

// ─── Types ───────────────────────────────────────────────────────────────────

type AdSize = keyof typeof SLOT_IDS;

const SIZE_MAP: Record<AdSize, { w: number; h: number; label: string }> = {
  "leaderboard":   { w: 728, h: 90,  label: "728 × 90"  },
  "mobile-banner": { w: 320, h: 100, label: "320 × 100" },
  "skyscraper":    { w: 300, h: 600, label: "300 × 600" },
  "sticky-footer": { w: 320, h: 50,  label: "320 × 50"  },
};

interface AdBannerProps {
  size: AdSize;
  className?: string;
}

// ─── Window augmentation ─────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    adsbygoogle: any[];
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

/** Returns true once all four slot IDs have been filled in. */
function isLive(size: AdSize): boolean {
  return !SLOT_IDS[size].includes("_SLOT_ID");
}

export function AdBanner({ size, className }: AdBannerProps) {
  const { w, h, label } = SIZE_MAP[size];
  const live = isLive(size);
  const insRef = useRef<HTMLModElement>(null);
  const { hasConsent } = useAdConsent();

  useEffect(() => {
    if (!live || !hasConsent) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Silently ignored — ad blocker or AdSense script not yet loaded.
    }
  }, [live, hasConsent]); // re-fires when consent is granted

  // ── No consent or slot ID not yet configured → show wireframe placeholder ──
  if (!live || !hasConsent) {
    return (
      <div
        className={cn("flex items-center justify-center shrink-0", className)}
        style={{ width: w, height: h, maxWidth: "100%" }}
        aria-label="Advertisement placeholder"
      >
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1
                     border border-dashed border-border/60 bg-muted/30 rounded-sm"
        >
          <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/50 select-none">
            Advertisement
          </span>
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-1.5 rounded-full bg-muted-foreground/20" style={{ width: Math.min(w * 0.55, 160) }} />
            <div className="h-1.5 rounded-full bg-muted-foreground/15" style={{ width: Math.min(w * 0.38, 110) }} />
          </div>
          <span className="text-[8px] text-muted-foreground/30 select-none mt-0.5">{label}</span>
        </div>
      </div>
    );
  }

  // ── Live — render real AdSense unit ──────────────────────────────────────
  return (
    <div
      className={cn("flex items-center justify-center shrink-0 overflow-hidden", className)}
      style={{ width: w, height: h, maxWidth: "100%" }}
      aria-label="Advertisement"
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "inline-block", width: w, height: h }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={SLOT_IDS[size]}
        data-ad-format="fixed"
        {...(AD_TEST_MODE ? { "data-adtest": AD_TEST_MODE } : {})}
      />
    </div>
  );
}
