import { analyzeCompany } from "@/lib/api/jobApplication";
import { streamTailoredLetter } from "@/lib/api/coverLetter";
import { generateOptimizedResume } from "@/lib/api/resumeGeneration";
import { sanitizeAiHtml } from "@/lib/sanitizeHtml";
import type { SingleUserGenerationInput, SingleUserGenerationResult } from "@/lib/singleUserSession";

function companyNameFromUrl(url?: string) {
  if (!url?.trim()) return "";
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return host.replace(/^www\./, "").split(".")[0] ?? "";
  } catch {
    return "";
  }
}

function fallbackResumeHtml(resumeText: string) {
  const escaped = resumeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!DOCTYPE html><html><body><pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${escaped}</pre></body></html>`;
}

export async function generateSingleUserApplication(input: SingleUserGenerationInput): Promise<SingleUserGenerationResult> {
  const analysis = await analyzeCompany({
    companyName: companyNameFromUrl(input.companyUrl),
    jobDescription: input.jobDescription,
  }).catch(() => null);

  const companyName = analysis?.companyName || companyNameFromUrl(input.companyUrl);
  const jobTitle = input.jobTitle || analysis?.jobTitle || "Target Role";

  const resumeResult = await generateOptimizedResume({
    jobDescription: input.jobDescription,
    resumeText: input.resumeText,
    missingKeywords: [],
    companyName,
    jobTitle,
  }).catch(() => ({ resume_html: fallbackResumeHtml(input.resumeText) }));

  let coverLetter = "";
  await streamTailoredLetter({
    jobDescription: input.jobDescription,
    candidateName: "",
    masterCoverLetter: input.coverLetterText || undefined,
    resumeText: input.resumeText,
    onDelta: (text) => {
      coverLetter += text;
    },
    onDone: () => {},
  }).catch(() => {
    coverLetter = input.coverLetterText || "";
  });

  return {
    id: crypto.randomUUID(),
    companyName,
    jobTitle,
    resumeHtml: sanitizeAiHtml(resumeResult.resume_html),
    coverLetter,
    createdAt: new Date().toISOString(),
  };
}
