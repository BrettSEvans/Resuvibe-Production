import { useCallback, useRef, useState } from "react";

/**
 * On-device dictation via the browser's Web Speech API. Instant and free, but
 * NOT universal — Chrome/Edge/Safari support it; Firefox ships it disabled.
 * Used as the convenience path (works with no backend). The universal production
 * path is `useAudioDictation` (MediaRecorder → server transcription).
 */
type SpeechResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> };
interface SpeechRecognizer {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onresult: ((e: SpeechEvent) => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognizerCtor = new () => SpeechRecognizer;

function getRecognizerCtor(): SpeechRecognizerCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognizerCtor;
    webkitSpeechRecognition?: SpeechRecognizerCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export type BrowserDictationState = "unsupported" | "idle" | "listening" | "error";

export function useBrowserDictation(
  opts: { onTranscript: (text: string) => void; silenceMs?: number },
) {
  const { onTranscript, silenceMs = 2500 } = opts;
  const [state, setState] = useState<BrowserDictationState>(() =>
    getRecognizerCtor() ? "idle" : "unsupported",
  );
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognizer | null>(null);
  const bufferRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const text = bufferRef.current.join(" ").trim();
    bufferRef.current = [];
    if (text) {
      onTranscript(text);
    }
  }, [onTranscript]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      flush();
    }, silenceMs);
  }, [flush, silenceMs]);

  const stop = useCallback(() => {
    flush();
    recRef.current?.stop();
  }, [flush]);

  const start = useCallback(() => {
    const Ctor = getRecognizerCtor();
    if (!Ctor) {
      setState("unsupported");
      return;
    }
    setError(null);
    bufferRef.current = [];
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    recRef.current = rec;

    rec.onstart = () => setState("listening");
    rec.onend = () => {
      flush();
      setState("idle");
    };
    rec.onerror = (e) => {
      setError(e?.error || "Dictation failed");
      setState("error");
    };
    rec.onresult = (e) => {
      let newFinal = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          newFinal += r[0].transcript;
        }
      }
      newFinal = newFinal.trim();
      if (newFinal) {
        bufferRef.current.push(newFinal);
        scheduleFlush();
      }
    };

    rec.start();
  }, [flush, scheduleFlush]);

  return {
    state,
    error,
    supported: state !== "unsupported",
    start,
    stop,
  };
}
