/**
 * Dynamic CORS helper for Supabase edge functions.
 *
 * Returns an Access-Control-Allow-Origin that echoes the request origin when
 * it is an allowed origin, falling back to the production domain otherwise.
 * This keeps local dev and Lovable preview deployments working while blocking
 * arbitrary origins from receiving credentialed responses.
 */

const ALLOWED_ORIGINS = [
  "https://resuvibe.ai",
  "http://localhost:5173",
  "http://localhost:3000",
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Lovable preview deployments
  if (origin.endsWith(".lovable.app") || origin.endsWith(".lovableproject.com")) return true;
  return false;
}

export function makeCorsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && isAllowedOrigin(origin) ? origin : "https://resuvibe.ai";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}
