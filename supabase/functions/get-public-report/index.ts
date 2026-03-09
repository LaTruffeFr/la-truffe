import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareToken, reportId }: { shareToken?: string; reportId?: string } = await req.json();

    if (!shareToken && !reportId) {
      return new Response(
        JSON.stringify({ error: "shareToken or reportId is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let query = supabaseAdmin
      .from("reports")
      .select("*")
      .eq("status", "completed");

    if (reportId) {
      // UUID format check
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidPattern.test(reportId)) {
        return new Response(
          JSON.stringify({ error: "Invalid report ID format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      query = query.eq("id", reportId);
    } else if (shareToken) {
      const hexPattern = /^[a-f0-9]{64}$/;
      if (!hexPattern.test(shareToken)) {
        return new Response(
          JSON.stringify({ error: "Invalid share token format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      query = query.eq("share_token", shareToken);
    }

    const { data: report, error: reportError } = await query.single();

    if (reportError || !report) {
      console.error("Report fetch error:", reportError);
      return new Response(
        JSON.stringify({ error: "Report not found or not available" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Strip sensitive fields before returning
    const { user_id, admin_notes, ...safeReport } = report;

    return new Response(
      JSON.stringify({ report: safeReport }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in get-public-report:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
