import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_DOMAINS = [
  "leboncoin.fr",
  "lacentrale.fr",
  "autoscout24.fr",
  "autoscout24.com",
];

function isValidListingUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return SUPPORTED_DOMAINS.some(d => parsed.hostname.includes(d));
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Authentification invalide" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Parse body ---
    const { url } = await req.json();
    if (!url || !isValidListingUrl(url)) {
      return new Response(JSON.stringify({ error: "URL invalide. Sites supportés : LeBonCoin, La Centrale, AutoScout24." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Step 1: Scrape with Firecrawl ---
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Connecteur Firecrawl non configuré" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Scraping URL:", url);
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html", "screenshot"],
        onlyMainContent: false,
        waitFor: 8000,
      }),
    });

    if (!scrapeResponse.ok) {
      const errText = await scrapeResponse.text();
      console.error("Firecrawl error:", scrapeResponse.status, errText);
      return new Response(JSON.stringify({ error: "Impossible de scraper l'annonce. Vérifiez le lien." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
    const html = scrapeData?.data?.html || scrapeData?.html || "";
    const screenshot = scrapeData?.data?.screenshot || scrapeData?.screenshot || null;
    const metadata = scrapeData?.data?.metadata || scrapeData?.metadata || {};
    
    // Extract image URL from metadata or HTML
    let imageUrl = metadata?.ogImage || metadata?.["og:image"] || null;
    if (!imageUrl && html) {
      // Try to extract first large image from HTML
      const imgMatch = html.match(/<img[^>]+src=["']([^"']*(?:leboncoin|lbc|slatic|autosc|lacentrale)[^"']*(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    if (!imageUrl && html) {
      // Broader image extraction
      const imgMatch2 = html.match(/https?:\/\/[^"'\s]+(?:\.jpg|\.jpeg|\.png|\.webp)/i);
      if (imgMatch2) imageUrl = imgMatch2[0];
    }
    
    console.log("Image URL found:", imageUrl ? imageUrl.slice(0, 80) : "none");
    
    // Use markdown if available, otherwise fall back to HTML content
    const scrapedContent = markdown.length > 200 ? markdown : html;

    if (!scrapedContent || scrapedContent.length < 50) {
      return new Response(JSON.stringify({ error: "Contenu de l'annonce insuffisant. L'annonce a peut-être été supprimée." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Scraped content length:", scrapedContent.length, "markdown:", markdown.length, "html:", html.length);

    // --- Step 2: AI Analysis with Gemini ---
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `Tu es un expert automobile français reconnu, spécialisé dans l'évaluation de véhicules d'occasion. Tu analyses les annonces pour aider les acheteurs à prendre la meilleure décision.

Analyse cette annonce automobile et génère un rapport d'audit complet.

URL de l'annonce : ${url}

Contenu de l'annonce :
${scrapedContent.slice(0, 6000)}

Retourne UNIQUEMENT un JSON valide avec ce format exact :
{
  "marque": "la marque du véhicule",
  "modele": "le modèle du véhicule",
  "annee": 2020,
  "kilometrage": 50000,
  "prix_affiche": 25000,
  "carburant": "Diesel|Essence|Hybride|Électrique",
  "transmission": "Manuelle|Automatique",
  "localisation": "ville ou département",
  "prix_estime": 24000,
  "prix_truffe": 22500,
  "score": 75,
  "options": ["option 1", "option 2", "max 8"],
  "etat": "Excellent|Très bon|Bon|Moyen|À vérifier",
  "points_forts": ["max 5 points positifs concis"],
  "points_faibles": ["max 5 points négatifs ou alertes"],
  "expert_opinion": "2-3 phrases MAXIMUM qui expliquent POURQUOI cette annonce est intéressante ou pas. Sois direct, passionné et concis.",
  "negotiation_arguments": [
    {"titre": "Argument 1", "desc": "Explication détaillée pour négocier"},
    {"titre": "Argument 2", "desc": "Explication détaillée pour négocier"},
    {"titre": "Argument 3", "desc": "Explication détaillée pour négocier"}
  ],
  "resume": "Résumé en 2 phrases max pour l'acheteur. Direct et factuel."
}

Règles d'estimation du prix :
- prix_estime = valeur marché réaliste basée sur le modèle, l'année, le km et l'état
- prix_truffe = prix négocié optimal que l'acheteur devrait viser
- score = note de 10 à 98 (10=mauvaise affaire, 98=affaire exceptionnelle)
- Si tu ne peux pas déterminer une info, mets null
- Les arguments de négociation doivent être concrets et basés sur l'annonce`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "Erreur lors de l'analyse IA." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let analysis;
    try {
      const cleanJson = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content.slice(0, 300));
      return new Response(JSON.stringify({ error: "L'IA n'a pas pu analyser cette annonce. Réessayez." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Step 3: Save report to DB ---
    const reportData = {
      user_id: user.id,
      marque: analysis.marque || "Inconnu",
      modele: analysis.modele || "Inconnu",
      annee: analysis.annee || null,
      kilometrage: analysis.kilometrage || null,
      prix_affiche: analysis.prix_affiche || null,
      prix_estime: analysis.prix_estime || null,
      prix_truffe: analysis.prix_truffe || null,
      prix_moyen: analysis.prix_estime || null,
      lien_annonce: url,
      carburant: analysis.carburant || null,
      transmission: analysis.transmission || null,
      expert_opinion: analysis.expert_opinion || null,
      negotiation_arguments: JSON.stringify(analysis.negotiation_arguments || []),
      status: "completed" as const,
      total_vehicules: 1,
      market_data: {
        type: "single_audit",
        options: analysis.options || [],
        etat: analysis.etat || null,
        points_forts: analysis.points_forts || [],
        points_faibles: analysis.points_faibles || [],
        resume: analysis.resume || null,
        score: analysis.score || 50,
        localisation: analysis.localisation || null,
        image_url: imageUrl || null,
        screenshot: screenshot || null,
      },
    };

    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert(reportData)
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Erreur lors de la sauvegarde du rapport." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Report created:", report.id);

    return new Response(JSON.stringify({ 
      reportId: report.id,
      analysis 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("audit-url error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
