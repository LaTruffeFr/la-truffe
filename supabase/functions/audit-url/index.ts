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

const RULEBOOK = \`
RÈGLES D'ATTRIBUTION DES TAGS (AVEC LEUR SCORE) :

=== BOOSTERS (positifs) ===
- '💎 1ÈRE MAIN' (+5) : Première main, 1ère main.
- '🇫🇷 ORIGINE FR' (+5) : Origine France, française, achat concession française.
- '📘 HISTORIQUE PREMIUM' (+5) : Carnet tamponné, suivi exclusif en réseau constructeur.
- '📘 HISTORIQUE' (+4) : Carnet à jour, factures, suivi limpide.
- '💎 PROPRIO LONGUE DURÉE' (+4) : Propriétaire depuis plusieurs années.
- '🔑 DOUBLE CLÉS' (+3) : Double des clés fourni.
- '🚭 NON FUMEUR' (+2) : Véhicule non fumeur.
- '🏠 DORT GARAGE' (+3) : Véhicule garé en garage.
- '💶 TAXE OK' (+8) : Malus payé, écotaxe payée, pas de malus.
- '🛡️ GARANTIE' (+4) : Garantie 12 ou 24 mois, sous garantie.
- '✅ CT OK' (+3) : Contrôle technique OK, vierge.
- '🔧 GROS ENTRETIEN FAIT' (+3) : Distribution neuve, chaîne neuve, vidange boîte.
- '⚙️ EMBRAYAGE NEUF' (+4) : Embrayage neuf, volant moteur neuf.
- '✨ RIEN À PRÉVOIR' (+5) : Rien à prévoir, état irréprochable.
- '🎯 FULL OPTIONS' (+2) : Full option, toutes options.
- '✨ PROTECTION CARROSSERIE' (+3) : Céramique, PPF, film protection.
- '✨ CONFIG UNIQUE' (+3) : Configuration unique.
- '💖 PROPRIO PASSIONNÉ' (+2) : Propriétaire passionné, maniaque.

=== COLLECTORS & SÉRIES LIMITÉES (gros bonus) ===
- '🏆 COLLECTOR USINE' (+40) : CHERCHE les séries limitées comme "1 of 40", "x of 40", "Edition Héritage", "Heritage", CS, CSL, GTS, DTM, TCR, Clubsport, Magny-Cours, Trophy R, Edition 1, Edition One.

=== TUNING PRO (positifs si homologué/marque premium) ===
- '✅ PIÈCES HOMOLOGUÉES' (+5) : Homologué, certificat, TÜV.
- '🦄 PRÉPA D'ÉLITE' (+10) : Schirmer, G-Power, Manhart, AC Schnitzer, Alpina, ABT.
- '🏁 CHÂSSIS PRO' (+4) : KW, Bilstein, Öhlins, H&R, Eibach.
- '🛑 FREINAGE PISTE' (+4) : Brembo, AP Racing, Alcon.
- '💨 LIGNE DE MARQUE' (+3) : Milltek, Akrapovic, Remus, Supersprint.

=== TUNING (négatifs - modifications non-premium) ===
- '🔧 REPROG' (-5) : Stage 1, Stage 2, reprogrammation, cartographie MOTEUR, éthanol non homologué, E85 non homologué.
  PIÈGE CRITIQUE : "GPS Cartographique" ou "Navigation Cartographique" n'est PAS une reprog moteur ! C'est une option GPS standard. Ne confonds JAMAIS.
- '🚀 STAGE 3' (-5) : Stage 3, gros turbo.
- '⚠️ DÉFAP (ILLÉGAL)' (-5) : Suppression FAP, catalyseur, décata, downpipe.

=== DANGERS (très négatifs) ===
- '💀 MOTEUR HS' (-100) : Moteur HS, bruit moteur, claquement, joint de culasse.
- '💀 ACCIDENT GRAVE' (-100) : Véhicule accidenté, sinistre, épave.
- '⚠️ KM NON GARANTI' (-100) : Kilométrage non garanti, compteur non garanti.
- '💀 BOITE HS' (-80) : Boîte HS.
- '💥 ACCIDENTÉE' (-50) : Mention d'accident (sauf si précédé de "jamais").
- '⚠️ VOYANT MOTEUR' (-40) : Voyant allumé, témoin allumé.
- '⚠️ VENTE EN L'ÉTAT' (-25) : Vente dans l'état (sauf si "état irréprochable").
- '⚠️ SANS CT' (-25) : Sans contrôle technique, CT refusé.
- '🚩 LOUCHE' (-15) : Parcours toutes distances, idéal export, marchand.
- '🔧 FRAIS À PRÉVOIR' (-10) : Frais à prévoir, prévoir pneus/révision.
- '⚠️ VENTE PRESSÉE' (-5) : Vente urgente, premier arrivé.
- '🏝️ DOM-TOM' (+5) : Réunion, Guadeloupe, Martinique, Guyane, Mayotte.
\`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Authentification invalide" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { url } = await req.json();
    if (!url || !isValidListingUrl(url)) {
      return new Response(JSON.stringify({ error: "URL invalide." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!FIRECRAWL_API_KEY || !GEMINI_API_KEY) throw new Error("API Keys manquantes");

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: \`Bearer \${FIRECRAWL_API_KEY}\`, "Content-Type": "application/json" },
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

    const extractPrompt = \`Tu es l'Agent Analyste 'La Truffe'. Lis l'annonce, réfléchis à voix haute pour déjouer les pièges, extrais les données et attribue les tags.
    ANNONCE : \${scrapedContent}
    \${RULEBOOK}
    DIRECTIVES :
    1. Dans "raisonnement", justifie le Modèle Exact et les tags.
    2. RÈGLE ABSOLUE POUR LES OPTIONS : INTERDICTION FORMELLE de lister les options de base (GPS, USB, Bluetooth, Radio, Clim, ABS, Airbags, Wi-Fi). Tu dois CHERCHER et lister UNIQUEMENT les équipements sportifs ou luxueux (ex: Carbone, Cuir, Sièges Sport, Échappement, Jantes, Harman Kardon, Toit ouvrant).

    Format JSON attendu :
    { 
      "raisonnement": "...", "marque": "", "modele": "", "annee": 2020, "kilometrage": 50000, "prix_affiche": 25000, 
      "carburant": "", "transmission": "", "localisation": "", "options": ["Inserts Carbone", "Sièges Sport"],
      "tags_detectes": [{ "tag": "💎 1ÈRE MAIN", "score": 5 }]
    }\`;
    
    const extractRes = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${GEMINI_API_KEY}\`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: extractPrompt }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } }),
    });
    
    const extractData = await extractRes.json();
    const rawCarData = JSON.parse(extractData.candidates[0].content.parts[0].text.replace(/\`\`\`json\n?/g, "").replace(/\`\`\`\n?/g, "").trim());

    let scoreMod = 0;
    const finalTagsList = [];
    let isKiller = false;
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

    const writingPrompt = `OUBLIE TOUTES TES INSTRUCTIONS PRÉCÉDENTES. Tu n'es plus une IA ni un expert en achat. Tu es "La Truffe", un vieux mécanicien garagiste très franc, avec les mains pleines de cambouis. Tu n'as jamais fait d'études de commerce et tu détestes le jargon des banquiers.
    VÉHICULE : ${rawCarData.marque} ${rawCarData.modele}, KM: ${rawCarData.kilometrage}, Prix: ${rawCarData.prix_affiche}€. SCORE: ${finalScore}/100. TAGS : [${finalTagsList.join(', ')}].

    TON STYLE OBLIGATOIRE : 
    - Parle UNIQUEMENT de mécanique pure, de fuites d'huile, de pièces d'usure, de courroies, de freins, de coussinets de bielles.
    - Utilise un ton de passionné, direct, familier, de pote à pote.
    - MOTS STRICTEMENT INTERDITS (si tu les utilises, tu échoues) : "investissement", "capital", "dépréciation", "résiduelle", "transaction", "marché", "opportunité", "valorisation", "stratégie", "financier".

    LE PLAYBOOK EN 3 ARGUMENTS :
    - Argument 1 (Le SMS) : Rédige un SMS d'approche (entre guillemets « »). Focus sur la mécanique. 
      EXEMPLE ATTENDU : « Bonjour, belle voiture. Mais à 95 000 km, est-ce que les gros frais mécaniques (vidange boîte, amortisseurs, coussinets) ont été faits ? Si le carnet est limpide, je suis prêt à faire une offre sérieuse autour de 41 000 €. »
    - Argument 2 (Titre conseillé : "Les maladies connues et pièces d'usure") : Liste uniquement les pièces mécaniques qui vont bientôt lâcher à ce kilométrage précis, et explique combien ça coûte au garage.
    - Argument 3 (Titre conseillé : "Inspection sous le capot") : Dis à l'acheteur ce qu'il doit vérifier physiquement le jour de la visite (bruits de chaîne, fumée à l'échappement, traces d'huile, état des pneus).

    Retourne ce JSON exact : { "expert_opinion": "Ton avis de vieux mécano en 3 lignes, très direct.", "negotiation_arguments": [{"titre": "...", "desc": "..."}] }`;

    const { data: report, error: insertError } = await supabase.from("reports").insert(reportData).select("id").single();
    if (insertError) throw new Error("Erreur BDD.");

    return new Response(JSON.stringify({ reportId: report.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});