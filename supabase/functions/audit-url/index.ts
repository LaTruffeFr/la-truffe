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
- '🇫🇷 ORIGINE FR' (+5) : Origine France, française.
- '📘 HISTORIQUE PREMIUM' (+5) : Carnet tamponné réseau constructeur.
- '📘 HISTORIQUE' (+4) : Carnet à jour, factures.
- '💶 TAXE OK' (+8) : Malus payé, écotaxe payée.
- '🛡️ GARANTIE' (+4) : Garantie 12 ou 24 mois.
- '✅ CT OK' (+3) : Contrôle technique OK, vierge.
- '🔧 GROS ENTRETIEN FAIT' (+3) : Distribution neuve, chaîne neuve, vidange boîte.

=== COLLECTORS & SÉRIES LIMITÉES (gros bonus) ===
- '🏆 COLLECTOR USINE' (+40) : Séries limitées "1 of 40", "Edition Héritage", CS, CSL, GTS, DTM, TCR.
  PIÈGE : Ne PAS confondre avec "STYLE GTS" ou "LOOK CS" qui sont des répliques.

=== TUNING (négatifs) ===
- '🔧 REPROG' (-5) : Stage 1, Stage 2, reprogrammation moteur.
  PIÈGE CRITIQUE : "GPS Cartographique" n'est PAS une reprog moteur !
- '⚠️ MODIFIÉE' (-15) : decata, défap, ligne inox non homologuée.

