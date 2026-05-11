/**
 * Build a standardized download filename:
 *   firstname.lastname_doctype_companyname[_jobtitle].ext
 * Example: "john.smith_ats-resume_acme-corp_senior-engineer.docx"
 */
export function buildFileName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  docType: string,
  companyName: string | null | undefined,
  extension: string,
  jobTitle?: string | null
): string {
  const slug = (s: string) =>
    s.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").toLowerCase();
  const name = [firstName, lastName].filter(Boolean).join(".").toLowerCase() || "document";
  const doc = slug(docType);
  const company = slug(companyName || "company");
  const title = jobTitle ? `_${slug(jobTitle)}` : "";
  return `${name}_${doc}_${company}${title}.${extension}`;
}
