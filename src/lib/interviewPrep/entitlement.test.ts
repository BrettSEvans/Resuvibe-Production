import { describe, it, expect } from "vitest";
import { decideEntitlement } from "./entitlement";
import type { Entitlement } from "./types";

const free = (over: Partial<Entitlement> = {}): Entitlement => ({
  subscriptionTier: "free",
  trialUsedAt: null,
  trialApplicationId: null,
  ...over,
});

// NOTE: Premium gating for Interview Prep is temporarily disabled during
// feature development and QA. `decideEntitlement` currently always returns
// `{ kind: "allow" }`. Restore the full test matrix (paid/claim/paywall) when
// the paywall is re-enabled.
describe("decideEntitlement (gating temporarily disabled)", () => {
  it("always allows regardless of entitlement state", () => {
    expect(decideEntitlement(free(), "app-1").kind).toBe("allow");
    expect(
      decideEntitlement(
        free({ trialUsedAt: "2026-07-10T00:00:00Z", trialApplicationId: "app-2" }),
        "app-1",
      ).kind,
    ).toBe("allow");
    expect(
      decideEntitlement(
        { subscriptionTier: "paid", trialUsedAt: null, trialApplicationId: null },
        "app-1",
      ).kind,
    ).toBe("allow");
  });
});
