import { useEffect, useState } from "react";
import { useAdConsent } from "@/hooks/useAdConsent";

/**
 * Dev-only floating badge that reports AdSense diagnostics:
 *   - cookie consent state
 *   - whether the AdSense script tag is in the DOM
 *   - whether window.adsbygoogle exists
 *   - whether <ins class="adsbygoogle"> units have been filled (data-ad-status="filled")
 *     vs unfilled (most common cause of blank ad slots)
 *
 * Hidden in production builds. Click to toggle expanded details.
 */
export function AdDebugIndicator() {
  const { consent, hasConsent } = useAdConsent();
  const [expanded, setExpanded] = useState(false);
  const [tick, setTick] = useState(0);

  // Re-evaluate every 2s so we catch script load + unit fills.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  if (!import.meta.env.DEV) return null;

  const scriptInDom = !!document.getElementById("adsense-script");
  const adsbygoogleReady = typeof (window as unknown as { adsbygoogle?: unknown }).adsbygoogle !== "undefined";
  const insEls = Array.from(document.querySelectorAll("ins.adsbygoogle")) as HTMLElement[];
  const total = insEls.length;
  const filled = insEls.filter((el) => el.getAttribute("data-ad-status") === "filled").length;
  const unfilled = insEls.filter((el) => el.getAttribute("data-ad-status") === "unfilled").length;
  const pending = total - filled - unfilled;

  const overallOk = hasConsent && scriptInDom && adsbygoogleReady;
  const color = !overallOk
    ? "bg-red-600"
    : filled > 0
    ? "bg-green-600"
    : unfilled > 0
    ? "bg-amber-500"
    : "bg-slate-500";

  return (
    <div
      className="fixed bottom-20 right-3 z-[60] text-xs font-mono text-white shadow-lg rounded-md select-none"
      style={{ maxWidth: 320 }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className={`${color} px-2 py-1 rounded-md flex items-center gap-2`}
        title="AdSense debug (dev only)"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-white/90" />
        ads: {filled}/{total} filled
        {pending > 0 ? ` · ${pending} pending` : ""}
        {unfilled > 0 ? ` · ${unfilled} unfilled` : ""}
      </button>
      {expanded && (
        <div className="mt-1 bg-black/85 rounded-md p-2 leading-relaxed">
          <div>consent: <b>{consent ?? "null"}</b></div>
          <div>hasConsent: <b>{String(hasConsent)}</b></div>
          <div>script tag in DOM: <b>{String(scriptInDom)}</b></div>
          <div>window.adsbygoogle: <b>{String(adsbygoogleReady)}</b></div>
          <div>ins units: <b>{total}</b> (filled {filled}, unfilled {unfilled}, pending {pending})</div>
          <div className="mt-1 opacity-70">tick #{tick}</div>
          <div className="mt-1 opacity-70">
            Unfilled = AdSense returned no ad (new unit, low inventory, policy, or ad blocker).
          </div>
        </div>
      )}
    </div>
  );
}
