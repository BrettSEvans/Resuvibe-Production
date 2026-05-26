import { cn } from "@/lib/utils";

type AdSize =
  | "leaderboard"    // 728×90  desktop header
  | "mobile-banner"  // 320×100 mobile header
  | "skyscraper"     // 300×600 sidebar
  | "sticky-footer"; // 320×50  mobile anchor

const SIZE_MAP: Record<AdSize, { w: number; h: number; label: string }> = {
  "leaderboard":   { w: 728, h: 90,  label: "728 × 90" },
  "mobile-banner": { w: 320, h: 100, label: "320 × 100" },
  "skyscraper":    { w: 300, h: 600, label: "300 × 600" },
  "sticky-footer": { w: 320, h: 50,  label: "320 × 50" },
};

interface AdBannerProps {
  size: AdSize;
  className?: string;
}

export function AdBanner({ size, className }: AdBannerProps) {
  const { w, h, label } = SIZE_MAP[size];

  return (
    <div
      className={cn("flex items-center justify-center shrink-0", className)}
      style={{ width: w, height: h, maxWidth: "100%" }}
      aria-label="Advertisement"
    >
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-1 border border-dashed border-border/60 bg-muted/30 rounded-sm"
        style={{ minHeight: h }}
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
