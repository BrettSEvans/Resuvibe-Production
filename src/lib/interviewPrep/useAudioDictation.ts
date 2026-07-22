import { useCallback, useRef, useState } from "react";
import { isMediaRecorderSupported, pickSupportedAudioMimeType } from "./audioMime";
import { transcribeAnswer } from "@/lib/api/transcribeAnswer";

export type DictationState =
  | "unsupported"
  | "idle"
  | "recording"
  | "transcribing"
  | "error";

/**
 * The universal voice-dictation path: capture audio with MediaRecorder
 * (supported in every modern browser incl. Firefox and iOS Safari), then
 * transcribe server-side via the `transcribe-answer` edge function. Emits the
 * transcript through `onTranscript`; the caller decides how to merge it into the
 * answer text. Degrades to `unsupported` when the browser can't capture audio —
 * the caller keeps typing as the primary path.
 */
export function useAudioDictation(opts: {
  onTranscript: (text: string) => void;
  maxSeconds?: number;
}) {
  const { onTranscript, maxSeconds = 120 } = opts;
  const [state, setState] = useState<DictationState>(() =>
    isMediaRecorderSupported() ? "idle" : "unsupported",
  );
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const releaseStream = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!isMediaRecorderSupported()) {
      setState("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickSupportedAudioMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        releaseStream();
        setState("transcribing");
        try {
          const blob = new Blob(chunksRef.current, {
            type: mimeType || "audio/webm",
          });
          const text = await transcribeAnswer(blob);
          onTranscript(text);
          setState("idle");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Transcription failed");
          setState("error");
        }
      };

      recorder.start();
      setState("recording");
      // Safety cap so a forgotten recording can't run (and bill) forever.
      timerRef.current = setTimeout(stop, maxSeconds * 1000);
    } catch {
      releaseStream();
      setError("Microphone unavailable or permission denied");
      setState("error");
    }
  }, [maxSeconds, onTranscript, releaseStream, stop]);

  const reset = useCallback(() => {
    setError(null);
    setState(isMediaRecorderSupported() ? "idle" : "unsupported");
  }, []);

  return {
    state,
    error,
    supported: state !== "unsupported",
    start,
    stop,
    reset,
  };
}
