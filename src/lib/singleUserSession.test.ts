import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSingleUserSessionResult,
  getSingleUserSessionResult,
  setSingleUserSessionResult,
  subscribeToSingleUserSession,
} from "./singleUserSession";

describe("single-user session store", () => {
  beforeEach(() => {
    clearSingleUserSessionResult();
  });

  it("stores generated materials in module memory", () => {
    setSingleUserSessionResult({
      id: "session-1",
      companyName: "Acme",
      jobTitle: "Frontend Engineer",
      resumeHtml: "<p>Resume</p>",
      coverLetter: "Cover",
      createdAt: "2026-06-03T12:00:00.000Z",
    });

    expect(getSingleUserSessionResult()).toMatchObject({
      companyName: "Acme",
      jobTitle: "Frontend Engineer",
      resumeHtml: "<p>Resume</p>",
      coverLetter: "Cover",
    });
  });

  it("notifies subscribers when the session changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSingleUserSession(listener);

    setSingleUserSessionResult({
      id: "session-1",
      companyName: "",
      jobTitle: "Role",
      resumeHtml: "<p>Resume</p>",
      coverLetter: "Cover",
      createdAt: "2026-06-03T12:00:00.000Z",
    });

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    clearSingleUserSessionResult();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
