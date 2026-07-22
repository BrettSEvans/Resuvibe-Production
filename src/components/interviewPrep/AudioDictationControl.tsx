import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, AlertCircle } from "lucide-react";
import { useAudioDictation } from "@/lib/interviewPrep/useAudioDictation";

/**
 * Drop-in voice dictation control for an answer field. Records audio and
 * transcribes it server-side (universal — works in every modern browser incl.
 * Firefox), then hands the transcript back via `onTranscript` for the caller to
 * merge into the answer text. Renders nothing blocking when unsupported so
 * typing always remains the primary path.
 *
 * To add to the real Interview Prep tab later:
 *   <AudioDictationControl onTranscript={(t) => setAnswer(a => (a ? a + " " : "") + t)} />
 */
export function AudioDictationControl({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const dict = useAudioDictation({ onTranscript });

  if (!dict.supported) {
    return (
      <p className="text-xs text-muted-foreground">
        Voice dictation isn’t available in this browser — type your answer instead.
      </p>
    );
  }

  if (dict.state === "recording") {
    return (
      <Button type="button" variant="destructive" size="sm" onClick={dict.stop}>
        <Square className="mr-2 h-4 w-4" /> Stop &amp; transcribe
      </Button>
    );
  }

  if (dict.state === "transcribing") {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transcribing…
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={dict.start}
      >
        <Mic className="mr-2 h-4 w-4" /> Dictate answer
      </Button>
      {dict.state === "error" && dict.error && (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> {dict.error}
        </span>
      )}
    </div>
  );
}
