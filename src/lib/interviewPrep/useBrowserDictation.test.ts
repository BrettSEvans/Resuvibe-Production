import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBrowserDictation } from "./useBrowserDictation";

let lastRec: FakeRecognizer | null = null;

class FakeRecognizer {
  continuous = false;
  interimResults = false;
  lang = "";
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error?: string }) => void) | null = null;
  onresult: ((e: unknown) => void) | null = null;
  constructor() {
    lastRec = this;
  }
  start() {
    this.onstart?.();
  }
  stop() {
    this.onend?.();
  }
}

const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };

afterEach(() => {
  delete w.SpeechRecognition;
  delete w.webkitSpeechRecognition;
  lastRec = null;
  vi.clearAllMocks();
});

describe("useBrowserDictation", () => {
  it("is unsupported when the browser has no SpeechRecognition (e.g. Firefox)", () => {
    const { result } = renderHook(() => useBrowserDictation({ onTranscript: vi.fn() }));
    expect(result.current.state).toBe("unsupported");
    expect(result.current.supported).toBe(false);
  });

  it("listens, emits finalized transcript, and returns to idle on stop", () => {
    w.SpeechRecognition = FakeRecognizer;
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useBrowserDictation({ onTranscript }));
    expect(result.current.state).toBe("idle");

    act(() => result.current.start());
    expect(result.current.state).toBe("listening");

    act(() => {
      lastRec!.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: "hello world" } }],
      });
    });
    expect(onTranscript).toHaveBeenCalledWith("hello world");

    act(() => result.current.stop());
    expect(result.current.state).toBe("idle");
  });

  it("surfaces recognition errors", () => {
    w.SpeechRecognition = FakeRecognizer;
    const { result } = renderHook(() => useBrowserDictation({ onTranscript: vi.fn() }));
    act(() => result.current.start());
    act(() => lastRec!.onerror?.({ error: "no-speech" }));
    expect(result.current.state).toBe("error");
    expect(result.current.error).toBe("no-speech");
  });
});
