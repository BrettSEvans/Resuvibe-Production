import { useState } from "react";
import { Sparkles } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmploymentCounselorAgent } from "@/components/EmploymentCounselorAgent";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateOptimizedResume } from "@/lib/api/resumeGeneration";
import { saveJobApplication } from "@/lib/api/jobApplication";

export default function FirstTimeJobSeeker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleCounselorComplete = async (conversationData: any) => {
    if (!user) return;

    setIsSaving(true);
    const toastId = toast.loading("Building your resume...");

    try {
      // Save conversation to profile
      await supabase
        .from("profiles")
        .update({
          counselor_conversation: conversationData,
          counselor_extracted_skills: conversationData.discoveredSkills,
        })
        .eq("id", user.id);

      // Format the 10 answers into structured resume text
      const [
        contact,
        jobListing,
        responsibilities,
        achievements,
        skills,
        impact,
        additional,
        strengths,
        workStyle,
        interests,
      ] = conversationData.rawMessages || [];

      const followUpData: Record<string, string> =
        conversationData.followUpData || {};

      const targetProfile = conversationData.targetProfile || null;

      // Role-aware follow-up answers (keyed competency_*) surfaced because the
      // target job demanded a competency the user hadn't yet mentioned.
      const competencyAnswers = Object.entries(followUpData)
        .filter(([key]) => key.startsWith("competency_"))
        .map(([, value]) => value)
        .filter(Boolean);

      // Extract candidate name from the free-form contact answer
      const nameMatch = contact?.match(/(?:my name is|i(?:'m| am))\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)+)/i);
      const candidateName = nameMatch ? nameMatch[1].trim() : null;

      const targetRole = interests?.trim() || "Entry-level position";

      // Q2: job listing — may be a URL, a job title, or "no specific job".
      // Build a substantive job description (the edge function rejects very
      // short ones) that folds in the Q2 title, the inferred role profile, and
      // the candidate's stated interests from Q10.
      const jobListingTrimmed = jobListing?.trim() || "";
      const jobListingIsUrl = /^https?:\/\//i.test(jobListingTrimmed);
      const jobListingIsBlank =
        !jobListingTrimmed ||
        /\b(no|not|none|nothing|skip|n\/a)\b/i.test(
          jobListingTrimmed.split(/\s+/).slice(0, 4).join(" ")
        );

      let jobDescription: string;
      if (jobListingIsUrl) {
        jobDescription = jobListingTrimmed;
      } else {
        const titlePart = jobListingIsBlank
          ? ""
          : `The candidate is applying for a ${jobListingTrimmed} role. `;
        const profilePart = targetProfile
          ? `This is a ${targetProfile.label} position, which typically values ${targetProfile.competencies
              .map((c: { label: string }) => c.label)
              .join(", ")}. `
          : "";
        jobDescription = `${titlePart}${profilePart}They are looking for: ${targetRole}.`;
      }

      const resumeText = [
        responsibilities && [
          `RESPONSIBILITIES & EXPERIENCE:\n${responsibilities}`,
          followUpData.employer_name_dates &&
            `Employer / Job Title / Dates: ${followUpData.employer_name_dates}`,
        ]
          .filter(Boolean)
          .join("\n"),
        achievements && `KEY ACCOMPLISHMENTS:\n${achievements}`,
        skills && `SKILLS:\n${skills}`,
        impact && `IMPACT & WHO I'VE HELPED:\n${impact}`,
        competencyAnswers.length > 0 &&
          `ADDITIONAL ROLE-RELEVANT EXPERIENCE:\n${competencyAnswers.join("\n")}`,
        additional && [
          `EDUCATION:\n${additional}`,
          followUpData.education_institution_dates &&
            `Institution / Dates: ${followUpData.education_institution_dates}`,
          followUpData.volunteer_org_dates &&
            `Volunteer Organization / Dates: ${followUpData.volunteer_org_dates}`,
        ]
          .filter(Boolean)
          .join("\n"),
        strengths && `PROFESSIONAL STRENGTHS:\n${strengths}`,
        workStyle && `PROBLEM-SOLVING APPROACH:\n${workStyle}`,
        interests && `TARGET ROLE:\n${interests}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const userPrompt = [
        `This is a first-time resume built from a guided interview. Apply these rules strictly:`,
        contact &&
          `0. The candidate provided the following contact information: "${contact}". Extract their phone number, email address, and LinkedIn URL (if present) and place them in the resume header.${candidateName ? ` Replace [Candidate Name] with "${candidateName}".` : ""}`,
        `1. Education section: Only list credentials the candidate explicitly claimed. Do not invent, inflate, or imply any degree, coursework, or training not directly stated. Use standard resume format (e.g. "GED" or "Some College Coursework"). Rewrite in professional language — do not copy the candidate's words verbatim.`,
        `2. After the Education section, add a blank line separator, then render "Professional Strengths", "Problem-Solving Approach", and "Target Role" as bold subheadings (not all-caps). Each should be its own section with the candidate's content rewritten in professional resume language.`,
        `3. Rewrite all content throughout the resume in professional resume language. No direct quotes, no first-person language, no filler words. Only claim what the candidate explicitly stated.`,
        `4. Lead with the candidate's strongest, most recruiter-appealing material — whatever it happens to be for this person (e.g. military service, real paid employment, a standout achievement, a relevant certification, or formal education). Order the sections so that the most impressive, relevant content appears first after the Professional Summary, and give it the most space. Weaker or less relevant background should be condensed or omitted rather than allowed to dilute the strongest story.`,
        targetProfile &&
          `5. This resume targets a ${targetProfile.label} role. Where the candidate's stated experience genuinely supports it, emphasize and surface the competencies most relevant to that role — but never fabricate or overstate.`,
      ]
        .filter(Boolean)
        .join("\n");

      // Generate resume HTML — skip verbatim education enforcement since the
      // source text is raw interview answers, not a polished resume
      const { resume_html } = await generateOptimizedResume({
        jobDescription,
        resumeText,
        missingKeywords: [],
        jobTitle: targetRole,
        companyName: "",
        userPrompt,
        skipVerbatimEducation: true,
      });

      // Save as a job application so it opens in the resume detail page.
      // Persist the Q2 job listing (when the user named a specific job) so the
      // cover letter flow can later tell whether to write a targeted or generic
      // letter — counselor_conversation isn't a reliable store for this.
      const app = await saveJobApplication({
        job_url: "first-resume",
        company_name: "My First Resume",
        job_title: targetRole,
        job_description_markdown: jobListingIsBlank ? "" : jobListingTrimmed,
        resume_html,
        generation_status: "complete",
        status: "complete",
      });

      toast.dismiss(toastId);
      toast.success("Your resume is ready!");
      navigate(`/applications/${app.id}`);
    } catch (e) {
      toast.dismiss(toastId);
      toast.error("Failed to generate resume. Please try again.");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageShell>
      <div className="space-y-8 py-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Let's create your first resume!</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            I'm your Employment Counselor. Let's discover the professional value in your experiences.
          </p>
        </div>

        {/* Employment Counselor Agent */}
        <EmploymentCounselorAgent onComplete={handleCounselorComplete} />

        {/* How It Works */}
        <Card className="border-border bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">How This Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              I'll ask you about your daily life, education, volunteer work, hobbies, and personal
              challenges. This isn't traditional resume interrogation—it's about discovering the
              professional skills you already have.
            </p>
            <p>
              We'll translate your lived experiences into the action-oriented language that hiring
              managers want to see: <span className="text-foreground font-medium">Coordinated, Managed, Collaborated, Spearheaded.</span>
            </p>
            <p>
              By the end, you'll have concrete evidence of your professional value—even if you've
              never been "formally employed."
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