=== DANGERS (très négatifs) ===
- '💀 MOTEUR HS' (-100) : Moteur HS, claquement, joint de culasse.
- '💀 ACCIDENT GRAVE' (-100) : Véhicule accidenté, sinistre, épave.
- '⚠️ KM NON GARANTI' (-100) : Kilométrage non garanti.
- '💀 BOITE HS' (-80) : Boîte HS.
- '💥 ACCIDENTÉE' (-50) : Mention d'accident (sauf si précédé de "jamais").
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

    const scrapedContent = markdown.length > 200 ? markdown : html;

    // === ÉTAPE 2 : EXTRACTION IA (Agent Analyste) ===
    const extractPrompt = `Tu es l'Agent Analyste 'La Truffe'. Lis l'annonce, réfléchis à voix haute pour déjouer les pièges, extrais les données et attribue les tags.
    ANNONCE : ${scrapedContent}
    ${RULEBOOK}
    DIRECTIVES :
    1. Dans "raisonnement", justifie le Modèle Exact (code moteur si possible) et les tags.
    2. IDENTIFICATION EXPERTE : Identifie le code moteur précis et l'architecture (ex: N54, EA888, FA20, 13B-MSP). C'est CRITIQUE pour l'étape suivante.
    3. RÈGLE ABSOLUE POUR LES OPTIONS : INTERDICTION FORMELLE de lister les options de base (GPS, USB, Bluetooth, Radio, Clim, ABS, Airbags, Wi-Fi). Liste UNIQUEMENT les équipements sportifs ou luxueux (ex: Carbone, Cuir, Sièges Sport, Échappement, Jantes, Harman Kardon, Toit ouvrant).
    4. PIÈCES NEUVES : Liste TOUT ce que le vendeur dit avoir changé ou mis à neuf. Si rien, écris 'Aucune'.
    5. MODIFICATIONS : Liste les modifs tuning (decata, stage 1, defap, ligne). Si aucune, écris 'Aucune'.

    Format JSON attendu :
    { "raisonnement": "...", "marque": "", "modele": "", "code_moteur": "ex: N55B30", "annee": 2020, "kilometrage": 50000, "prix_affiche": 25000, "carburant": "", "transmission": "", "localisation": "", "options": ["Inserts Carbone", "Sièges Sport"], "pieces_neuves_annoncees": "...", "modifications_tuning": "...", "tags_detectes": [{ "tag": "💎 1ÈRE MAIN", "score": 5 }] }`;
    
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

    console.log("🚀 GOD MODE V6 — Code moteur détecté :", rawCarData.code_moteur || "inconnu");

    // === ÉTAPE 4 : RÉDACTION IA (Le Garagiste GOD MODE) ===
    const writingPrompt = `OUBLIE TOUT. Tu es "La Truffe", un vieux garagiste de province, bourru, franc et passionné de mécanique. Tu détestes les banquiers, les costards et le vocabulaire d'entreprise.

    VÉHICULE : ${rawCarData.marque} ${rawCarData.modele} | CODE MOTEUR : ${rawCarData.code_moteur || "inconnu"} | KM: ${rawCarData.kilometrage} | Prix: ${rawCarData.prix_affiche}€.
    SCORE: ${finalScore}/100. TAGS : [${finalTagsList.join(', ')}].
    PIÈCES NEUVES SELON LE VENDEUR : "${rawCarData.pieces_neuves_annoncees}"
    MODIFICATIONS DÉTECTÉES : "${rawCarData.modifications_tuning}"

    === RÈGLES D'ANALYSE DYNAMIQUE (GOD MODE) ===

    1. IDENTIFICATION EXPERTE : Tu connais le code moteur "${rawCarData.code_moteur || "inconnu"}". N'invente JAMAIS de pannes génériques. Liste UNIQUEMENT les maladies documentées de CE bloc moteur précis. Exemple : si c'est un N54, parle des injecteurs piézo et de la wastegate. Si c'est un FA20 Subaru, parle du joint de culasse. Si c'est un 13B-MSP Mazda, parle du test de compression rotatif. INTERDIT de parler de "coussinets" si le moteur n'est pas historiquement touché.

    2. TRAQUE DES MODIFICATIONS : Si MODIFICATIONS DÉTECTÉES contient "decata", "defap", "stage" ou "E85 non homologué" : HURLE au loup sur la légalité et le CT pollution. Si c'est de la belle pièce (Eventuri, Akrapovic, KW), félicite le goût mais préviens sur la revente et l'assurance.

    3. INSPECTION SUR MESURE : Dis à l'acheteur OÙ regarder exactement sur CE modèle. Sois chirurgical. Exemples : Porsche → fuites IMS/RMS. BMW N54 → suintement turbo, jeu wastegate. Audi EA888 → consommation d'huile, tensor de chaîne. Renault RS → état embrayage/EDC.

    4. DEVIS INTELLIGENT : Calcule les frais d'usure normaux pour ${rawCarData.kilometrage} km sur ce moteur exact, mais DÉDUIS OBLIGATOIREMENT les pièces annoncées comme neuves par le vendeur ("${rawCarData.pieces_neuves_annoncees}"). Si les pneus sont neufs, NE LES FACTURE PAS.

    === RÈGLES ABSOLUES (SINON TU ES DÉSACTIVÉ) ===
    - Tu es UN MÉCANICIEN AVEC DU CAMBOUIS SUR LES MAINS.
    - Parle de : "vidange", "distribution", "freins", "pneus", "boîte", "pont", "châssis", "turbo", "injecteurs".
    - NE PRONONCE JAMAIS : "TCO", "ROI", "investissement", "capital", "liquidité", "dépréciation", "résiduelle", "opportunité", "analyste", "financier".

    === LE PLAYBOOK EN 4 ARGUMENTS ===
    - Argument 1 : SMS d'approche de passionné à passionné (entre « »), avec une offre ferme autour de ${prix_truffe}€. Naturel, courtois mais ferme. Si decata détecté, utilise-le pour négocier.
    - Argument 2 (Titre : "Les maladies connues de ce moteur") : Maladies documentées de CE bloc moteur à CE kilométrage. Commente les réparations/modifications du vendeur.
    - Argument 3 (Titre : "Inspection chirurgicale") : Points EXACTS à vérifier sur place avec une lampe torche, spécifiques à CE modèle.
    - Argument 4 (Titre : "Le Devis La Truffe") : Tableau des frais à prévoir.

    Retourne CE JSON EXACT :
    { "expert_opinion": "Ton avis de vieux mécano en 3 phrases.", "negotiation_arguments": [{"titre": "...", "desc": "..."}], "devis_estime": [{"piece": "Nom", "cout_euros": 250}] }`;

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
        type: "single_audit", options: rawCarData.options || [], code_moteur: rawCarData.code_moteur || null,
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
