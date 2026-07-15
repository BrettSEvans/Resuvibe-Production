import { supabase } from '@/integrations/supabase/client';
import type { ExtractedKeyword } from '@/lib/keywordMatcher';
import { enforceVerbatimEducation, extractResumeEducation } from '@/lib/resumeEducationEnforcer';

export async function generateOptimizedResume({
  jobDescription,
  resumeText,
  missingKeywords,
  userPrompt,
  companyName,
  jobTitle,
  sourceResumeId,
  skipVerbatimEducation,
}: {
  jobDescription: string;
  resumeText: string;
  missingKeywords: ExtractedKeyword[];
  userPrompt?: string;
  companyName?: string;
  jobTitle?: string;
  sourceResumeId?: string;
  skipVerbatimEducation?: boolean;
}): Promise<{ resume_html: string; keywords_injected: string[] }> {
  const verbatimEducation = extractResumeEducation(resumeText) ?? '';
  const { data, error } = await supabase.functions.invoke('generate-resume', {
    body: { jobDescription, resumeText, missingKeywords, userPrompt, companyName, jobTitle, verbatimEducation },
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Resume generation failed');
  return {
    resume_html: skipVerbatimEducation
      ? data.resume_html
      : enforceVerbatimEducation(data.resume_html, resumeText),
    keywords_injected: data.keywords_injected,
  };
}

