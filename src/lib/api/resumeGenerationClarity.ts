import { supabase } from '@/integrations/supabase/client';
import { enforceVerbatimEducation, extractResumeEducation } from '@/lib/resumeEducationEnforcer';

export async function generateClarityResume({
  jobDescription,
  resumeText,
  companyName,
  jobTitle,
}: {
  jobDescription: string;
  resumeText: string;
  companyName?: string;
  jobTitle?: string;
}): Promise<{ resume_html: string }> {
  const verbatimEducation = extractResumeEducation(resumeText) ?? '';
  const { data, error } = await supabase.functions.invoke('generate-resume-clarity', {
    body: { jobDescription, resumeText, companyName, jobTitle, verbatimEducation },
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Clarity resume generation failed');
  return { resume_html: enforceVerbatimEducation(data.resume_html, resumeText) };
}
