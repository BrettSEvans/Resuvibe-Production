import { useCallback } from "react";

const SESSION_DOC_COUNT_KEY = "rv_ad_doc_count";
const SESSION_INTERSTITIAL_COUNT_KEY = "rv_ad_interstitial_count";
const SESSION_LAST_INTERSTITIAL_KEY = "rv_ad_last_interstitial_ts";

const MAX_INTERSTITIALS_PER_SESSION = 2;
const MIN_INTERSTITIAL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Interstitial fires on the 2nd and 4th document actions per session
const INTERSTITIAL_TRIGGER_COUNTS = new Set([2, 4]);

function getInt(key: string): number {
  return parseInt(sessionStorage.getItem(key) || "0", 10);
}

export function useAdManager() {
  const getDocCount = useCallback(() => getInt(SESSION_DOC_COUNT_KEY), []);
  const getInterstitialCount = useCallback(() => getInt(SESSION_INTERSTITIAL_COUNT_KEY), []);

  const shouldShowInterstitial = useCallback((): boolean => {
    const docCount = getInt(SESSION_DOC_COUNT_KEY);
    const interstitialCount = getInt(SESSION_INTERSTITIAL_COUNT_KEY);
    const lastTs = parseInt(sessionStorage.getItem(SESSION_LAST_INTERSTITIAL_KEY) || "0", 10);
    const now = Date.now();

    if (interstitialCount >= MAX_INTERSTITIALS_PER_SESSION) return false;
    if (now - lastTs < MIN_INTERSTITIAL_INTERVAL_MS) return false;
    return INTERSTITIAL_TRIGGER_COUNTS.has(docCount);
  }, []);

  // Call before the document action; returns whether to show interstitial
  const recordDocumentAction = useCallback((): boolean => {
    const newCount = getInt(SESSION_DOC_COUNT_KEY) + 1;
    sessionStorage.setItem(SESSION_DOC_COUNT_KEY, String(newCount));
    return shouldShowInterstitial();
  }, [shouldShowInterstitial]);

  const recordInterstitialShown = useCallback(() => {
    const newCount = getInt(SESSION_INTERSTITIAL_COUNT_KEY) + 1;
    sessionStorage.setItem(SESSION_INTERSTITIAL_COUNT_KEY, String(newCount));
    sessionStorage.setItem(SESSION_LAST_INTERSTITIAL_KEY, String(Date.now()));
  }, []);

  return { recordDocumentAction, recordInterstitialShown, getDocCount, getInterstitialCount };
}
