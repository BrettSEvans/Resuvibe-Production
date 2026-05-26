import { useEffect, useState, useRef } from "react";
import { X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InterstitialAdProps {
  open: boolean;
  onClose: () => void; // called when ad is dismissed — caller should then trigger the real action
}

const SKIP_DELAY_S = 5;

export function InterstitialAd({ open, onClose }: InterstitialAdProps) {
  const [secondsLeft, setSecondsLeft] = useState(SKIP_DELAY_S);
  const [canSkip, setCanSkip] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      setSecondsLeft(SKIP_DELAY_S);
      setCanSkip(false);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setCanSkip(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open]);

  if (!open) return null;

  const progress = ((SKIP_DELAY_S - secondsLeft) / SKIP_DELAY_S) * 100;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 rounded-xl overflow-hidden shadow-2xl bg-black">
        {/* Mock video content */}
        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center"
          style={{ aspectRatio: "16/9" }}>

          {/* Simulated video frame */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 select-none">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <Play className="h-7 w-7 text-white/60 ml-1" />
            </div>
            <div className="space-y-2 text-center px-8">
              <div className="h-2 rounded-full bg-white/20 w-48 mx-auto" />
              <div className="h-2 rounded-full bg-white/15 w-32 mx-auto" />
            </div>
            <span className="text-xs text-white/30 uppercase tracking-widest mt-2">Advertisement</span>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Skip / countdown button */}
          <div className="absolute top-3 right-3">
            {canSkip ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={onClose}
                className="gap-1.5 text-xs h-8 bg-black/60 hover:bg-black/80 text-white border border-white/20"
              >
                <X className="h-3.5 w-3.5" /> Skip Ad
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/60 border border-white/20 text-xs text-white/70">
                Skip in {secondsLeft}s
              </div>
            )}
          </div>

          {/* Ad label */}
          <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 border border-white/20">
            <span className="text-[10px] text-white/50 uppercase tracking-wider">Ad</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-t border-white/10">
          <span className="text-xs text-white/40">Your document will be ready after this ad</span>
          {canSkip && (
            <button onClick={onClose} className="text-xs text-primary hover:underline">
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
