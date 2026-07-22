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

export function useBrowserDictation(opts: { onTranscript: (text: string) => void }) {
  const { onTranscript } = opts;
  const [state, setState] = useState<BrowserDictationState>(() =>
    getRecognizerCtor() ? "idle" : "unsupported",
  );
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognizer | null>(null);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognizerCtor();
    if (!Ctor) {
      setState("unsupported");
      return;
    }
    setError(null);
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false; // only emit finalized text into the answer
    rec.lang = "en-US";
    recRef.current = rec;

    rec.onstart = () => setState("listening");
    rec.onend = () => setState("idle");
    rec.onerror = (e) => {
      setError(e?.error || "Dictation failed");
      setState("error");
    };
    rec.onresult = (e) => {
      let chunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) chunk += e.results[i][0].transcript;
      }
      chunk = chunk.trim();
      if (chunk) onTranscript(chunk);
    };

    rec.start();
  }, [onTranscript]);

  return { state, error, supported: state !== "unsupported", start, stop };
}
