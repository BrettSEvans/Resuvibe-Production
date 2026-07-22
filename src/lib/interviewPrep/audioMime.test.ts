import { describe, it, expect, afterEach, vi } from "vitest";
import { pickSupportedAudioMimeType, isMediaRecorderSupported } from "./audioMime";

const originalMR = (globalThis as any).MediaRecorder;

afterEach(() => {
  (globalThis as any).MediaRecorder = originalMR;
  vi.unstubAllGlobals();
});

function stubMediaRecorder(supported: string[]) {
  (globalThis as any).MediaRecorder = {
    isTypeSupported: (t: string) => supported.includes(t),
  };
}

describe("pickSupportedAudioMimeType", () => {
  it("returns '' when MediaRecorder is unavailable", () => {
    (globalThis as any).MediaRecorder = undefined;
    expect(pickSupportedAudioMimeType()).toBe("");
  });

  it("picks the first supported candidate (Chrome/Firefox → webm/opus)", () => {
    stubMediaRecorder(["audio/webm;codecs=opus", "audio/webm"]);
    expect(pickSupportedAudioMimeType()).toBe("audio/webm;codecs=opus");
  });

  it("falls through to mp4 on Safari (no webm support)", () => {
    stubMediaRecorder(["audio/mp4"]);
    expect(pickSupportedAudioMimeType()).toBe("audio/mp4");
  });

  it("returns '' when none of the candidates are supported", () => {
    stubMediaRecorder([]);
    expect(pickSupportedAudioMimeType()).toBe("");
  });
});

describe("isMediaRecorderSupported", () => {
  it("is false without mediaDevices.getUserMedia", () => {
    vi.stubGlobal("navigator", {});
    stubMediaRecorder([]);
    expect(isMediaRecorderSupported()).toBe(false);
  });

  it("is true with getUserMedia and MediaRecorder present", () => {
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: () => {} } });
    stubMediaRecorder([]);
    expect(isMediaRecorderSupported()).toBe(true);
  });
});
