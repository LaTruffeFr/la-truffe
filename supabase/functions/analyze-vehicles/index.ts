import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VehicleInput {
  id: string;
  titre: string;
  marque: string;
  modele: string;
  prix: number;
  kilometrage: number;
  annee: number;
  description: string;
}

interface VehicleAnalysis {
  id: string;
  options: string[];
  etat: string;
  pointsForts: string[];
  pointsFaibles: string[];
  resumeClient: string;
  bonusScore: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // --- End Authentication ---

    const { vehicles } = await req.json() as { vehicles: VehicleInput[] };
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    if (!vehicles || vehicles.length === 0) {
      return new Response(JSON.stringify({ analyses: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter vehicles that actually have descriptions
    const withDesc = vehicles.filter(v => v.description && v.description.trim().length > 20);

    if (withDesc.length === 0) {
      return new Response(JSON.stringify({ analyses: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process in batches of 10 to stay within token limits
    const BATCH_SIZE = 10;
    const allAnalyses: VehicleAnalysis[] = [];

    for (let i = 0; i < withDesc.length; i += BATCH_SIZE) {
      const batch = withDesc.slice(i, i + BATCH_SIZE);
      
      const vehicleList = batch.map((v, idx) => 
        `[${idx + 1}] ID: ${v.id}
Titre: ${v.titre}
Marque: ${v.marque} | Modèle: ${v.modele} | Année: ${v.annee} | KM: ${v.kilometrage} | Prix: ${v.prix}€
Description: ${v.description.slice(0, 500)}`
      ).join('\n\n---\n\n');

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Tu es un expert automobile français spécialisé dans l'analyse de véhicules d'occasion.
Pour chaque véhicule, analyse la description et extrais les informations clés.

Analyse ces ${batch.length} véhicules et retourne un JSON avec exactement ce format:

${vehicleList}

Retourne UNIQUEMENT un JSON valide (pas de markdown, pas de \`\`\`):
{
  "analyses": [
    {
      "id": "l'ID du véhicule",
      "options": ["liste des options/équipements détectés, max 6"],
      "etat": "Excellent|Très bon|Bon|Moyen|À vérifier",
      "pointsForts": ["max 3 points positifs concis"],
      "pointsFaibles": ["max 3 points négatifs ou alertes"],
      "resumeClient": "2-3 phrases MAXIMUM expliquant pourquoi cette voiture est intéressante (ou pas). NE PAS énumérer les specs. Sois direct et passionné.",
      "bonusScore": "nombre entre -20 et +20 (positif = bonne affaire confirmée, négatif = risques détectés)"
    }
  ]
}

Règles de scoring bonusScore:
- Carnet d'entretien complet, 1ère main, historique clair → +10 à +20
- Options premium (cuir, toit, caméra, etc.) → +5 à +10
- Signes d'usure, frais à prévoir, fumeur → -5 à -10
- Accident, moteur HS, problème grave → -15 à -20
- Description vague ou trop courte → 0`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API error:", response.status, errText);
        continue;
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      try {
        const cleanJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.analyses && Array.isArray(parsed.analyses)) {
          allAnalyses.push(...parsed.analyses);
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError, content.slice(0, 200));
      }
    }

    return new Response(JSON.stringify({ analyses: allAnalyses }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("analyze-vehicles error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
