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
  opts: {
    onTranscript: (text: string) => void;
    onInterim?: (text: string) => void;
    onStart?: () => void;
    silenceMs?: number;
  },
) {
  const { onTranscript, onInterim, onStart, silenceMs = 2500 } = opts;
  const [state, setState] = useState<BrowserDictationState>(() =>
    getRecognizerCtor() ? "idle" : "unsupported",
  );
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognizer | null>(null);
  const bufferRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitInterim = useCallback((text: string) => {
    onInterim?.(text);
  }, [onInterim]);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const text = bufferRef.current.join(" ").trim();
    bufferRef.current = [];
    // Clear the live preview before committing the formatted final chunk so
    // the consumer can append cleanly without double-counting.
    emitInterim("");
    if (text) {
      onTranscript(text);
    }
  }, [onTranscript, emitInterim]);

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
    onStart?.();
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
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          newFinal += r[0].transcript;
        } else {
          interim += r[0].transcript;
        }
      }
      newFinal = newFinal.trim();
      if (newFinal) {
        bufferRef.current.push(newFinal);
        scheduleFlush();
      }
      // Emit a live preview combining any buffered finals (not yet committed
      // through the silence-debounce) with the current in-progress interim
      // words, so the UI can show text as it's being spoken.
      const preview = [bufferRef.current.join(" "), interim.trim()]
        .filter(Boolean)
        .join(" ")
        .trim();
      emitInterim(preview);
    };

    rec.start();
  }, [flush, scheduleFlush, onStart, emitInterim]);


  return {
    state,
    error,
    supported: state !== "unsupported",
    start,
    stop,
  };
}
