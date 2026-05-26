/**
 * GenerationAdGate.tsx
 *
 * Inline ad unit shown during resume generation, below the progress message.
 * Loads a GAM Out-of-Page Rewarded Video slot via GPT.  The progress bar on
 * the parent page stays frozen at the "Resume" stop until either:
 *   (a) the user clicks Skip Ad (available after SKIP_DELAY_SECONDS), or
 *   (b) the ad plays to completion (rewardedSlotGranted fires).
 *
 * If GPT fails to fill the slot the component still shows the countdown so
 * the gate always resolves — never blocking the user permanently.
 *
 * TODO: replace GAM_AD_UNIT_PATH with your real GAM network code + unit path.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play } from "lucide-react";

// ---------------------------------------------------------------------------
// Config — replace with real values from your GAM account
// ---------------------------------------------------------------------------
const GAM_AD_UNIT_PATH = "/YOUR_GAM_NETWORK_CODE/covercraft-generation-video";

/** Seconds before the Skip Ad button becomes active (mirrors YouTube's 5s). */
const SKIP_DELAY_SECONDS = 5;

/** If the slot hasn't declared itself (filled or empty) within this many ms,
 *  start the countdown anyway so the gate doesn't block forever. */
const FILL_TIMEOUT_MS = 3_000;

// ---------------------------------------------------------------------------
// GPT helpers
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    googletag: any;
  }
}

function loadGPT(): Promise<void> {
  if (window.googletag?.apiReady) return Promise.resolve();
  return new Promise((resolve) => {
    if (!document.querySelector('script[src*="gpt.js"]')) {
      const s = document.createElement("script");
      s.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
      s.async = true;
      document.head.appendChild(s);
    }
    const poll = setInterval(() => {
      if (window.googletag?.apiReady) {
        clearInterval(poll);
        resolve();
      }
    }, 50);
    // Give up after 5 s
    setTimeout(() => { clearInterval(poll); resolve(); }, 5_000);
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface GenerationAdGateProps {
  /** Called once — either after the user skips or after the ad completes. */
  onComplete: () => void;
}

export function GenerationAdGate({ onComplete }: GenerationAdGateProps) {
  const [skipSecondsLeft, setSkipSecondsLeft] = useState(SKIP_DELAY_SECONDS);
  const [canSkip, setCanSkip] = useState(false);
  const [adVisible, setAdVisible] = useState(false);   // GPT slot is showing
  const [adEmpty, setAdEmpty] = useState(false);        // no fill — fallback mode

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slotRef = useRef<any>(null);

  // ── complete: call once, clean up timer ──────────────────────────────────
  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    onComplete();
  }, [onComplete]);

  // ── start skip-delay countdown ────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    if (timerRef.current) return; // already running
    setAdVisible(true);
    timerRef.current = setInterval(() => {
      setSkipSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
          setCanSkip(true);
          return 0;
        }
        return next;
      });
    }, 1_000);
  }, []);

  // ── GPT initialisation ────────────────────────────────────────────────────
  useEffect(() => {
    let fillTimeout: ReturnType<typeof setTimeout>;

    loadGPT().then(() => {
      const gt = window.googletag;
      if (!gt?.defineOutOfPageSlot || !gt?.enums?.OutOfPageFormat) {
        // GPT unavailable — start countdown immediately
        setAdEmpty(true);
        startCountdown();
        return;
      }

      gt.cmd.push(() => {
        // Define a Rewarded out-of-page slot
        const slot = gt.defineOutOfPageSlot(
          GAM_AD_UNIT_PATH,
          gt.enums.OutOfPageFormat.REWARDED,
        );

        if (!slot) {
          setAdEmpty(true);
          startCountdown();
          return;
        }

        slotRef.current = slot;
        slot.addService(gt.pubads());

        // Ad is ready to be shown → make it visible and start countdown
        gt.pubads().addEventListener("rewardedSlotReady", (evt: any) => {
          clearTimeout(fillTimeout);
          evt.makeRewardedVisible();
          startCountdown();
        });

        // User earned the reward (ad played to completion)
        gt.pubads().addEventListener("rewardedSlotGranted", () => {
          complete();
        });

        // User dismissed without earning (we still complete to unblock them)
        gt.pubads().addEventListener("rewardedSlotClosed", () => {
          complete();
        });

        // Slot rendered but is empty — fall back to countdown-only mode
        gt.pubads().addEventListener("slotRenderEnded", (evt: any) => {
          if (evt.slot === slot && evt.isEmpty) {
            clearTimeout(fillTimeout);
            setAdEmpty(true);
            startCountdown();
          }
        });

        gt.enableServices();
        gt.display(slot);

        // Fallback: if slot hasn't resolved within FILL_TIMEOUT_MS, start countdown anyway
        fillTimeout = setTimeout(() => {
          if (!timerRef.current && !completedRef.current) {
            setAdEmpty(true);
            startCountdown();
          }
        }, FILL_TIMEOUT_MS);
      });
    });

    return () => {
      clearTimeout(fillTimeout);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── derived ───────────────────────────────────────────────────────────────
  const progressPct = canSkip
    ? 100
    : ((SKIP_DELAY_SECONDS - skipSecondsLeft) / SKIP_DELAY_SECONDS) * 100;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <Card className="mt-4 overflow-hidden border-border/60">
      {/* Ad label row */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/40">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Advertisement
        </span>
        <span className="text-xs text-muted-foreground">
          Your content is ready — watch this brief ad to continue
        </span>
      </div>

      <CardContent className="p-0">
        {/* Video area — GPT renders its overlay above this; we show a branded
            placeholder so the container isn't just blank black. */}
        <div
          className="relative bg-black flex items-center justify-center"
          style={{ aspectRatio: "16 / 9", maxHeight: "260px" }}
        >
          {/* Slot target div — GPT fills this for inline formats */}
          <div id="div-gpt-ad-generation-video" className="absolute inset-0" />

          {/* Placeholder shown while waiting for fill */}
          {!adVisible && !adEmpty && (
            <div className="flex flex-col items-center gap-2 text-white/40 select-none">
              <Play className="h-10 w-10" />
              <span className="text-xs">Loading ad…</span>
            </div>
          )}

          {/* Fallback: no ad filled */}
          {adEmpty && !adVisible && (
            <div className="flex flex-col items-center gap-2 text-white/40 select-none">
              <span className="text-xs">Ad unavailable</span>
            </div>
          )}

          {/* Countdown / Skip overlay — bottom-right, over the video */}
          {adVisible && (
            <div className="absolute bottom-3 right-3 z-10">
              {canSkip ? (
                <Button
                  size="sm"
                  onClick={complete}
                  className="h-8 px-4 text-xs font-semibold bg-white/95 text-black hover:bg-white shadow-md rounded"
                >
                  Skip Ad &rsaquo;
                </Button>
              ) : (
                <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded font-medium tabular-nums">
                  Skip in {skipSecondsLeft}s
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress bar: fills over the 5-second skip delay */}
        <div className="h-[3px] bg-muted">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
