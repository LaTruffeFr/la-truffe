// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { brand, model } = await req.json();
    if (!brand || !model) return jsonResponse({ error: "Marque et modèle requis." }, 400);

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Check cache first
    const { data: existing } = await supabaseAdmin
      .from("model_guides")
      .select("*")
      .ilike("brand", brand.trim())
      .ilike("model", model.trim())
      .maybeSingle();

    if (existing) {
      return jsonResponse({ guide: existing });
    }

    // Generate with Gemini
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) return jsonResponse({ error: "Configuration serveur incomplète." }, 500);

    const prompt = `Tu es un expert automobile français reconnu, spécialisé en fiabilité et en mécanique. On te demande un guide complet sur le modèle "${brand} ${model}".

RÈGLES :
1. Sois factuel et précis. Base-toi sur les données réelles de fiabilité connues des mécaniciens et des forums spécialisés.
2. Ne te contente pas de généralités. Cite les VRAIS problèmes connus avec les codes moteurs ou châssis quand c'est pertinent.
3. La fourchette de prix doit refléter le marché français de l'occasion ACTUEL (2024-2025).

Retourne CE JSON EXACT :
{
  "history_summary": "Un résumé complet de l'histoire du modèle en 3-5 phrases (générations, motorisations principales, positionnement).",
  "market_range": "Fourchette de prix réaliste sur le marché occasion français (ex: '15 000 € - 22 000 €'). Donne une fourchette large couvrant les différentes générations/motorisations.",
  "reliability_score": 7,
  "known_issues": ["Problème 1 précis avec détails", "Problème 2", "Problème 3", "Problème 4"],
  "mechanic_advice": "L'avis final de l'expert : les points à vérifier absolument avant d'acheter ce modèle, les versions à privilégier ou éviter."
}`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      }),
    });

    if (!geminiRes.ok) {
      console.error("Gemini error:", geminiRes.status);
      return jsonResponse({ error: "L'IA n'a pas pu générer le guide. Réessayez." }, 502);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return jsonResponse({ error: "Réponse IA vide." }, 422);

    let content: any;
    try {
      content = JSON.parse(rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      return jsonResponse({ error: "Réponse IA mal formatée." }, 422);
    }

    // Save to DB
    const { data: guide, error: insertErr } = await supabaseAdmin
      .from("model_guides")
      .insert({ brand: brand.trim(), model: model.trim(), content })
      .select()
      .single();

    if (insertErr) {
      console.error("DB insert error:", insertErr);
      // Still return the content even if save fails
      return jsonResponse({ guide: { brand: brand.trim(), model: model.trim(), content } });
    }

    return jsonResponse({ guide });
  } catch (e: any) {
    console.error("generate-model-guide error:", e);
    return jsonResponse({ error: e?.message || "Erreur interne." }, 500);
  }
});
