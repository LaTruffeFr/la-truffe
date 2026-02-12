import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": "https://www.leboncoin.fr/",
      },
    });

    if (!response.ok) {
      return new Response("Failed to fetch image", { status: 502, headers: corsHeaders });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await response.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return new Response("Error: " + error.message, { status: 500, headers: corsHeaders });
  }
});
