import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground space-y-2">{children}</div>
    </section>
  );
}

export default function Privacy() {
  const { user } = useAuth();
  const lastUpdated = "28 May 2026";

  const content = (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mt-1">Last updated: {lastUpdated}</p>
      </div>

      <Section title="Who we are">
        <p>
          ResuVibe.ai ("ResuVibe", "we", "us") is an AI-powered career tools platform. Our registered
          business contact is available at{" "}
          <a href="mailto:privacy@resuvibe.ai" className="underline hover:text-foreground">
            privacy@resuvibe.ai
          </a>
          .
        </p>
      </Section>

      <Section title="What data we collect">
        <p>We collect the following categories of personal data:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Account data</strong> — email address, name (optional), years of experience,
            preferred tone, and key skills you enter on your Profile page.
          </li>
          <li>
            <strong>Resume and career content</strong> — resume text, cover letters, and other
            materials you paste or upload. These are used exclusively to generate personalised
            documents for you.
          </li>
          <li>
            <strong>Job application records</strong> — job titles, companies, URLs, and
            AI-generated outputs (resumes, dashboards, roadmaps, etc.) tied to each application
            you track.
          </li>
          <li>
            <strong>Usage data</strong> — number of AI generation requests per hour, used solely
            for rate-limiting.
          </li>
          <li>
            <strong>Authentication data</strong> — managed by Supabase Auth. We store a hashed
            password; we never see your plain-text password.
          </li>
        </ul>
      </Section>

      <Section title="Advertising and cookies">
        <p>
          ResuVibe displays ads through <strong>Google AdSense</strong> and (optionally)
          Google Ad Manager rewarded video to fund the free service. Google AdSense sets
          advertising cookies and may use your browsing data to serve personalised ads.
        </p>
        <p>
          <strong>We do not load any ad scripts until you explicitly accept cookies</strong> via
          the consent banner. If you decline, no ad cookies are set and no ad scripts are
          executed.
        </p>
        <p>
          You can withdraw consent at any time by clearing your browser's localStorage (key:{" "}
          <code className="font-mono bg-muted px-1 rounded text-xs">cookie_consent</code>) or by
          using your browser's cookie controls. You can also opt out of personalised Google ads
          at{" "}
          <a
            href="https://adssettings.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            adssettings.google.com
          </a>
          .
        </p>
      </Section>

      <Section title="How we use your data">
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>To generate AI-powered career documents on your behalf.</li>
          <li>To save and retrieve your applications and profile across sessions.</li>
          <li>To enforce per-user rate limits on AI generation calls.</li>
          <li>To comply with legal obligations.</li>
        </ul>
        <p>
          We do not sell your personal data. We do not use your resume or career content to
          train AI models.
        </p>
      </Section>

      <Section title="Data retention">
        <p>
          <strong>Active accounts:</strong> your data is retained for as long as your account
          exists.
        </p>
        <p>
          <strong>Soft-deleted applications:</strong> when you delete a job application inside the
          app, it is soft-deleted and permanently purged after <strong>30 days</strong>.
        </p>
        <p>
          <strong>Account deletion:</strong> when you delete your account (Profile → Danger Zone),
          all personal data — profile, applications, resumes, generated assets, and your
          authentication record — is hard-deleted immediately and cannot be recovered. This
          satisfies your right to erasure under GDPR Article 17 and the CCPA right to deletion.
        </p>
      </Section>

      <Section title="Your rights (GDPR / CCPA)">
        <p>Depending on your jurisdiction you have the right to:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate data.</li>
          <li>Erasure ("right to be forgotten") — use the Delete Account button or email us.</li>
          <li>Data portability — email us to request a JSON export of your data.</li>
          <li>Object to or restrict processing.</li>
          <li>Withdraw consent for advertising cookies at any time.</li>
        </ul>
        <p>
          To exercise any right, email{" "}
          <a href="mailto:privacy@resuvibe.ai" className="underline hover:text-foreground">
            privacy@resuvibe.ai
          </a>
          . We will respond within 30 days.
        </p>
      </Section>

      <Section title="Third-party processors">
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>
            <strong>Supabase</strong> — database, authentication, and edge function hosting (EU /
            US data centres configurable).
          </li>
          <li>
            <strong>Google Gemini API</strong> — AI text generation. Prompts include your resume
            and job description text. Subject to Google's data processing terms.
          </li>
          <li>
            <strong>Firecrawl</strong> — used to scrape job listing URLs you provide. Only the URL
            you supply is transmitted.
          </li>
          <li>
            <strong>Google AdSense / Ad Manager</strong> — ad delivery (only after consent).
          </li>
        </ul>
      </Section>

      <Section title="Security">
        <p>
          All data is transmitted over TLS. Database access is protected by Supabase Row Level
          Security policies ensuring users can only read and write their own data. Privileged
          operations (account deletion, data purge) require either a valid user JWT or an
          internal service secret and are performed via server-side Edge Functions.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this policy. Material changes will be communicated via an in-app notice.
          Continued use of ResuVibe after the effective date constitutes acceptance.
        </p>
      </Section>

      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        Questions? Email{" "}
        <a href="mailto:privacy@resuvibe.ai" className="underline hover:text-foreground">
          privacy@resuvibe.ai
        </a>
        .
      </p>
    </div>
  );

  if (user) {
    return <PageShell>{content}</PageShell>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-sm font-semibold text-foreground hover:opacity-80">
          ResuVibe
        </Link>
      </div>
      {content}
    </div>
  );
}
