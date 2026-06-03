import { describe, expect, it } from "vitest";
import { isSingleUserWorkflowEnabled } from "./featureFlags";

describe("isSingleUserWorkflowEnabled", () => {
  it("defaults the V2 single-user workflow on", () => {
    expect(isSingleUserWorkflowEnabled({})).toBe(true);
  });

  it.each(["0", "false", "off", "no"])("allows disabling with %s", (value) => {
    expect(isSingleUserWorkflowEnabled({ VITE_FUTURE_FLAG_SINGLE_USER: value })).toBe(false);
  });

  it.each(["1", "true", "on", "yes"])("allows enabling with %s", (value) => {
    expect(isSingleUserWorkflowEnabled({ VITE_FUTURE_FLAG_SINGLE_USER: value })).toBe(true);
  });
});
