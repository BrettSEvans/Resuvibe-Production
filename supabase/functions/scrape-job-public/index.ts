import { makeCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = makeCorsHeaders(req.headers.get("Origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let formattedUrl = url.trim();
    if (formattedUrl.length > 2000) {
      return new Response(
        JSON.stringify({ success: false, error: "URL too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      // eslint-disable-next-line no-new
      new URL(formattedUrl);
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const scrape = async (waitFor: number) => {
      const r = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ["markdown"],
          onlyMainContent: true,
          waitFor,
          maxAge: 0,
        }),
      });
      return { r, body: await r.json() };
    };

    let { r: response, body: data } = await scrape(5000);

    if (!response.ok) {
      const errMsg = data.error || "Failed to scrape";
      const isBlocked = typeof errMsg === "string" && errMsg.includes("do not support this site");
      return new Response(
        JSON.stringify({ success: false, error: isBlocked ? "BLOCKED_SITE" : errMsg, blocked: isBlocked }),
        { status: isBlocked ? 403 : response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let markdown: string = data.data?.markdown || data.markdown || "";
    let title: string = data.data?.metadata?.title || data.metadata?.title || "";

    // Heuristic: JS-rendered pages (Workday, Greenhouse, Lever, etc.) often
    // return a near-empty "Loading" shell on the first pass. Retry with a
    // longer wait so client-side content has time to render.
    const looksEmpty =
      markdown.trim().length < 400 ||
      /^\s*loading\s*$/im.test(markdown) ||
      markdown.toLowerCase().includes("enable javascript");

    if (looksEmpty) {
      const retry = await scrape(12000);
      if (retry.r.ok) {
        const retryMd = retry.body.data?.markdown || retry.body.markdown || "";
        if (retryMd.trim().length > markdown.trim().length) {
          markdown = retryMd;
          title = retry.body.data?.metadata?.title || retry.body.metadata?.title || title;
        }
      }
    }

    if (markdown.trim().length < 200) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Couldn't extract the job description from that URL. The page may require login or render content dynamically. Please paste the description manually.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, markdown, title }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to scrape",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
