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
  PIÈGE : Ne PAS confondre avec "STYLE GTS" ou "LOOK CS" qui sont des répliques.

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
- '💥 ACCIDENTÉE' (-50) : Mention d'accident (sauf si précédé de "jamais", "pas de", "sans", "aucun").
- '⚠️ VOYANT MOTEUR' (-40) : Voyant allumé, témoin allumé.
- '⚠️ VENTE EN L'ÉTAT' (-25) : Vente dans l'état (sauf si "état irréprochable").
- '⚠️ SANS CT' (-25) : Sans contrôle technique, CT refusé.
- '🚩 LOUCHE' (-15) : Parcours toutes distances, idéal export, marchand.
- '🔧 FRAIS À PRÉVOIR' (-10) : Frais à prévoir, prévoir pneus/révision.
- '⚠️ VENTE PRESSÉE' (-5) : Vente urgente, premier arrivé.

=== LOCALISATION ===
- '🏝️ DOM-TOM' (+5) : Réunion, Guadeloupe, Martinique, Guyane, Mayotte.
`;

serve(async (req: Request) => {
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

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!FIRECRAWL_API_KEY || !GEMINI_API_KEY) {
      throw new Error("API Keys manquantes (Firecrawl ou Gemini)");
    }

    // ============================
    // STEP 0: SCRAPE WITH FIRECRAWL
    // ============================
    console.log("[STEP 0] Scraping URL:", url);
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown", "html", "screenshot"], onlyMainContent: false, waitFor: 8000 }),
    });

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeResponse.status);
      return new Response(JSON.stringify({ error: "Impossible de scraper l'annonce. Vérifiez le lien." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
    const html = scrapeData?.data?.html || scrapeData?.html || "";
    const screenshot = scrapeData?.data?.screenshot || scrapeData?.screenshot || null;
    const metadata = scrapeData?.data?.metadata || scrapeData?.metadata || {};

    // Extract image
    let imageUrl = metadata?.ogImage || metadata?.["og:image"] || null;
    if (!imageUrl && html) {
      const imgMatch = html.match(/<img[^>]+src=["']([^"']*(?:leboncoin|lbc|slatic|autosc|lacentrale)[^"']*(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    const scrapedContent = markdown.length > 200 ? markdown : html;
    if (!scrapedContent || scrapedContent.length < 50) {
      return new Response(JSON.stringify({ error: "Contenu de l'annonce insuffisant." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================
    // STEP 1: AGENT ANALYSTE (1er appel Gemini - Chain of Thought)
    // ============================
    console.log("[STEP 1] Agent Analyste - Chain of Thought avec Gemini...");
    const extractPrompt = `Tu es l'Agent Analyste 'La Truffe'. Lis TOUTE l'annonce ci-dessous, réfléchis à voix haute pour déjouer les pièges, extrais les données et attribue les tags.

ANNONCE COMPLÈTE :
${scrapedContent}

${RULEBOOK}

DIRECTIVES STRICTES :
1. Dans "raisonnement", justifie le Modèle Exact. Par exemple : "Je trouve 'M2 Competition Héritage' dans le titre, c'est une série limitée → COLLECTOR USINE".
2. Dans "raisonnement", justifie CHAQUE tag pour éviter les faux-positifs. Par exemple : "Je vois 'GPS Cartographique' → c'est un GPS standard, PAS une reprog moteur. Je ne mets PAS le tag REPROG."
3. Lis l'annonce ENTIÈREMENT, y compris la fin, car les séries limitées et options premium sont souvent cachées tout en bas.
4. RÈGLE ABSOLUE POUR LES OPTIONS : INTERDICTION FORMELLE de lister les options de base (GPS, USB, Bluetooth, Radio, Clim, ABS, Airbags, Wi-Fi). Tu dois CHERCHER et lister UNIQUEMENT les équipements sportifs ou luxueux (ex: Carbone, Cuir, Sièges Sport, Échappement, Jantes, Harman Kardon, Toit ouvrant).
5. N'invente JAMAIS de tags qui ne sont pas dans le RULEBOOK.

