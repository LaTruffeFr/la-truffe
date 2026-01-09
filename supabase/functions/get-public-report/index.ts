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
    const { reportId } = await req.json();

    if (!reportId) {
      return new Response(
        JSON.stringify({ error: "Report ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch report
    const { data: report, error: reportError } = await supabaseAdmin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .eq("status", "completed")
      .single();

    if (reportError || !report) {
      console.error("Report fetch error:", reportError);
      return new Response(
        JSON.stringify({ error: "Report not found or not completed" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch related vehicles
    const modelFirstWord = report.modele.split(" ")[0];
    const { data: vehicles } = await supabaseAdmin
      .from("vehicles")
      .select("*")
      .ilike("modele", `%${modelFirstWord}%`)
      .order("gain_potentiel", { ascending: false, nullsFirst: false })
      .limit(10);

    return new Response(
      JSON.stringify({ report, vehicles: vehicles || [] }),
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
