import { supabase } from "@/integrations/supabase/client";

/**
 * Sends a recorded audio blob to the `transcribe-answer` edge function and
 * returns the transcript text. Uses multipart form-data so the raw audio is
 * streamed without base64 bloat. Kept in its own module so the existing
 * Interview Prep API surface is untouched.
 */
export async function transcribeAnswer(audio: Blob): Promise<string> {
  const form = new FormData();
  const ext = audio.type.includes("mp4")
    ? "mp4"
    : audio.type.includes("ogg")
      ? "ogg"
      : audio.type.includes("mpeg")
        ? "mp3"
        : "webm";
  form.append("audio", audio, `answer.${ext}`);

  const { data, error } = await supabase.functions.invoke("transcribe-answer", {
    body: form,
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || "Transcription failed");
  return (data.text as string) ?? "";
}
