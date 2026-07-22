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
  className,
  containerClassName,
}: {
  onTranscript: (text: string) => void;
  className?: string;
  containerClassName?: string;
}) {
  const d = useBrowserDictation({ onTranscript });

  if (!d.supported) {
    return (
      <p className="text-xs text-muted-foreground">
        On-device dictation isn’t available in this browser.
      </p>
    );
  }

  const isListening = d.state === "listening";
  const previewText = [d.finalPreview, d.interimPreview].filter(Boolean).join(" ");

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

      {isListening && (
        <div
          role="status"
          aria-live="polite"
          className="w-full max-w-md rounded-md border border-dashed border-border bg-muted/40 p-2 text-xs"
        >
          <div className="mb-1 flex items-center gap-1.5 font-medium text-muted-foreground">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-destructive" />
            Live transcript preview
          </div>
          {previewText ? (
            <p className="text-foreground">
              <span>{d.finalPreview}</span>
              {d.interimPreview && (
                <span className="text-muted-foreground italic">
                  {d.finalPreview ? " " : ""}
                  {d.interimPreview}
                </span>
              )}
            </p>
          ) : (
            <p className="italic text-muted-foreground">Listening… start speaking.</p>
          )}
        </div>
      )}

      {d.state === "error" && d.error && (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> {d.error}
        </span>
      )}
    </div>
  );
}
