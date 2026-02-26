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
- '💎 1ÈRE MAIN' (+5) : Première main, 1ère main.
- '🇫🇷 ORIGINE FR' (+5) : Origine France, française, achat concession française.
- '📘 HISTORIQUE PREMIUM' (+5) : Carnet tamponné, suivi exclusif en réseau constructeur.
- '📘 HISTORIQUE' (+4) : Carnet à jour, factures, suivi limpide.
- '💶 TAXE OK' (+8) : Malus payé, écotaxe payée, pas de malus.
- '🛡️ GARANTIE' (+4) : Garantie 12 ou 24 mois, sous garantie.
- '✅ CT OK' (+3) : Contrôle technique OK, vierge.
- '🔧 GROS ENTRETIEN FAIT' (+3) : Distribution neuve, chaîne neuve, vidange boîte.

=== COLLECTORS & SÉRIES LIMITÉES (gros bonus) ===
- '🏆 COLLECTOR USINE' (+40) : CHERCHE les séries limitées comme "1 of 40", "x of 40", "Edition Héritage", "Heritage", CS, CSL, GTS, DTM, TCR.
  PIÈGE : Ne PAS confondre avec "STYLE GTS" ou "LOOK CS" qui sont des répliques.

=== TUNING (négatifs - modifications non-premium) ===
- '🔧 REPROG' (-5) : Stage 1, Stage 2, reprogrammation, cartographie MOTEUR.
  PIÈGE CRITIQUE : "GPS Cartographique" ou "Navigation Cartographique" n'est PAS une reprog moteur ! C'est un GPS standard. Ne confonds JAMAIS.

