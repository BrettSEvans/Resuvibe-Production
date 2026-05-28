import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";

const EFFECTIVE_DATE = "28 May 2026";
const CONTACT_EMAIL = "privacy@resuvibe.ai";

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-base font-semibold text-foreground mt-8 mb-2 scroll-mt-20">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground mt-4 mb-1">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-2">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-2 pl-2">{children}</ul>;
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="py-1.5 pr-4 text-xs font-medium text-foreground align-top w-1/3">{label}</td>
      <td className="py-1.5 text-xs text-muted-foreground">{value}</td>
    </tr>
  );
}

function content() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mt-1">Effective date: {EFFECTIVE_DATE}</p>
      </div>

      {/* Quick-reference identity table */}
      <div className="rounded-md border border-border/60 overflow-hidden mb-6">
        <table className="w-full">
          <tbody>
            <TableRow label="Data controller" value="ResuVibe.ai" />
            <TableRow label="Contact" value={CONTACT_EMAIL} />
            <TableRow label="Service" value="AI-powered resume, cover letter and career document generation" />
            <TableRow label="Jurisdiction" value="GDPR (EU/EEA), UK GDPR, CCPA (California), PIPEDA (Canada)" />
          </tbody>
        </table>
      </div>

      <P>
        This Privacy Policy explains what personal data ResuVibe.ai ("ResuVibe", "we", "us") collects, why we collect it,
        the legal basis for each processing activity, who we share it with, and the rights you have over your data.
        It applies to all visitors and registered users of <strong>resuvibe.ai</strong>.
      </P>

      {/* 1 */}
      <H2 id="information-we-collect">1. Information We Collect</H2>

      <H3>1.1 Account and identity data</H3>
      <P>When you register, we collect:</P>
      <UL>
        <li><strong>Email address</strong> — used for authentication and service communications.</li>
        <li><strong>Display name and avatar URL</strong> — populated from OAuth metadata if you sign in via a third-party provider (e.g. Google); otherwise you can set these manually.</li>
        <li><strong>First name and last name</strong> — optional; provided on your Profile page to personalise generated documents.</li>
      </UL>

      <H3>1.2 Career and profile data</H3>
      <P>You voluntarily provide this to enable AI generation:</P>
      <UL>
        <li><strong>Resume text</strong> — the full text of your current CV/résumé, pasted or extracted from a PDF you upload.</li>
        <li><strong>Master cover letter</strong> — an optional reusable template you write.</li>
        <li><strong>Years of experience, key skills, target industries, preferred writing tone</strong> — selections made on your Profile page.</li>
      </UL>

      <H3>1.3 Job application data</H3>
      <P>For each application you create:</P>
      <UL>
        <li><strong>Job posting URL</strong> — the URL you supply; we scrape the content via a third-party service (Firecrawl) on your behalf.</li>
        <li><strong>Job description text</strong> — extracted from the URL or pasted directly.</li>
        <li><strong>Company name, company URL, job title</strong>.</li>
        <li><strong>Company branding and research data</strong> — retrieved from the company website via Firecrawl and structured by AI: competitors, customers, products, and visual branding elements.</li>
        <li><strong>AI-generated documents</strong> — tailored résumés (HTML), cover letters, executive dashboards, roadmaps, RAID logs, architecture diagrams, executive reports, and other generated materials, stored with full revision history so you can view and restore previous versions.</li>
        <li><strong>Chat history</strong> — conversation turns between you and the AI assistant within an application.</li>
        <li><strong>Pipeline status</strong> — the stage of the hiring process you assign to each application.</li>
      </UL>

      <H3>1.4 Usage and operational data</H3>
      <UL>
        <li><strong>Generation usage records</strong> — a timestamped count of AI generation requests per user, used solely to enforce per-user rate limits (currently 30 scrapes per hour).</li>
        <li><strong>Asset download signals</strong> — when you download a generated document we record the asset type, job title, industry, and a hash of the HTML content. No personally identifying information is recorded; this data is used in aggregate to improve AI output quality.</li>
        <li><strong>Last sign-in timestamp</strong> — recorded in your profile to support inactivity logout behaviour.</li>
        <li><strong>Subscription tier and status</strong> — your current plan (free at launch) and its status.</li>
      </UL>

      <H3>1.5 Marketing attribution data (UTM)</H3>
      <P>
        If you arrive at the sign-up page via a URL containing UTM parameters (e.g. from an advertisement or affiliate link),
        we record <code className="font-mono text-xs bg-muted px-1 rounded">utm_campaign</code>,{" "}
        <code className="font-mono text-xs bg-muted px-1 rounded">utm_source</code>, and{" "}
        <code className="font-mono text-xs bg-muted px-1 rounded">utm_medium</code> in your profile at the point of account creation.
        These values help us understand which marketing channels are effective. They are not shared with advertisers or ad networks.
      </P>

      <H3>1.6 Technical session data</H3>
      <P>
        Authentication is handled by Supabase Auth, which issues a JWT (JSON Web Token) stored in your browser's local storage by the Supabase client SDK.
        This token is used to authenticate every API request. Supabase may retain authentication event logs (sign-in, sign-out, token refresh)
        for security and fraud-prevention purposes; see Supabase's own privacy policy for details.
      </P>

      <H3>1.7 Data we do NOT collect</H3>
      <UL>
        <li>We do not run any web analytics (no Google Analytics, Mixpanel, Segment, or equivalent).</li>
        <li>We do not collect IP addresses directly; IP addresses may appear in Supabase server logs as part of infrastructure logging.</li>
        <li>We do not use browser fingerprinting.</li>
        <li>We do not collect payment card data; ResuVibe is currently free and has no payment flow.</li>
        <li>We do not collect precise geolocation data.</li>
      </UL>

      {/* 2 */}
      <H2 id="legal-bases">2. Legal Bases for Processing (GDPR)</H2>
      <P>
        For users in the EU, EEA, and UK we process personal data only where we have a lawful basis under Article 6 of the GDPR.
        The table below maps each processing activity to its legal basis.
      </P>
      <div className="rounded-md border border-border/60 overflow-x-auto mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="text-left py-2 px-3 font-medium text-foreground">Processing activity</th>
              <th className="text-left py-2 px-3 font-medium text-foreground">Legal basis</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Creating and managing your account", "Art. 6(1)(b) — performance of a contract"],
              ["Generating AI-powered career documents", "Art. 6(1)(b) — performance of a contract"],
              ["Storing your profile, resume, and job application data", "Art. 6(1)(b) — performance of a contract"],
              ["Sending transactional emails (e.g. password reset)", "Art. 6(1)(b) — performance of a contract"],
              ["Enforcing rate limits (generation_usage records)", "Art. 6(1)(f) — legitimate interests (preventing abuse and ensuring fair access)"],
              ["Recording asset download signals for quality improvement", "Art. 6(1)(f) — legitimate interests (improving service quality; data is anonymised at aggregate level)"],
              ["Capturing UTM marketing attribution at sign-up", "Art. 6(1)(f) — legitimate interests (understanding acquisition channels)"],
              ["Security monitoring and fraud prevention", "Art. 6(1)(f) — legitimate interests (protecting users and the service)"],
              ["Displaying personalised advertisements (Google AdSense)", "Art. 6(1)(a) — consent (withheld until you accept via the cookie banner)"],
              ["Complying with legal obligations", "Art. 6(1)(c) — legal obligation"],
            ].map(([activity, basis]) => (
              <tr key={activity} className="border-b border-border/40 last:border-0">
                <td className="py-1.5 px-3 text-muted-foreground align-top">{activity}</td>
                <td className="py-1.5 px-3 text-muted-foreground align-top">{basis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        Where we rely on legitimate interests (Art. 6(1)(f)), we have assessed that our interests do not override your rights and freedoms.
        You may object to legitimate-interest processing at any time — see Section 8.
      </P>
      <P>
        Resume and career documents you provide may incidentally contain sensitive data (health information, religious beliefs, etc.) within the meaning of GDPR Article 9.
        You are submitting this data voluntarily and explicitly for the purpose of generating career materials, which constitutes explicit consent under Art. 9(2)(a).
        We do not use such data for any purpose other than generating the documents you request.
      </P>

      {/* 3 */}
      <H2 id="how-we-use">3. How We Use Your Information</H2>
      <UL>
        <li><strong>Provide the service</strong> — generate, store, and display tailored resumes, cover letters, and all other career documents.</li>
        <li><strong>Personalise output</strong> — send your resume text, profile data, and the job description to the Google Gemini API to produce contextually relevant documents.</li>
        <li><strong>Scrape job listings</strong> — transmit the job URL you provide to Firecrawl to extract structured job description content on your behalf.</li>
        <li><strong>Research company information</strong> — transmit the company URL you provide to Firecrawl to retrieve branding and company context.</li>
        <li><strong>Rate limiting</strong> — maintain per-user request counts to prevent abuse and ensure fair resource allocation.</li>
        <li><strong>Improve AI quality</strong> — use aggregate, anonymised download signal data to identify which generated document patterns receive user approval.</li>
        <li><strong>Service communications</strong> — send essential transactional emails (password resets, email verification). We do not send marketing emails without separate opt-in.</li>
        <li><strong>Advertising</strong> — if you have given consent, display Google AdSense advertisements to fund the free service.</li>
        <li><strong>Security</strong> — detect and respond to security threats, enforce rate limits, and investigate suspected fraud or abuse.</li>
        <li><strong>Legal compliance</strong> — respond to lawful requests from competent authorities and fulfil statutory record-keeping obligations.</li>
      </UL>
      <P>
        <strong>We do not use your data to train AI models.</strong> Prompts sent to the Google Gemini API are used solely to generate the document you requested.
        Please review Google's data processing terms to understand how Google handles API inputs.
      </P>
      <P>
        <strong>We do not sell your personal data</strong> and have not done so in the preceding 12 months.
      </P>

      {/* 4 */}
      <H2 id="sharing">4. Sharing and Disclosure</H2>
      <P>We share your data only in the following circumstances:</P>
      <UL>
        <li><strong>Service providers acting as processors</strong> — see Section 5 for the full list. Each processor is bound by data processing agreements and is authorised only to process data as we instruct.</li>
        <li><strong>Legal requirements</strong> — if required by law, court order, or regulatory authority, we may disclose your data to the extent necessary to comply.</li>
        <li><strong>Protection of rights</strong> — we may disclose data where necessary to prevent fraud, enforce our terms, or protect the safety of users or the public.</li>
        <li><strong>Business transfers</strong> — if ResuVibe is acquired, merged, or its assets transferred, your data may be transferred as part of that transaction. We will notify you via email or in-app notice before any such transfer and before your data becomes subject to a different privacy policy.</li>
      </UL>
      <P>We do not share your resume text, cover letters, or any generated career documents with any third party other than the AI API used to produce them.</P>

      {/* 5 */}
      <H2 id="processors">5. Third-Party Service Providers</H2>
      <div className="rounded-md border border-border/60 overflow-x-auto mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="text-left py-2 px-3 font-medium text-foreground">Provider</th>
              <th className="text-left py-2 px-3 font-medium text-foreground">Role</th>
              <th className="text-left py-2 px-3 font-medium text-foreground">Data transferred</th>
              <th className="text-left py-2 px-3 font-medium text-foreground">Location</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Supabase, Inc.",
                "Database, authentication, and serverless edge function hosting",
                "All user and application data stored on the platform",
                "United States (AWS us-east-1 by default). Standard Contractual Clauses apply for EEA/UK transfers.",
              ],
              [
                "Google LLC — Gemini API",
                "AI text generation",
                "Your resume text, job description, and any other profile context included in generation prompts",
                "United States. Google's Data Processing Addendum and SCCs apply.",
              ],
              [
                "Firecrawl",
                "Web scraping — retrieves structured content from URLs you provide",
                "Job posting URLs and company website URLs you supply",
                "Subject to Firecrawl's privacy policy. Only URLs are transmitted; your personal data is not sent.",
              ],
              [
                "Google LLC — AdSense / Ad Manager",
                "Advertising delivery",
                "Browsing data, cookies, and device identifiers collected by Google's ad scripts",
                "United States. Only active after you explicitly accept the cookie consent banner.",
              ],
            ].map(([provider, role, data, location]) => (
              <tr key={provider} className="border-b border-border/40 last:border-0">
                <td className="py-1.5 px-3 text-muted-foreground align-top font-medium">{provider}</td>
                <td className="py-1.5 px-3 text-muted-foreground align-top">{role}</td>
                <td className="py-1.5 px-3 text-muted-foreground align-top">{data}</td>
                <td className="py-1.5 px-3 text-muted-foreground align-top">{location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        All font files (DM Sans, DM Serif Display) are self-hosted and bundled with the application — no requests are made to Google Fonts or any other external font CDN.
      </P>

      {/* 6 */}
      <H2 id="cookies">6. Cookies and Local Storage</H2>

      <H3>6.1 Authentication session (essential)</H3>
      <P>
        Supabase Auth stores your authentication JWT in <code className="font-mono text-xs bg-muted px-1 rounded">localStorage</code> under the key{" "}
        <code className="font-mono text-xs bg-muted px-1 rounded">sb-&lt;project-ref&gt;-auth-token</code>.
        This is strictly necessary to keep you signed in and cannot be opted out of while you are using the service.
        It is removed when you sign out.
      </P>

      <H3>6.2 Cookie consent preference (functional)</H3>
      <P>
        When you interact with the cookie consent banner, your choice is stored in{" "}
        <code className="font-mono text-xs bg-muted px-1 rounded">localStorage</code> under the key{" "}
        <code className="font-mono text-xs bg-muted px-1 rounded">cookie_consent</code> with the value{" "}
        <code className="font-mono text-xs bg-muted px-1 rounded">"accepted"</code> or{" "}
        <code className="font-mono text-xs bg-muted px-1 rounded">"declined"</code>.
        This is a functional preference and does not leave your device.
      </P>

      <H3>6.3 Advertising cookies (non-essential, consent required)</H3>
      <P>
        Google AdSense and Google Ad Manager set third-party cookies for the purpose of serving and measuring personalised advertisements.
        <strong> These scripts are not loaded, and no advertising cookies are set, until you explicitly accept via the cookie consent banner.</strong>
      </P>
      <P>
        If you accept and later wish to withdraw consent: clear your browser's local storage (or delete the{" "}
        <code className="font-mono text-xs bg-muted px-1 rounded">cookie_consent</code> key) and reload the page.
        The consent banner will reappear and the AdSense script will not be reloaded until you accept again.
      </P>
      <P>
        You can also opt out of personalised Google advertising at any time at{" "}
        <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          adssettings.google.com
        </a>{" "}
        or via the{" "}
        <a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          NAI opt-out tool
        </a>.
      </P>

      <H3>6.4 No other tracking</H3>
      <P>
        We do not use analytics cookies, session-recording tools, heat-mapping tools, A/B testing scripts, or any other non-essential tracking technology.
        The application makes zero external network requests on behalf of unauthenticated visitors (other than those you explicitly trigger, such as clicking a sign-up link).
      </P>

      {/* 7 */}
      <H2 id="retention">7. Data Retention</H2>
      <div className="rounded-md border border-border/60 overflow-x-auto mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="text-left py-2 px-3 font-medium text-foreground">Data category</th>
              <th className="text-left py-2 px-3 font-medium text-foreground">Retention period</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Profile and account data", "Retained while your account is active; deleted immediately and permanently when you delete your account."],
              ["Job applications and all generated documents", "Retained while your account is active. When you delete an application it is soft-deleted and permanently purged after 30 days. All applications are immediately and permanently purged when you delete your account."],
              ["Revision history (previous versions of documents)", "Retained alongside the parent application, subject to the same rules above."],
              ["Generation usage records (rate limiting)", "Retained while your account is active; deleted with your account."],
              ["Asset download signals (anonymised quality data)", "Retained in aggregated, non-identifiable form. The application_id link is severed when the application is purged."],
              ["Marketing attribution (UTM fields in profile)", "Retained as part of your profile while your account is active; deleted with your account."],
              ["Supabase Auth logs", "Managed by Supabase per their data retention policy. We do not control these logs directly."],
              ["Advertising cookies (Google)", "Governed by Google's retention policies. See Google's Privacy Policy."],
            ].map(([category, period]) => (
              <tr key={category} className="border-b border-border/40 last:border-0">
                <td className="py-1.5 px-3 text-muted-foreground align-top font-medium">{category}</td>
                <td className="py-1.5 px-3 text-muted-foreground align-top">{period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        <strong>Account deletion is irreversible.</strong> When you trigger account deletion from Profile → Danger Zone, a server-side process immediately and permanently hard-deletes your profile,
        all job applications, all generated documents and their revisions, all usage records, and your authentication record.
        No backup copies are retained after deletion completes. This satisfies your right to erasure under GDPR Article 17 and the CCPA right to deletion.
      </P>

      {/* 8 */}
      <H2 id="transfers">8. International Data Transfers</H2>
      <P>
        ResuVibe operates from and stores data in the United States via Supabase (hosted on AWS us-east-1).
        If you are located in the EU, EEA, or UK, this constitutes a transfer of personal data to a third country.
      </P>
      <P>
        We rely on the following transfer mechanisms to ensure an adequate level of protection:
      </P>
      <UL>
        <li><strong>Supabase</strong> — Standard Contractual Clauses (SCCs) as adopted by the European Commission (2021), incorporated into Supabase's Data Processing Agreement.</li>
        <li><strong>Google LLC (Gemini API, AdSense)</strong> — Google's Data Processing Addendum incorporating SCCs. Google also relies on the EU-U.S. Data Privacy Framework where applicable.</li>
        <li><strong>Firecrawl</strong> — governed by their Data Processing Agreement. Only URLs are transmitted; no personal data subjects' data is transmitted beyond the job/company URLs you provide.</li>
      </UL>
      <P>
        You may request a copy of the applicable transfer safeguards by contacting us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a>.
      </P>

      {/* 9 */}
      <H2 id="security">9. Security</H2>
      <UL>
        <li><strong>Encryption in transit</strong> — all traffic is served over TLS 1.2+.</li>
        <li><strong>Row Level Security (RLS)</strong> — every database table has RLS policies enforced at the PostgreSQL level, ensuring users can only read and write their own data even if application-level checks are bypassed.</li>
        <li><strong>Privileged operations isolated to edge functions</strong> — account deletion, data purges, and any operation requiring the service-role key execute exclusively in server-side Supabase Edge Functions. The service-role key is never exposed to the browser.</li>
        <li><strong>CORS restriction</strong> — edge functions only accept requests from the production domain, localhost development ports, and authorised Lovable preview domains.</li>
        <li><strong>Content Security Policy</strong> — a strict CSP prevents execution of unauthorised scripts and restricts external connections to Supabase endpoints.</li>
        <li><strong>AI output sanitisation</strong> — all AI-generated HTML is sanitised with DOMPurify before storage or DOM rendering to prevent cross-site scripting.</li>
        <li><strong>Rate limiting</strong> — per-user rate limits on AI generation and scraping endpoints prevent abuse.</li>
        <li><strong>Session invalidation on sign-out</strong> — all cached query data and background generation state are cleared from the browser on sign-out.</li>
        <li><strong>Inactivity logout</strong> — sessions are automatically invalidated after a period of inactivity.</li>
      </UL>
      <P>
        No system is completely secure. If you discover a security vulnerability, please disclose it responsibly to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a>.
      </P>

      {/* 10 */}
      <H2 id="your-rights">10. Your Rights</H2>

      <H3>Rights under GDPR (EU / EEA / UK)</H3>
      <P>If you are located in the EU, EEA, or UK you have the following rights under the GDPR:</P>
      <UL>
        <li>
          <strong>Right of access (Art. 15)</strong> — request a copy of the personal data we hold about you and information about how we process it.
        </li>
        <li>
          <strong>Right to rectification (Art. 16)</strong> — correct inaccurate or incomplete personal data. Most profile data can be corrected directly in the app on the Profile page.
        </li>
        <li>
          <strong>Right to erasure (Art. 17)</strong> — request deletion of your personal data. You can exercise this right immediately and completely by using the Delete Account function in Profile → Danger Zone, or by emailing us.
        </li>
        <li>
          <strong>Right to restriction of processing (Art. 18)</strong> — request that we restrict processing of your data in certain circumstances (e.g. while a rectification request is assessed).
        </li>
        <li>
          <strong>Right to data portability (Art. 20)</strong> — receive your personal data in a structured, commonly used, machine-readable format and transmit it to another controller. Email us to request a JSON export of your profile and application data.
        </li>
        <li>
          <strong>Right to object (Art. 21)</strong> — object to processing based on legitimate interests. We will cease such processing unless we can demonstrate compelling legitimate grounds that override your interests.
        </li>
        <li>
          <strong>Rights related to automated decision-making (Art. 22)</strong> — AI-generated documents are produced by automated processes, but these outputs affect only the career materials we create for you and do not produce legal or similarly significant effects. You retain full control: you can edit, discard, or regenerate any output at any time.
        </li>
        <li>
          <strong>Right to withdraw consent</strong> — where processing is based on consent (advertising), you may withdraw consent at any time without affecting the lawfulness of prior processing (see Section 6.3).
        </li>
      </UL>
      <P>
        To exercise any of these rights, use our{" "}
        <Link to="/privacy-request" className="underline hover:text-foreground">Privacy Request form</Link>{" "}
        or email <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a>.
        We will respond within <strong>30 days</strong>. In exceptional circumstances we may extend this by a further 60 days and will notify you.
        We will not discriminate against you for exercising your rights.
      </P>
      <P>
        If you are not satisfied with our response, you have the right to lodge a complaint with your national data protection authority.
        A list of EU supervisory authorities is available at{" "}
        <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          edpb.europa.eu
        </a>. UK residents may contact the{" "}
        <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          Information Commissioner's Office (ICO)
        </a>.
      </P>

      <H3>Rights under the CCPA / CPRA (California)</H3>
      <P>If you are a California resident, you have the following rights under the CCPA as amended by the CPRA:</P>
      <UL>
        <li><strong>Right to know</strong> — request disclosure of the categories and specific pieces of personal information we have collected about you in the preceding 12 months, the categories of sources, our business purposes for collection, and the categories of third parties with whom we share it.</li>
        <li><strong>Right to delete</strong> — request deletion of personal information we have collected, subject to limited exceptions. Use Delete Account in the app or email us.</li>
        <li><strong>Right to correct</strong> — request correction of inaccurate personal information.</li>
        <li><strong>Right to opt out of sale or sharing</strong> — we do not sell personal information and have not done so in the preceding 12 months. We do not share personal information for cross-context behavioural advertising without consent.</li>
        <li><strong>Right to limit use of sensitive personal information</strong> — we use sensitive personal information (such as health data that may appear in a resume) only to perform the services you request; we do not use it for any secondary purpose.</li>
        <li><strong>Right to non-discrimination</strong> — exercising your rights will not result in any denial of service, different prices, or diminished quality.</li>
      </UL>
      <P>
        To submit a verifiable consumer request, use our{" "}
        <Link to="/privacy-request" className="underline hover:text-foreground">Privacy Request form</Link>{" "}
        or email <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a> from the email address associated with your account.
        We will respond within <strong>45 days</strong>, with one 45-day extension if necessary.
      </P>

      <H3>Rights under PIPEDA (Canada)</H3>
      <P>
        If you are a Canadian resident, you have the right to access the personal information we hold about you and to challenge its accuracy.
        To make a request, use our{" "}
        <Link to="/privacy-request" className="underline hover:text-foreground">Privacy Request form</Link>{" "}
        or email <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a>.
        If you are not satisfied with our response you may contact the{" "}
        <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          Office of the Privacy Commissioner of Canada
        </a>.
      </P>

      {/* 11 */}
      <H2 id="children">11. Children's Privacy</H2>
      <P>
        ResuVibe is not directed at children. We do not knowingly collect personal data from anyone under the age of 16 (or the applicable minimum age in your jurisdiction).
        If you believe we have inadvertently collected data from a child, please contact us immediately at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-foreground">{CONTACT_EMAIL}</a> and we will delete it promptly.
      </P>

      {/* 12 */}
      <H2 id="changes">12. Changes to This Policy</H2>
      <P>
        We may update this Privacy Policy from time to time. If we make material changes — particularly any that affect your rights, the purposes for which we process your data, or the third parties we share it with — we will notify you via an in-app notice at least 14 days before the changes take effect, and update the effective date at the top of this page.
        Your continued use of ResuVibe after the effective date of a revised policy constitutes acceptance of the changes.
      </P>
      <P>
        For non-material changes (e.g. typographical corrections, clarifications that do not alter substance), we will update the effective date without in-app notice.
      </P>

      {/* 13 */}
      <H2 id="contact">13. Contact</H2>
      <P>
        For all privacy-related enquiries, data subject access requests, or complaints:
      </P>
      <P>
        <Link to="/privacy-request" className="underline hover:text-foreground">Privacy Request form</Link>
      </P>

      <P>
        We aim to acknowledge all requests within <strong>72 hours</strong> and resolve them within 30 days (GDPR) or 45 days (CCPA).
      </P>

      <p className="text-xs text-muted-foreground border-t border-border pt-6 mt-8">
        Effective date: {EFFECTIVE_DATE}. ResuVibe.ai.
      </p>
    </div>
  );
}

export default function Privacy() {
  const { user } = useAuth();

  if (user) {
    return <PageShell>{content()}</PageShell>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-sm font-semibold text-foreground hover:opacity-80">
          ResuVibe
        </Link>
        <span className="text-muted-foreground/40 text-xs">|</span>
        <span className="text-xs text-muted-foreground">Privacy Policy</span>
      </div>
      {content()}
    </div>
  );
}