Retourne UNIQUEMENT ce JSON valide :
{
  "raisonnement": "Mon analyse détaillée étape par étape...",
  "marque": "string",
  "modele": "string (le modèle exact tel qu'écrit dans l'annonce)",
  "annee": number|null,
  "kilometrage": number|null,
  "prix_affiche": number|null,
  "carburant": "Diesel|Essence|Hybride|Électrique|null",
  "transmission": "Manuelle|Automatique|null",
  "puissance": "string|null",
  "localisation": "string|null",
  "options": ["Inserts Carbone", "Sièges Sport"],
  "description_vendeur": "le texte complet de la description du vendeur, copié tel quel",
  "tags_detectes": [
    { "tag": "NOM DU TAG EXACT", "score": SCORE_NUMERIQUE, "justification": "Pourquoi ce tag" }
  ]
}`;

    const extractResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: extractPrompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    });

    if (!extractResponse.ok) {
      console.error("Gemini extraction error:", extractResponse.status);
      return new Response(JSON.stringify({ error: "Erreur lors de l'analyse IA." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractData = await extractResponse.json();
    const extractText = extractData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let rawCarData: any;
    try {
      rawCarData = JSON.parse(extractText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      console.error("Failed to parse extraction:", extractText.slice(0, 500));
      return new Response(JSON.stringify({ error: "L'IA n'a pas pu lire cette annonce." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[STEP 1] Raisonnement:", rawCarData.raisonnement?.slice(0, 200));
    console.log("[STEP 1] Extracted:", rawCarData.marque, rawCarData.modele, rawCarData.prix_affiche, "€");
    console.log("[STEP 1] Tags détectés:", (rawCarData.tags_detectes || []).map((t: any) => t.tag).join(", "));

    // ============================
    // STEP 2: LE JUGE (Score déterministe basé sur les tags IA)
    // ============================
    console.log("[STEP 2] Calcul du score déterministe...");

    let scoreMod = 0;
    const finalTagsList: string[] = [];
    let isKiller = false;

    for (const item of (rawCarData.tags_detectes || [])) {
      const tagScore = Number(item.score) || 0;
      scoreMod += tagScore;
      finalTagsList.push(item.tag);
      if (tagScore <= -50) isKiller = true;
    }

    // Score final
    let finalScore = isKiller ? 0 : Math.max(0, Math.min(99, Math.round(60 + scoreMod)));

    // Estimation de prix basée sur le score
    const prixAffiche = rawCarData.prix_affiche || 0;
    let prixEstime: number;
    if (finalScore >= 90) prixEstime = Math.round(prixAffiche * 1.15);
    else if (finalScore > 80) prixEstime = Math.round(prixAffiche * 1.08);
    else if (finalScore < 50) prixEstime = Math.round(prixAffiche * 0.85);
    else prixEstime = Math.round(prixAffiche * 0.95);

    let verdict = "Correct";
    if (finalScore >= 80) verdict = "Excellente affaire";
    else if (finalScore >= 65) verdict = "Bonne affaire";
    else if (finalScore >= 45) verdict = "Correct";
    else verdict = "Risqué";

    console.log("[STEP 2] Score:", finalScore, "| Verdict:", verdict, "| Tags:", finalTagsList.join(", "));

    // ============================
    // STEP 3: LE RÉDACTEUR (2ème appel Gemini - Playbook)
    // ============================
    console.log("[STEP 3] Rédaction du playbook avec Gemini...");
    const writingPrompt = `Tu es "La Truffe", un mécanicien passionné et un expert en achat de voitures de sport. Ton rôle est de conseiller un ami acheteur pour qu'il ne se fasse pas avoir.
    VÉHICULE : ${rawCarData.marque} ${rawCarData.modele}, KM: ${rawCarData.kilometrage}, Prix: ${rawCarData.prix_affiche}€. SCORE: ${finalScore}/100. TAGS : [${finalTagsList.join(', ')}].

    TON STYLE OBLIGATOIRE : 
    - Parle comme un vrai gars de l'automobile : utilise un vocabulaire de garage et de passionné (usure, vidange, maladie connue du moteur, coussinets, freins, etc.).
    - BANNIS DÉFINITIVEMENT TOUT JARGON FINANCIER. Mots strictement INTERDITS : "ROI", "TCO", "investissement", "optimisation", "capital", "liquidité", "dépréciation", "stratégie", "chirurgicale". Si tu utilises un de ces mots, c'est un échec.
    - Sois détendu, franc, mais intraitable sur la mécanique.

    LE PLAYBOOK EN 3 POINTS :
    - L'argument 1 DOIT impérativement être un SMS d'approche à copier-coller, entre guillemets (« »). Le SMS doit être sympa, naturel, de passionné à passionné. Interdiction d'être arrogant.
      EXEMPLE DE SMS ATTENDU : « Bonjour, superbe M4 ! Vu le kilométrage, est-ce que les gros entretiens (vidange boîte DKG, freins) ont été faits récemment ? Si l'historique est limpide, je suis prêt à vous faire une offre sérieuse autour de 41 000 €. Bonne journée ! »
    - Argument 2 et 3 : Parle des points faibles mécaniques liés au modèle et au kilométrage, des frais à venir, et de ce qu'il faut vérifier sur place.

    Retourne ce JSON exact : { "expert_opinion": "Ton avis de mécanicien franc et direct en 3 lignes", "negotiation_arguments": [{"titre": "...", "desc": "..."}] }`;

    const writeResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: writingPrompt }] }],
        generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
      }),
    });

    let finalReview = { expert_opinion: "", negotiation_arguments: [] as any[] };
    if (writeResponse.ok) {
      const writeData = await writeResponse.json();
      const writeText = writeData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      try {
        finalReview = JSON.parse(writeText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      } catch {
        console.error("Failed to parse redaction, using fallback");
        finalReview.expert_opinion = `Score ${finalScore}/100 — ${verdict}. ${finalTagsList.slice(0, 3).join(', ')}.`;
      }
    }

    console.log("[STEP 3] Rédaction terminée.");

    // ============================
    // SAVE REPORT
    // ============================
    const reportData = {
      user_id: user.id,
      marque: rawCarData.marque || "Inconnu",
      modele: rawCarData.modele || "Inconnu",
      annee: rawCarData.annee || null,
      kilometrage: rawCarData.kilometrage || null,
      prix_affiche: prixAffiche || null,
      prix_estime: prixEstime,
      prix_truffe: Math.round(prixEstime * 0.95),
      prix_moyen: prixEstime,
      lien_annonce: url,
      carburant: rawCarData.carburant || null,
      transmission: rawCarData.transmission || null,
      expert_opinion: finalReview.expert_opinion || null,
      negotiation_arguments: JSON.stringify(finalReview.negotiation_arguments || []),
      status: "completed" as const,
      total_vehicules: 1,
      market_data: {
        type: "single_audit",
        options: rawCarData.options || [],
        etat: verdict,
        points_forts: finalTagsList.filter((t: string) => !t.includes('⚠️') && !t.includes('🚨') && !t.includes('💀') && !t.includes('💥') && !t.includes('🔧')),
        points_faibles: finalTagsList.filter((t: string) => t.includes('⚠️') || t.includes('🚨') || t.includes('💀') || t.includes('💥') || t.includes('🔧')),
        tags: finalTagsList,
        resume: `${rawCarData.marque} ${rawCarData.modele} ${rawCarData.annee || ''} — Score ${finalScore}/100 (${verdict}).`,
        score: finalScore,
        localisation: rawCarData.localisation || null,
        image_url: imageUrl || null,
        screenshot: screenshot || null,
        description_vendeur: rawCarData.description_vendeur || null,
        puissance: rawCarData.puissance || null,
        raisonnement_ia: rawCarData.raisonnement || null,
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

    console.log("[DONE] Report created:", report.id);

    return new Response(JSON.stringify({ reportId: report.id, analysis: { ...rawCarData, score: finalScore, verdict, tags: finalTagsList, ...finalReview } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: unknown) {
    console.error("audit-url error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