=== DANGERS (très négatifs) ===
- '💀 MOTEUR HS' (-100) : Moteur HS, bruit moteur, claquement, joint de culasse.
- '💀 ACCIDENT GRAVE' (-100) : Véhicule accidenté, sinistre, épave.
- '⚠️ KM NON GARANTI' (-100) : Kilométrage non garanti.
- '💀 BOITE HS' (-80) : Boîte HS.
- '💥 ACCIDENTÉE' (-50) : Mention d'accident (sauf si précédé de "jamais").
- '🏝️ DOM-TOM' (+5) : Réunion, Guadeloupe, Martinique, Guyane, Mayotte.
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
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
    const html = scrapeData?.data?.html || scrapeData?.html || "";
    const screenshot = scrapeData?.data?.screenshot || scrapeData?.screenshot || null;
    let imageUrl = scrapeData?.data?.metadata?.ogImage || null;
    if (!imageUrl && html) {
      const imgMatch = html.match(/<img[^>]+src=["']([^"']*(?:leboncoin|lbc|slatic|autosc|lacentrale)[^"']*(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }
    const scrapedContent = markdown.length > 200 ? markdown : html;

    // === ÉTAPE 2 : EXTRACTION IA (1er appel Gemini) ===
    const extractPrompt = `Tu es l'Agent Analyste 'La Truffe'. Lis l'annonce, réfléchis à voix haute pour déjouer les pièges, extrais les données et attribue les tags.
    ANNONCE : ${scrapedContent}
    ${RULEBOOK}
    DIRECTIVES :
    1. Dans "raisonnement", justifie le Modèle Exact et les tags.
    2. RÈGLE ABSOLUE POUR LES OPTIONS : INTERDICTION FORMELLE de lister les options de base (GPS, USB, Bluetooth, Radio, Clim, ABS, Airbags, Wi-Fi). Tu dois CHERCHER et lister UNIQUEMENT les équipements sportifs ou luxueux (ex: Carbone, Cuir, Sièges Sport, Échappement, Jantes, Harman Kardon, Toit ouvrant).

    Format JSON attendu :
    { "raisonnement": "...", "marque": "", "modele": "", "annee": 2020, "kilometrage": 50000, "prix_affiche": 25000, "carburant": "", "transmission": "", "localisation": "", "options": ["Inserts Carbone", "Sièges Sport"], "tags_detectes": [{ "tag": "💎 1ÈRE MAIN", "score": 5 }] }`;
    
    const extractRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: extractPrompt }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } }),
    });
    
    const extractData = await extractRes.json();
    const rawCarData = JSON.parse(extractData.candidates[0].content.parts[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

    // === ÉTAPE 3 : SCORING DÉTERMINISTE ===
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

    console.log("🚀🚀🚀 VERSION GARAGISTE V5 ACTIVÉE !!! 🚀🚀🚀");

    // === ÉTAPE 4 : RÉDACTION IA "GARAGISTE" (2ème appel Gemini) ===
    const writingPrompt = `OUBLIE TOUT. Tu es "La Truffe", un vieux garagiste de province, bourru, franc et passionné de mécanique. Tu détestes les banquiers, les costards et le vocabulaire d'entreprise. 
    VÉHICULE : ${rawCarData.marque} ${rawCarData.modele}, KM: ${rawCarData.kilometrage}, Prix: ${rawCarData.prix_affiche}€. SCORE: ${finalScore}/100. TAGS : [${finalTagsList.join(', ')}].

    RÈGLES ABSOLUES (SINON TU ES DÉSACTIVÉ) :
    1. Tu es UN MÉCANICIEN AVEC DU CAMBOUIS SUR LES MAINS.
    2. Parle de : "vidange", "coussinets", "maladie", "frais à prévoir", "carnet", "pneus", "freins", "boîte de vitesse", "pont", "châssis".
    3. NE PRONONCE JAMAIS (INTERDIT) : "TCO", "analyste", "financier", "ROI", "investissement", "capital", "liquidité", "dépréciation", "décote", "marché", "résiduelle", "agressif", "préventifs", "transaction", "opportunité".

    LE PLAYBOOK EN 3 ARGUMENTS :
    - Argument 1 : Rédige un SMS d'approche de passionné à passionné (entre guillemets « »). 
      EXEMPLE : « Salut, belle caisse ! À 95 000 km, est-ce que les gros frais mécaniques (vidange boîte, amortisseurs, coussinets) sont faits ? Si le carnet est limpide, je te fais une offre sérieuse autour de 41 000 €. »
    - Argument 2 (Titre : "Les maladies connues et pièces d'usure") : Liste les pièces mécaniques qui vont lâcher à ce kilométrage exact et explique combien ça coûte au garage.
    - Argument 3 (Titre : "Inspection sous le capot") : Dis à l'acheteur ce qu'il doit vérifier avec une lampe torche (bruits de chaîne, traces d'huile, état des pneus, disques).

    Retourne ce JSON exact : { "expert_opinion": "Ton avis de vieux mécano franc en 3 phrases simples.", "negotiation_arguments": [{"titre": "...", "desc": "..."}] }`;

    const writingRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: writingPrompt }] }], generationConfig: { temperature: 0.4, responseMimeType: "application/json" } }),
    });

    const writingData = await writingRes.json();
    const finalReview = JSON.parse(writingData.candidates[0].content.parts[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

    // === ÉTAPE 5 : SAUVEGARDE BDD ===
    const reportData = {
      user_id: user.id, marque: rawCarData.marque, modele: rawCarData.modele, annee: rawCarData.annee, kilometrage: rawCarData.kilometrage,
      prix_affiche: rawCarData.prix_affiche, prix_estime: prixEstime, prix_truffe: Math.round(prixEstime * 0.95), lien_annonce: url,
      carburant: rawCarData.carburant, transmission: rawCarData.transmission, expert_opinion: finalReview.expert_opinion,
      negotiation_arguments: JSON.stringify(finalReview.negotiation_arguments || []), status: "completed", total_vehicules: 1,
      market_data: {
        type: "single_audit", options: rawCarData.options || [],
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
