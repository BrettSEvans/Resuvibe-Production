import { useState, useEffect } from "react";

const STORAGE_KEY = "cookie_consent";
const CONSENT_CHANGED = "consent-changed";

export type ConsentValue = "accepted" | "declined" | null;

export function getStoredConsent(): ConsentValue {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "accepted" || v === "declined") return v;
    return null;
  } catch {
    return null;
  }
}

export function setStoredConsent(value: "accepted" | "declined"): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED, { detail: value }));
  } catch {
    // localStorage unavailable (private mode, etc.)
  }
}

export function useAdConsent(): { consent: ConsentValue; hasConsent: boolean } {
  const [consent, setConsent] = useState<ConsentValue>(getStoredConsent);

  useEffect(() => {
    const handler = (e: Event) => {
      setConsent((e as CustomEvent<ConsentValue>).detail);
    };
    window.addEventListener(CONSENT_CHANGED, handler);
    return () => window.removeEventListener(CONSENT_CHANGED, handler);
  }, []);

  return { consent, hasConsent: consent === "accepted" };
}
