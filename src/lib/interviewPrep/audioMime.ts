/**
 * Audio capture format detection for voice dictation.
 *
 * Browsers disagree on MediaRecorder output: Chrome/Firefox produce
 * `audio/webm;opus`, Safari produces `audio/mp4` (AAC). We must feature-detect
 * the first supported type via `MediaRecorder.isTypeSupported` rather than
 * hardcode — a hardcoded type breaks silently on Safari. All of these are
 * accepted by the server-side transcription provider, so no transcoding.
 */
export const AUDIO_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4", // Safari / iOS
  "audio/mpeg",
  "audio/ogg;codecs=opus",
] as const;

export function pickSupportedAudioMimeType(
  candidates: readonly string[] = AUDIO_MIME_CANDIDATES,
): string {
  if (
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function"
  ) {
    return "";
  }
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

/** True when the browser can capture audio for the universal (server-STT) path. */
export function isMediaRecorderSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}
