import { Button } from "@/components/ui/button";
import { Mic, Square, AlertCircle } from "lucide-react";
import { useBrowserDictation } from "@/lib/interviewPrep/useBrowserDictation";

/**
 * On-device dictation button (Web Speech API). Works instantly in Chrome / Edge /
 * Safari with no backend — the convenience path for trying voice input. Not
 * universal (Firefox has it disabled), which is why the production path is the
 * server-side `AudioDictationControl`.
 */
export function BrowserDictationControl({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const d = useBrowserDictation({ onTranscript });

  if (!d.supported) {
    return (
      <p className="text-xs text-muted-foreground">
        On-device dictation isn’t available in this browser.
      </p>
    );
  }

  if (d.state === "listening") {
    return (
      <Button type="button" variant="destructive" onClick={d.stop}>
        <Square className="mr-2 h-4 w-4" /> Stop dictation
      </Button>
    );
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={d.start}>
        <Mic className="mr-2 h-4 w-4" /> Dictate
      </Button>
      {d.state === "error" && d.error && (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> {d.error}
        </span>
      )}
    </>
  );
}
