/**
 * inbound-email
 *
 * Receives inbound email webhooks from Resend and stores them in the
 * privacy_requests table for GDPR/CCPA compliance tracking.
 *
 * ── SETUP (one-time) ────────────────────────────────────────────────────────
 *
 * 1. In Resend dashboard → Domains, verify resuvibe.ai.
 *
 * 2. In Resend → Inbound, add a routing rule:
 *      Match:   To = privacy@resuvibe.ai
 *      Forward: https://<project-ref>.supabase.co/functions/v1/inbound-email
 *
 * 3. In Supabase dashboard → Edge Functions → inbound-email → Secrets, add:
 *      RESEND_WEBHOOK_SECRET = <value from Resend dashboard → Webhooks → Signing secret>
 *
 *    This function also needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY,
 *    which are injected automatically by Supabase.
 *
 * ── SWITCHING PROVIDERS ─────────────────────────────────────────────────────
 * If you change to Mailgun, replace parsePayload() with Mailgun's multipart
 * form fields (from, sender, subject, body-plain, body-html).
 * If you change to Postmark, their inbound JSON uses From, Subject, TextBody,
 * HtmlBody fields at the top level.
 * The rest of the function (auth check, classify, insert) stays identical.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ────────────────────────────────────────────────────────────────────

type RequestType = "erasure" | "access" | "portability" | "rectification" | "objection" | "other";

interface ParsedEmail {
  fromEmail: string;
  fromName: string | null;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse Resend inbound email webhook payload.
 * Resend POSTs JSON with the shape:
 *   { from, to, subject, text, html }
 * where `from` may be "Name <email>" or just "email".
 */
function parsePayload(body: Record<string, unknown>): ParsedEmail {
  const rawFrom = String(body.from ?? "");
  const nameMatch = rawFrom.match(/^(.+?)\s*<([^>]+)>$/);
  const fromEmail = nameMatch ? nameMatch[2].trim().toLowerCase() : rawFrom.toLowerCase();
  const fromName  = nameMatch ? nameMatch[1].trim() : null;

  return {
    fromEmail,
    fromName:  fromName || null,
    subject:   String(body.subject ?? "").trim(),
    bodyText:  body.text  ? String(body.text).slice(0, 100_000)  : null,
    bodyHtml:  body.html  ? String(body.html).slice(0, 200_000)  : null,
  };
}

/**
 * Classify the privacy request type from the subject and body text.
 * Returns the most specific matching type, falling back to 'other'.
 */
function classifyRequest(subject: string, bodyText: string | null): RequestType {
  const haystack = `${subject} ${bodyText ?? ""}`.toLowerCase();

  if (/\b(delet|eras|remov|right to be forgotten|forget me|gdpr.*delet)\b/.test(haystack)) {
    return "erasure";
  }
  if (/\b(portab|export|download.*data|transfer.*data)\b/.test(haystack)) {
    return "portability";
  }
  if (/\b(access|copy.*data|what.*data|see.*data|subject access|sar\b)\b/.test(haystack)) {
    return "access";
  }
  if (/\b(correct|rectif|inaccura|wrong.*data|update.*data)\b/.test(haystack)) {
    return "rectification";
  }
  if (/\b(object|opt.?out|stop process|withdraw consent|unsubscrib)\b/.test(haystack)) {
    return "objection";
  }
  return "other";
}

/**
 * Constant-time string comparison to prevent timing attacks on the secret check.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  // Verify the shared webhook secret
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("[inbound-email] RESEND_WEBHOOK_SECRET is not set");
    return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500 });
  }

  const providedSecret = req.headers.get("svix-secret")     // Resend uses Svix headers
    ?? req.headers.get("x-webhook-secret")                   // fallback for other providers
    ?? "";

  if (!safeEqual(providedSecret, webhookSecret)) {
    console.warn("[inbound-email] Rejected request: invalid webhook secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  // Resend wraps the email in a { type, data } envelope for webhook events.
  // If present, unwrap it; otherwise treat the top level as the email payload.
  const emailPayload = (body.type === "email.received" && body.data)
    ? (body.data as Record<string, unknown>)
    : body;

  // Parse and validate
  let email: ParsedEmail;
  try {
    email = parsePayload(emailPayload);
  } catch (err) {
    console.error("[inbound-email] Failed to parse payload:", err);
    return new Response(JSON.stringify({ error: "Malformed payload" }), { status: 400 });
  }

  if (!email.fromEmail || !email.fromEmail.includes("@")) {
    return new Response(JSON.stringify({ error: "Missing or invalid from address" }), { status: 400 });
  }

  const requestType = classifyRequest(email.subject, email.bodyText);

  // Insert into database using service role (bypasses RLS)
  const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
  const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const { error } = await admin
    .from("privacy_requests")
    .insert({
      from_email:   email.fromEmail,
      from_name:    email.fromName,
      subject:      email.subject || "(no subject)",
      body_text:    email.bodyText,
      body_html:    email.bodyHtml,
      request_type: requestType,
      status:       "new",
    });

  if (error) {
    console.error("[inbound-email] DB insert failed:", error.message);
    return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
  }

  console.log(
    `[inbound-email] Stored ${requestType} request from ${email.fromEmail}: "${email.subject}"`
  );

  // Return 200 so Resend does not retry the delivery
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
