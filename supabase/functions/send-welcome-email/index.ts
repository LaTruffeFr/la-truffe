import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const appUrl = Deno.env.get("APP_URL") || "https://latruffe.lovable.app";

    const emailResponse = await resend.emails.send({
      from: "La Truffe <onboarding@resend.dev>",
      to: [email],
      subject: "🦊 Bienvenue sur La Truffe !",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table role="presentation" style="width:100%;border-collapse:collapse;">
            <tr><td align="center" style="padding:40px 20px;">
              <table role="presentation" style="max-width:600px;width:100%;background-color:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <tr><td style="background:linear-gradient(135deg,#312e81 0%,#4338ca 50%,#6366f1 100%);padding:40px 24px;text-align:center;">
                  <h1 style="margin:0;color:white;font-size:32px;font-weight:900;">🦊 Bienvenue sur La Truffe</h1>
                  <p style="margin:12px 0 0 0;color:rgba(255,255,255,0.85);font-size:16px;">L'Expert Automobile IA qui protège votre portefeuille</p>
                </td></tr>
                <tr><td style="padding:32px 24px;">
                  <h2 style="margin:0 0 16px 0;color:#18181b;font-size:24px;">Votre compte est prêt ! 🎉</h2>
                  <p style="margin:0 0 24px 0;color:#52525b;font-size:16px;line-height:1.6;">
                    Vous avez désormais accès à notre technologie d'analyse automobile. Voici ce que vous pouvez faire :
                  </p>
                  <div style="background-color:#f4f4f5;border-radius:12px;padding:20px;margin-bottom:24px;">
                    <p style="margin:0 0 12px 0;color:#18181b;font-size:15px;font-weight:600;">🔍 Scanner une annonce Leboncoin ou La Centrale</p>
                    <p style="margin:0 0 12px 0;color:#18181b;font-size:15px;font-weight:600;">📊 Obtenir le juste prix estimé par l'IA</p>
                    <p style="margin:0 0 12px 0;color:#18181b;font-size:15px;font-weight:600;">💬 Recevoir des arguments de négociation personnalisés</p>
                    <p style="margin:0;color:#18181b;font-size:15px;font-weight:600;">🛡️ Détecter les vices cachés et arnaques</p>
                  </div>
                  <p style="margin:0 0 24px 0;color:#52525b;font-size:16px;line-height:1.6;">
                    <strong>1 crédit offert</strong> vous attend pour votre premier audit. Collez simplement le lien d'une annonce et laissez La Truffe faire le travail.
                  </p>
                  <table role="presentation" style="width:100%;"><tr><td align="center">
                    <a href="${appUrl}/audit" style="display:inline-block;background:linear-gradient(135deg,#4338ca 0%,#6366f1 100%);color:white;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:16px;font-weight:700;">
                      🚗 Scanner ma première annonce
                    </a>
                  </td></tr></table>
                </td></tr>
                <tr><td style="background-color:#f4f4f5;padding:24px;text-align:center;">
                  <p style="margin:0;color:#71717a;font-size:12px;">© ${new Date().getFullYear()} La Truffe — L'Expert Automobile IA</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent to:", email, emailResponse);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-welcome-email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
