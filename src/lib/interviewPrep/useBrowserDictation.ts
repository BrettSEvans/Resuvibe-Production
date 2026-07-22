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
  const [finalPreview, setFinalPreview] = useState("");
  const [interimPreview, setInterimPreview] = useState("");
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
    setFinalPreview("");
    setInterimPreview("");
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true; // show live preview while user is speaking
    rec.lang = "en-US";
    recRef.current = rec;

    rec.onstart = () => setState("listening");
    rec.onend = () => {
      setState("idle");
      setInterimPreview("");
    };
    rec.onerror = (e) => {
      setError(e?.error || "Dictation failed");
      setState("error");
      setInterimPreview("");
    };
    rec.onresult = (e) => {
      let finalChunk = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interim += r[0].transcript;
      }
      finalChunk = finalChunk.trim();
      if (finalChunk) {
        onTranscript(finalChunk);
        setFinalPreview((prev) => (prev ? `${prev} ${finalChunk}` : finalChunk));
      }
      setInterimPreview(interim.trim());
    };

    rec.start();
  }, [onTranscript]);

  return {
    state,
    error,
    supported: state !== "unsupported",
    start,
    stop,
    finalPreview,
    interimPreview,
  };
}
