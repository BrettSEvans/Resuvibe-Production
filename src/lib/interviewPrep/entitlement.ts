import type { Entitlement } from "./types";

export type GateDecision =
  | { kind: "allow" }
  /** Free user, trial unclaimed → claim it (bind to this application) then allow. */
  | { kind: "claim" }
  /** Free user whose one trial was already spent on another application. */
  | { kind: "paywall" };

/**
 * Pure mirror of the server-side entitlement gate (see
 * `start-interview-session`). The authoritative decision + the atomic trial
 * claim happen server-side under the service role; this exists so the client
 * can render the right state (proceed vs. paywall) without a round trip and so
 * the rule is unit-testable in isolation.
 *
 * Rule: the free trial is one Application's worth of prep, bound to
 * `trialApplicationId` once claimed.
 */
export function decideEntitlement(
  _e: Entitlement,
  _applicationId: string,
): GateDecision {
  // TEMP: Premium gating disabled for Interview Prep during feature dev/QA.
  // Restore original logic when re-enabling the paywall.
  return { kind: "allow" };
}
