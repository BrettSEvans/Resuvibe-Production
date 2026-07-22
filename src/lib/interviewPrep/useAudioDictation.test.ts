import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAudioDictation } from "./useAudioDictation";
import * as api from "@/lib/api/transcribeAnswer";

vi.mock("@/lib/api/transcribeAnswer", () => ({ transcribeAnswer: vi.fn() }));

class FakeMediaRecorder {
  static isTypeSupported = () => true;
  state = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(public stream: any) {}
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.onstop?.();
  }
}

const originalMR = (globalThis as { MediaRecorder?: unknown }).MediaRecorder;

afterEach(() => {
  (globalThis as { MediaRecorder?: unknown }).MediaRecorder = originalMR;
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function makeSupported() {
  (globalThis as { MediaRecorder?: unknown }).MediaRecorder = FakeMediaRecorder;
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }),
    },
  });
}

describe("useAudioDictation", () => {
  it("reports unsupported when MediaRecorder is unavailable (typing stays primary)", () => {
    (globalThis as { MediaRecorder?: unknown }).MediaRecorder = undefined;
    vi.stubGlobal("navigator", {});
    const { result } = renderHook(() => useAudioDictation({ onTranscript: vi.fn() }));
    expect(result.current.state).toBe("unsupported");
    expect(result.current.supported).toBe(false);
  });

  it("goes to error when microphone permission is denied", async () => {
    (globalThis as { MediaRecorder?: unknown }).MediaRecorder = FakeMediaRecorder;
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const { result } = renderHook(() => useAudioDictation({ onTranscript: vi.fn() }));
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state).toBe("error");
    expect(result.current.error).toMatch(/permission|unavailable/i);
  });

  it("records → transcribes → emits the transcript, then returns to idle", async () => {
    makeSupported();
    vi.mocked(api.transcribeAnswer).mockResolvedValue("my spoken answer");
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useAudioDictation({ onTranscript }));

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state).toBe("recording");

    await act(async () => {
      result.current.stop();
    });
    await waitFor(() => expect(onTranscript).toHaveBeenCalledWith("my spoken answer"));
    expect(result.current.state).toBe("idle");
  });
});
