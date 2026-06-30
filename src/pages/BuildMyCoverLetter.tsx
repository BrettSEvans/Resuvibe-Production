import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PenLine, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/PageShell";
import { CoverLetterAgent } from "@/components/CoverLetterAgent";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { streamTailoredLetter } from "@/lib/api/coverLetter";
import { saveJobApplication } from "@/lib/api/jobApplication";
import { stripQuestionNumber, CoverLetterContext } from "@/lib/coverLetterAgentPrompts";

/** Strip HTML tags from generated resume HTML to use as plain-text context. */
function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

/** Read the candidate's name from a generated resume's header (the leading <h1>). */
function nameFromResumeHtml(html?: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const h1 = (doc.querySelector("h1")?.textContent || "").trim();
  if (!h1 || /[[\]]/.test(h1) || h1.split(/\s+/).length > 5) return "";
  return h1;
}

const NO_JOB_RE = /^(no|not|none|nothing|skip|n\/a|na|unsure|don'?t)\b/i;

/**
 * Guided cover letter creation experience — the cover-letter counterpart to the
 * New Resume flow. It reuses what we already learned in the resume flow
 * (including whether the user is targeting a specific job) and asks a few short
 * questions before writing a concise cover letter in place of the chat.
 */
export default function BuildMyCoverLetter() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const appId = searchParams.get("app");

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["cl_profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("resume_text, master_cover_letter, first_name, last_name, counselor_conversation")
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  const { data: app, isLoading: appLoading } = useQuery({
    queryKey: ["cl_app", appId],
    enabled: !!appId,
    queryFn: async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("id, job_url, job_title, company_name, resume_html, job_description_markdown")
        .eq("id", appId!)
        .single();
      return data;
    },
  });

  const loading = profileLoading || (!!appId && appLoading);

  // Derive context: a real job from a standard application takes precedence;
  // otherwise fall back to what the resume (counselor) flow recorded.
  const context: CoverLetterContext = useMemo(() => {
    // 1. A standard application with a real employer/title.
    const appHasRealJob =
      !!app && !!app.company_name && app.company_name !== "My First Resume";
    if (appHasRealJob) {
      return {
        hasSpecificJob: true,
        jobTitle: app!.job_title || "",
        companyName: app!.company_name || "",
      };
    }

    // 2. A first-time resume: the Q2 job listing is stored on the application.
    const storedListing = (app?.job_description_markdown || "").trim();
    if (storedListing && !NO_JOB_RE.test(storedListing)) {
      const isUrl = /^https?:\/\//i.test(storedListing);
      return {
        hasSpecificJob: true,
        jobTitle: isUrl ? "" : storedListing,
        companyName: "",
      };
    }

    // 3. Fallback to whatever the resume (counselor) flow recorded, if anything.
    const conv: any = profile?.counselor_conversation || {};
    const jobListing = (conv.rawMessages?.[1] || "").trim();
    const noJob = !jobListing || NO_JOB_RE.test(jobListing);
    const hasSpecificJob = !!conv.targetProfile || (!!jobListing && !noJob);
    return {
      hasSpecificJob,
      jobTitle: hasSpecificJob ? jobListing : "",
      companyName: "",
    };
  }, [app, profile]);

  // Prefer the name on the resume tied to this application (authoritative for a
  // targeted letter); fall back to the profile name for generic letters.
  const candidateName =
    nameFromResumeHtml(app?.resume_html) ||
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
    undefined;

  const resumeText =
    profile?.resume_text?.trim() ||
    (app?.resume_html ? htmlToText(app.resume_html) : "") ||
    undefined;

  const handleGenerate = async (
    data: { questions: string[]; answers: string[] },
    onDelta: (chunk: string) => void
  ) => {
    const { questions, answers } = data;
    const tone = (answers[3] || "professional").trim();
    const qa = questions
      .map((q, i) => `- ${stripQuestionNumber(q)} ${answers[i] || ""}`)
      .join("\n");

    const jobDescription = context.hasSpecificJob
      ? `The candidate is applying for a ${context.jobTitle} position${
          context.companyName ? ` at ${context.companyName}` : ""
        }.\n\nContext from the candidate:\n${qa}`
      : `The candidate is writing a general-purpose cover letter${
          context.jobTitle ? ` for ${context.jobTitle} roles` : ""
        }, not tied to a specific job posting.\n\nContext from the candidate:\n${qa}`;

    const customInstructions = [
      "Write a short, concise cover letter — no more than three short paragraphs.",
      `Tone: ${tone}.`,
      "Ground every claim in the candidate's resume and the context provided. Do not invent employers, job titles, metrics, or experiences.",
      context.hasSpecificJob
        ? ""
        : "This is a general-purpose cover letter, so do not name a specific company and keep the wording adaptable to multiple employers.",
    ]
      .filter(Boolean)
      .join(" ");

    let full = "";
    await streamTailoredLetter({
      jobDescription,
      customInstructions,
      candidateName,
      masterCoverLetter: profile?.master_cover_letter || null,
      resumeText: resumeText || null,
      onDelta: (c) => {
        full += c;
        onDelta(c);
      },
      onDone: () => {},
    });

    // Persist to the originating application so the Cover Letter tab shows it.
    if (appId && app && full.trim()) {
      try {
        await saveJobApplication({
          id: appId,
          job_url: app.job_url || "first-resume",
          cover_letter: full,
        });
      } catch (e) {
        console.error("Failed to save cover letter to application:", e);
      }
    }
  };

  return (
    <PageShell>
      <div className="space-y-8 py-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <PenLine className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Let's create your cover letter!</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            I'm your Cover Letter Coach. I already know your background from your resume — let's
            add a few details and write it.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CoverLetterAgent context={context} onGenerate={handleGenerate} />
        )}
      </div>
    </PageShell>
  );
}
