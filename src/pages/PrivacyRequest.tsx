import { useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CheckCircle } from "lucide-react";

const REQUEST_TYPES = [
  { value: "erasure",        label: "Right to erasure (delete my data)" },
  { value: "access",         label: "Right of access (copy of my data)" },
  { value: "portability",    label: "Right to data portability (export)" },
  { value: "rectification",  label: "Right to rectification (correct my data)" },
  { value: "objection",      label: "Right to object / withdraw consent" },
  { value: "other",          label: "Other privacy enquiry" },
] as const;

type RequestType = typeof REQUEST_TYPES[number]["value"];

function PrivacyRequestForm({ defaultEmail, defaultName }: { defaultEmail: string; defaultName: string }) {
  const [name,        setName]        = useState(defaultName);
  const [email,       setEmail]       = useState(defaultEmail);
  const [requestType, setRequestType] = useState<RequestType | "">("");
  const [message,     setMessage]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [submitted,   setSubmitted]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!requestType) {
      setError("Please select a request type.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Please describe your request (at least 10 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-privacy-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            name:        name.trim() || null,
            email:       email.trim(),
            requestType,
            message:     message.trim(),
            website:     "",   // honeypot — bots fill this; the field is hidden from humans
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Submission failed. Please try again.");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <CheckCircle className="h-10 w-10 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Request received</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          We have recorded your request and will acknowledge it within 72 hours.
          Requests are resolved within 30 days (GDPR) or 45 days (CCPA).
        </p>
        <p className="text-xs text-muted-foreground">
          We'll respond to <strong>{email}</strong>.
        </p>
        <Link to="/privacy" className="text-sm underline text-muted-foreground hover:text-foreground mt-2">
          Back to Privacy Policy
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Honeypot — visually hidden, not labelled, ignored by screen readers */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 0, height: 0, overflow: "hidden" }}>
        <input tabIndex={-1} name="website" defaultValue="" autoComplete="off" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="pr-name">Full name <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input
            id="pr-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pr-email">Email address <span className="text-destructive">*</span></Label>
          <Input
            id="pr-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pr-type">Request type <span className="text-destructive">*</span></Label>
        <Select value={requestType} onValueChange={(v) => setRequestType(v as RequestType)}>
          <SelectTrigger id="pr-type">
            <SelectValue placeholder="Select the nature of your request…" />
          </SelectTrigger>
          <SelectContent>
            {REQUEST_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pr-message">Details <span className="text-destructive">*</span></Label>
        <Textarea
          id="pr-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Please describe your request in as much detail as possible. For erasure requests you don't need to provide a reason, but any context helps us process it faster."
          required
        />
        <p className="text-xs text-muted-foreground">{message.length} / 10,000 characters</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-4 pt-1">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit request"}
        </Button>
        <p className="text-xs text-muted-foreground">
          We'll respond within 72 hours.
        </p>
      </div>

      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        By submitting this form your request will be stored securely in our database and
        reviewed by our team. Read our{" "}
        <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>{" "}
        for full details of your rights.
      </p>
    </form>
  );
}

export default function PrivacyRequest() {
  const { user } = useAuth();

  const defaultEmail = user?.email ?? "";
  const defaultName  = "";

  const inner = (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Privacy Request</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use this form to exercise any of your rights under GDPR, CCPA, or other applicable
          privacy law — including erasure, access, portability, rectification, or objection.
        </p>
      </div>
      <PrivacyRequestForm defaultEmail={defaultEmail} defaultName={defaultName} />
      <p className="text-sm text-muted-foreground pt-4 border-t border-border">
        <strong>Email:</strong>{" "}
        <a href="mailto:privacy@resuvibe.ai" className="underline hover:text-foreground">privacy@resuvibe.ai</a>
      </p>
    </div>
  );


  if (user) {
    return <PageShell>{inner}</PageShell>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-sm font-semibold text-foreground hover:opacity-80">
          ResuVibe
        </Link>
        <span className="text-muted-foreground/40 text-xs">|</span>
        <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground">
          Privacy Policy
        </Link>
      </div>
      {inner}
    </div>
  );
}
