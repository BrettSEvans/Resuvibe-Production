import { Button } from "@/components/ui/button";
import { Mic, Square, AlertCircle } from "lucide-react";
import { useBrowserDictation } from "@/lib/interviewPrep/useBrowserDictation";
import { cn } from "@/lib/utils";

/**
 * On-device dictation button (Web Speech API). Works instantly in Chrome / Edge /
 * Safari with no backend — the convenience path for trying voice input. Not
 * universal (Firefox has it disabled), which is why the production path is the
 * server-side `AudioDictationControl`.
 */
export function BrowserDictationControl({
  onTranscript,
  onStart,
  className,
  containerClassName,
}: {
  onTranscript: (text: string) => void;
  onStart?: () => void;
  className?: string;
  containerClassName?: string;
}) {
  const d = useBrowserDictation({ onTranscript, onStart });

  if (!d.supported) {
    return (
      <p className="text-xs text-muted-foreground">
        On-device dictation isn’t available in this browser.
      </p>
    );
  }

  const isListening = d.state === "listening";

  return (
    <div className={cn("flex flex-col items-start gap-2", containerClassName)}>
      {isListening ? (
        <Button type="button" variant="destructive" onClick={d.stop} className={className}>
          <Square className="mr-2 h-4 w-4" /> Stop dictation
        </Button>
      ) : (
        <Button type="button" variant="outline" onClick={d.start} className={className}>
          <Mic className="mr-2 h-4 w-4" /> Dictate
        </Button>
      )}

      {d.state === "error" && d.error && (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> {d.error}
        </span>
      )}
    </div>
  );
}
