import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_DOMAINS = [
  "img.leboncoin.fr",
  "static.leboncoin.fr",
  "images.leboncoin.fr",
  "cdn.lbc.bzh",
];

function isDomainAllowed(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reqUrl = new URL(req.url);
    const imageUrl = reqUrl.searchParams.get("url");

    if (!imageUrl) {
      return new Response("Missing url param", { status: 400, headers: corsHeaders });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return new Response("Invalid URL", { status: 400, headers: corsHeaders });
    }

    // Only allow HTTPS
    if (parsedUrl.protocol !== "https:") {
      return new Response("Only HTTPS URLs allowed", { status: 403, headers: corsHeaders });
    }

    // Whitelist domains
    if (!isDomainAllowed(parsedUrl.hostname)) {
      return new Response("Domain not allowed", { status: 403, headers: corsHeaders });
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
          "Referer": "https://www.leboncoin.fr/",
        },
      });

      if (!response.ok) {
        return new Response("Failed to fetch image", { status: 502, headers: corsHeaders });
      }

      // Verify content-type is an image
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        return new Response("Not an image", { status: 400, headers: corsHeaders });
      }

      // Size limit: 10MB
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 10_000_000) {
        return new Response("Image too large", { status: 413, headers: corsHeaders });
      }

      const imageBuffer = await response.arrayBuffer();

      return new Response(imageBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response("Error: " + message, { status: 500, headers: corsHeaders });
  }
});
