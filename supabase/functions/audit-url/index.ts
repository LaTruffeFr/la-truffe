// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_DOMAINS = ["leboncoin.fr", "lacentrale.fr", "autoscout24.fr", "autoscout24.com"];

function isValidListingUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return SUPPORTED_DOMAINS.some(d => parsed.hostname.includes(d));
  } catch { return false; }
}

const RULEBOOK = `
RÈGLES D'ATTRIBUTION DES TAGS (AVEC LEUR SCORE) :
=== BOOSTERS (positifs) ===
- '💎 1ÈRE MAIN' (+5)
- '🇫🇷 ORIGINE FR' (+5)
- '📘 HISTORIQUE PREMIUM' (+5)
- '📘 HISTORIQUE' (+4)
- '💶 TAXE OK' (+8)
- '🛡️ GARANTIE' (+4)
- '✅ CT OK' (+3)
- '🔧 GROS ENTRETIEN FAIT' (+3)
=== TUNING (négatifs - modifications) ===
- '⚠️ MODIFIÉE' (-15) : Cherche les mots "decata", "défap", "stage 1", "stage 2", "cartographie", "ligne inox".
=== DANGERS (très négatifs) ===
- '💀 MOTEUR HS' (-100)
- '💀 ACCIDENT GRAVE' (-100)
- '⚠️ KM NON GARANTI' (-100)
`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Authentification invalide" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { url } = await req.json();
    if (!url || !isValidListingUrl(url)) return new Response(JSON.stringify({ error: "URL invalide." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!FIRECRAWL_API_KEY || !GEMINI_API_KEY) throw new Error("API Keys manquantes");

    // === ÉTAPE 1 : SCRAPING ===
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST", headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown", "html", "screenshot"], onlyMainContent: false, waitFor: 8000 }),
    });

    if (!scrapeResponse.ok) throw new Error("Impossible de scraper l'annonce.");
    const scrapeData = await scrapeResponse.json();
    const html = scrapeData?.data?.html || scrapeData?.html || "";
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || html;
    const screenshot = scrapeData?.data?.screenshot || scrapeData?.screenshot || null;
    let imageUrl = scrapeData?.data?.metadata?.ogImage || null;
    if (!imageUrl && html) {
      const imgMatch = html.match(/<img[^>]+src=["']([^"']*(?:leboncoin|lbc|slatic|autosc|lacentrale)[^"']*(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    // === ÉTAPE 2 : EXTRACTION IA ===
    const extractPrompt = `Tu es un extracteur de données strict. Lis cette annonce automobile :
    ${markdown}
    
    ${RULEBOOK}
    
    Format JSON attendu (Sois ultra précis sur 'pieces_neuves' et 'modifications_tuning') :
    { 
      "marque": "", "modele": "", "annee": 2020, "kilometrage": 50000, "prix_affiche": 25000, "carburant": "", "transmission": "", "localisation": "", 
      "options_premium": ["Carbone", "Harman Kardon"], 
      "pieces_neuves_annoncees": "Liste TOUT ce que le vendeur dit avoir changé ou mis à neuf (ex: pneus, freins, distribution). Si rien, écris 'Aucune'.",
      "modifications_tuning": "Liste les modifs illégales ou tuning (ex: decata, stage 1, defap). Si aucune, écris 'Aucune'.",
      "tags_detectes": [{ "tag": "💎 1ÈRE MAIN", "score": 5 }] 
    }`;
    
    const extractRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: extractPrompt }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } }),
    });
    
    const extractData = await extractRes.json();
    const rawCarData = JSON.parse(extractData.candidates[0].content.parts[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

    // === ÉTAPE 3 : SCORING ===
    let scoreMod = 0; const finalTagsList: string[] = []; let isKiller = false;
    for (const item of (rawCarData.tags_detectes || [])) {
      scoreMod += item.score; finalTagsList.push(item.tag);
      if (item.score <= -50) isKiller = true;
    }
    let finalScore = isKiller ? 0 : Math.max(0, Math.min(99, Math.round(60 + scoreMod)));
    let prixEstime = rawCarData.prix_affiche;
    if (finalScore >= 90) prixEstime = Math.round(rawCarData.prix_affiche * 1.15);
    else if (finalScore > 80) prixEstime = Math.round(rawCarData.prix_affiche * 1.08);
    else if (finalScore < 50) prixEstime = Math.round(rawCarData.prix_affiche * 0.85);
    else prixEstime = Math.round(rawCarData.prix_affiche * 0.95);

    const prix_truffe = Math.round(prixEstime * 0.95);

    // === ÉTAPE 4 : RÉDACTION IA (Le Garagiste) ===
    const writingPrompt = `Tu es "La Truffe", un vieux mécanicien franc et bourru.
    VÉHICULE : ${rawCarData.marque} ${rawCarData.modele} | KM: ${rawCarData.kilometrage} | Prix: ${rawCarData.prix_affiche}€.
    PIÈCES NEUVES SELON LE VENDEUR : "${rawCarData.pieces_neuves_annoncees}"
    MODIFICATIONS DÉTECTÉES : "${rawCarData.modifications_tuning}"

    CONSIGNES STRICTES :
    1. Si la voiture est une "Clio 4 RS" : Parle UNIQUEMENT de la boîte EDC à surveiller. Il est STRICTEMENT INTERDIT d'écrire le mot "coussinets". Ce moteur n'a pas ce problème.
    2. Si le champ MODIFICATIONS DÉTECTÉES contient "decata", "defap" ou "stage" : Tu DOIS hurler dans ton avis. Dis que la voiture est modifiée, illégale, et qu'elle ne passera pas la pollution au CT.
    3. Dans le DEVIS ESTIMÉ : NE FACTURE SURTOUT PAS les pièces inscrites dans "PIÈCES NEUVES SELON LE VENDEUR" (ex: si les pneus sont neufs, ne les mets pas dans le devis !).
    
    LE PLAYBOOK EN 3 ARGUMENTS :
    - Argument 1 : Rédige un SMS d'approche (« ») avec une offre ferme autour de ${prix_truffe} €. S'il y a un decata, utilise-le pour faire baisser le prix.
    - Argument 2 (Titre : "Mécanique et Historique") : Liste les maladies connues du modèle et commente les réparations ou modifications du vendeur.
    - Argument 3 (Titre : "Inspection sous le capot") : Ce qu'il faut vérifier sur place.

    Retourne CE JSON EXACT : 
    { 
      "expert_opinion": "Ton avis général en 3 phrases, très franc.", 
      "negotiation_arguments": [{"titre": "...", "desc": "..."}],
      "devis_estime": [{"piece": "Nom de l'intervention", "cout_euros": 250}]
    }`;

    const writingRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: writingPrompt }] }], generationConfig: { temperature: 0.3, responseMimeType: "application/json" } }),
    });

    const writingData = await writingRes.json();
    const finalReview = JSON.parse(writingData.candidates[0].content.parts[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

    // === ÉTAPE 5 : SAUVEGARDE ===
    const reportData = {
      user_id: user.id, marque: rawCarData.marque, modele: rawCarData.modele, annee: rawCarData.annee, kilometrage: rawCarData.kilometrage,
      prix_affiche: rawCarData.prix_affiche, prix_estime: prixEstime, prix_truffe: prix_truffe, lien_annonce: url,
      carburant: rawCarData.carburant, transmission: rawCarData.transmission, expert_opinion: finalReview.expert_opinion,
      negotiation_arguments: JSON.stringify(finalReview.negotiation_arguments || []), status: "completed", total_vehicules: 1,
      notes: JSON.stringify(finalReview.devis_estime || []),
      market_data: {
        type: "single_audit", options: rawCarData.options_premium || [],
        etat: finalScore > 75 ? "Excellent" : (finalScore > 50 ? "Bon" : "Moyen"),
        points_forts: finalTagsList.filter((t: string) => !t.includes('⚠️') && !t.includes('💀')),
        points_faibles: finalTagsList.filter((t: string) => t.includes('⚠️') || t.includes('💀')),
        score: finalScore, localisation: rawCarData.localisation, image_url: imageUrl, screenshot: screenshot,
      },
    };

    const { data: report, error: insertError } = await supabase.from("reports").insert(reportData).select("id").single();
    if (insertError) throw new Error("Erreur BDD.");

    return new Response(JSON.stringify({ reportId: report.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
