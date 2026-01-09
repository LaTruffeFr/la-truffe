import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendReportEmailRequest {
  reportId: string;
  clientEmail: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId, clientEmail }: SendReportEmailRequest = await req.json();

    if (!reportId || !clientEmail) {
      return new Response(
        JSON.stringify({ error: "reportId and clientEmail are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch report details
    const { data: report, error: reportError } = await supabaseAdmin
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      console.error("Report fetch error:", reportError);
      return new Response(
        JSON.stringify({ error: "Report not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build public report URL
    const appUrl = Deno.env.get("APP_URL") || "https://votre-app.lovable.app";
    const reportUrl = `${appUrl}/audit/${reportId}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: "La Truffe <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `🚗 Votre audit de prix est prêt : ${report.marque} ${report.modele}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 32px 24px; text-align: center;">
                      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🦊 La Truffe</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Audit de Prix Automobile</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 32px 24px;">
                      <h2 style="margin: 0 0 16px 0; color: #18181b; font-size: 24px;">
                        Votre audit est prêt ! 🎉
                      </h2>
                      
                      <p style="margin: 0 0 24px 0; color: #52525b; font-size: 16px; line-height: 1.6;">
                        Bonne nouvelle ! Notre équipe a terminé l'analyse de marché pour votre recherche :
                      </p>
                      
                      <!-- Vehicle Card -->
                      <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <p style="margin: 0 0 4px 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                          Véhicule recherché
                        </p>
                        <p style="margin: 0; color: #18181b; font-size: 20px; font-weight: 600;">
                          ${report.marque} ${report.modele}
                        </p>
                        ${report.annee_min ? `<p style="margin: 4px 0 0 0; color: #52525b; font-size: 14px;">Année : ${report.annee_min}${report.annee_max ? ` - ${report.annee_max}` : '+'}</p>` : ''}
                        ${report.prix_max ? `<p style="margin: 4px 0 0 0; color: #52525b; font-size: 14px;">Budget max : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(report.prix_max)}</p>` : ''}
                      </div>
                      
                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%;">
                        <tr>
                          <td align="center">
                            <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                              📊 Voir mon audit complet
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 24px 0 0 0; color: #71717a; font-size: 14px; text-align: center;">
                        Ce lien est unique et sécurisé.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f4f4f5; padding: 24px; text-align: center;">
                      <p style="margin: 0; color: #71717a; font-size: 12px;">
                        © ${new Date().getFullYear()} La Truffe - Audit de Prix Automobile
                      </p>
                      <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 11px;">
                        Ce document ne constitue pas une garantie mécanique.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-report-email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
