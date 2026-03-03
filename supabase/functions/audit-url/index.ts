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
- '⚠️ MODIFIÉE' (-15) : Cherche les mots "decata", "défap", "stage", "cartographie", "ligne inox".
- '⚠️ NON HOMOLOGUÉ' (-30) : Si 'décata', 'défap', 'reprog', 'stage 1/2', 'ligne inox non homologuée' sont détectés.
=== DANGERS (très négatifs) ===
- '💀 MOTEUR HS' (-100)
- '💀 ACCIDENT GRAVE' (-100)
- '⚠️ KM NON GARANTI' (-100)
`;

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // === AUTH ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResponse({ error: "Non autorisé" }, 401);

    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return jsonResponse({ error: "Authentification invalide" }, 401);

    // === SERVICE ROLE CLIENT (bypasses RLS for writes) ===
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // === VÉRIFICATION DES CRÉDITS ===
    const { data: isVip } = await supabaseAdmin.rpc('is_vip', { _user_id: user.id });

    if (!isVip) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (!profile || profile.credits < 1) {
        return jsonResponse({ error: "Crédits insuffisants. Rechargez votre compte pour continuer." }, 402);
      }
    }

    const { url } = await req.json();
    if (!url || !isValidListingUrl(url)) return jsonResponse({ error: "URL invalide. Seuls LeBonCoin, La Centrale et AutoScout24 sont supportés." }, 400);

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!FIRECRAWL_API_KEY || !GEMINI_API_KEY) return jsonResponse({ error: "Configuration serveur incomplète (clés API manquantes)." }, 500);

    // === ÉTAPE 1 : EXTRACTION SÉCURISÉE (avec timeout) ===
    const scrapeController = new AbortController();
    const scrapeTimeout = setTimeout(() => scrapeController.abort(), 30000);

    let scrapeData: any;
    try {
      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["markdown", "html", "screenshot"], onlyMainContent: false, waitFor: 8000 }),
        signal: scrapeController.signal,
      });
      clearTimeout(scrapeTimeout);

      if (!scrapeResponse.ok) {
        const errText = await scrapeResponse.text().catch(() => "");
        console.error("Firecrawl error:", scrapeResponse.status, errText);
        return jsonResponse({ error: "Impossible d'extraire les données de l'annonce. Le site source est peut-être indisponible." }, 502);
      }
      scrapeData = await scrapeResponse.json();
    } catch (fetchErr: any) {
      clearTimeout(scrapeTimeout);
      if (fetchErr.name === 'AbortError') {
        return jsonResponse({ error: "L'extraction de l'annonce a pris trop de temps (timeout 30s). Réessayez." }, 504);
      }
      throw fetchErr;
    }

    const html = scrapeData?.data?.html || scrapeData?.html || "";
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || html;
    const screenshot = scrapeData?.data?.screenshot || scrapeData?.screenshot || null;
    let imageUrl = scrapeData?.data?.metadata?.ogImage || null;
    if (!imageUrl && html) {
      const imgMatch = html.match(/<img[^>]+src=["']([^"']*(?:leboncoin|lbc|slatic|autosc|lacentrale)[^"']*(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i);
      if (imgMatch) imageUrl = imgMatch[1];
    }

    if (!markdown || markdown.length < 50) {
      return jsonResponse({ error: "L'annonce n'a pas pu être lue correctement. Vérifiez le lien et réessayez." }, 422);
    }

    // === ÉTAPE 2 : ANALYSE IA APPROFONDIE ===
    const extractPrompt = `Tu es un extracteur de données expert en automobile. Lis cette annonce :
    ${markdown}
    
    ${RULEBOOK}

    RÈGLES STRICTES :
    1. TITRE ORIGINAL : Tu DOIS extraire le titre EXACT et complet de l'annonce d'origine et le placer dans le champ "original_title". Ne te contente pas de concaténer la marque et le modèle.
    2. RIGUEUR MÉCANIQUE ABSOLUE (Anti-Hallucination) : Tu es un expert automobile intraitable. Ne devine JAMAIS un moteur. Croise l'année, le modèle et la puissance. Par exemple, une Renault Clio 4 RS de 200ch est OBLIGATOIREMENT équipée du 1.6 Turbo (M5M), et SURTOUT PAS du 1.3 TCe (apparu plus tard). En cas de doute, mentionne uniquement la cylindrée standard.
    3. DÉTECTEUR DE MODIFICATIONS (Tuning) : Traque IMPÉRATIVEMENT toute mention de préparation moteur, ligne d'échappement (ex: Akrapovic, Milltek, tube afrique, suppression intermédiaire), ressorts courts, combinés filetés ou reprogrammation (Stage 1/2). Avertis systématiquement des risques d'usure prématurée, de refus au contrôle technique et d'illégalité, et impacte sévèrement le score.
    4. PRIX FERME : Si le texte mentionne "Prix ferme" ou "Non négociable", note-le dans le champ "prix_ferme": true.
    
    Format JSON attendu (Sois ultra précis) :
    { 
      "original_title": "Le titre exact copié depuis l'annonce",
      "marque": "", "modele": "", "annee": 2020, "kilometrage": 50000, "prix_affiche": 25000, "carburant": "", "transmission": "", "localisation": "", 
      "code_moteur_estime": "Devine le code moteur exact (ex: S55, MR16DDT, 2.0 TFSI DAZA). C'est CRUCIAL.",
      "options_premium": ["Carbone", "Harman Kardon", "Recaro"], 
      "pieces_neuves_annoncees": "Liste TOUT ce que le vendeur dit avoir changé ou mis à neuf. Si rien, écris 'Aucune'.",
      "modifications_tuning": "Liste les modifs illégales ou tuning (ex: decata, stage 1, defap). Si aucune, écris 'Aucune'.",
      "prix_ferme": false,
      "tags_detectes": [{ "tag": "💎 1ÈRE MAIN", "score": 5 }] 
    }`;

    const extractRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: extractPrompt }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } }),
    });

    if (!extractRes.ok) {
      console.error("Gemini extraction error:", extractRes.status);
      return jsonResponse({ error: "L'analyse IA a échoué. Réessayez dans quelques instants." }, 502);
    }

    const extractData = await extractRes.json();
    if (!extractData?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error("Gemini returned empty response:", JSON.stringify(extractData));
      return jsonResponse({ error: "L'IA n'a pas pu analyser cette annonce. Essayez avec une autre." }, 422);
    }

    let rawCarData: any;
    try {
      rawCarData = JSON.parse(extractData.candidates[0].content.parts[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch (parseErr) {
      console.error("JSON parse error from Gemini:", parseErr);
      return jsonResponse({ error: "L'IA a renvoyé une réponse mal formatée. Réessayez." }, 422);
    }

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
    const isPrixFerme = rawCarData.prix_ferme === true;

    // === ÉTAPE 4 : RÉDACTION IA (DIAGNOSTIC LA TRUFFE) ===
    const writingPrompt = `Tu es "La Truffe", l'expert en mécanique automobile le plus rigoureux et courtois de France. Ton but est de fournir un audit de confiance pour un acheteur potentiel.

    VÉHICULE : ${rawCarData.marque} ${rawCarData.modele} | MOTEUR : ${rawCarData.code_moteur_estime} | KM : ${rawCarData.kilometrage} | Prix : ${rawCarData.prix_affiche}€.
    PIÈCES NEUVES SELON LE VENDEUR : "${rawCarData.pieces_neuves_annoncees}"
    MODIFICATIONS DÉTECTÉES : "${rawCarData.modifications_tuning}"
    PRIX FERME DÉTECTÉ : ${isPrixFerme ? "OUI" : "NON"}

    CONSIGNES DE LECTURE CRITIQUES :
    1. Lecture Intégrale : Tu as lu CHAQUE LIGNE de la description. Ne saute aucun détail.
    2. Détection de Frais Récents : Si le vendeur mentionne une pièce comme 'neuve', 'récente', 'changée' ou avec 'facture', tu ne DOIS PAS l'inclure dans le devis.
    3. Détection de Drapeaux Rouges : Si tu vois 'décata', 'défap', 'reprog', 'stage 1/2', 'ligne inox non homologuée', baisse le score de 30 points minimum et ajoute '⚠️ NON HOMOLOGUÉ'.

    TON ET COMPORTEMENT :
    - Professionnel mais simple : Cite les codes moteurs (${rawCarData.code_moteur_estime}) mais explique simplement pour un néophyte.
    - Courtois et Positif : Reste poli. Même si la voiture est risquée, explique-le avec calme et expertise.
    - Incorruptible : Tu es là pour protéger l'acheteur.

    RÈGLES MÉCANIQUES ABSOLUES (ANTI-HALLUCINATION) :
    1. Base-toi UNIQUEMENT sur le code moteur (${rawCarData.code_moteur_estime}). Ne cite que les maladies documentées de CE bloc précis.
    2. Ne devine JAMAIS un moteur. Croise l'année, le modèle et la puissance. En cas de doute, mentionne uniquement la cylindrée standard.
    3. Si modifications tuning/décata détectées, préviens du risque légal (contrôle technique, pollution, assurance).
    4. DEVIS : Calcul mathématique strict. Inclus uniquement ce qui est statistiquement nécessaire au kilométrage actuel et que le vendeur n'a PAS déclaré comme fait.

    STRATÉGIE DE NÉGOCIATION & PRIX FERME :
    ${isPrixFerme 
      ? `L'annonce mentionne "Prix ferme". Le SMS de négociation doit être TRÈS diplomatique. Ne propose PAS une baisse de prix agressive de but en blanc. Justifie ton budget maximum uniquement par les frais de remise en conformité ou les entretiens majeurs à venir. Montre de l'intérêt sincère pour le véhicule avant d'aborder le prix.`
      : `Rédige un SMS poli mais assertif avec une offre ferme autour de ${prix_truffe}€.`
    }

    STRUCTURE DE RÉPONSE :
    - "expert_opinion" : Ton avis global en 3-4 phrases. Commence par saluer l'utilisateur. Sois factuel sur l'état et le prix.
    - "negotiation_arguments" : 3 points précis :
      * Point 1 (Titre: "Stratégie d'approche") : Rédige un SMS poli avec une offre autour de ${prix_truffe}€.
      * Point 2 (Titre: "Mécanique et Historique") : Argument mécanique basé sur l'entretien manquant pour ce moteur.
      * Point 3 (Titre: "Inspection sous le capot") : Points d'inspection visuelle à vérifier sur place.
    - "devis_estime" : Liste des interventions nécessaires avec coûts.
    - "tags" : Maximum 5 tags percutants (ex: '🔧 DSG À VIDANGER', '💎 TRÈS PROPRE').

    Retourne CE JSON EXACT : 
    { 
      "expert_opinion": "string", 
      "negotiation_arguments": [{"titre": "...", "desc": "..."}],
      "devis_estime": [{"piece": "Nom de l'intervention", "cout_euros": 250}],
      "tags": ["tag1", "tag2"]
    }`;

    const writingRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: writingPrompt }] }], generationConfig: { temperature: 0.3, responseMimeType: "application/json" } }),
    });

    if (!writingRes.ok) {
      console.error("Gemini writing error:", writingRes.status);
      return jsonResponse({ error: "La rédaction du rapport IA a échoué. Réessayez." }, 502);
    }

    const writingData = await writingRes.json();
    if (!writingData?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return jsonResponse({ error: "L'IA n'a pas pu rédiger le rapport. Réessayez." }, 422);
    }

    let finalReview: any;
    try {
      finalReview = JSON.parse(writingData.candidates[0].content.parts[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      return jsonResponse({ error: "Réponse IA mal formatée lors de la rédaction. Réessayez." }, 422);
    }

    // === ÉTAPE 5 : SAUVEGARDE (via service_role pour bypasser RLS) ===
    const reportData: Record<string, any> = {
      user_id: user.id,
      marque: rawCarData.marque || null,
      modele: rawCarData.modele || null,
      annee: rawCarData.annee || null,
      kilometrage: rawCarData.kilometrage || null,
      prix_affiche: rawCarData.prix_affiche || null,
      prix_estime: prixEstime,
      prix_truffe: prix_truffe,
      lien_annonce: url,
      carburant: rawCarData.carburant || null,
      transmission: rawCarData.transmission || null,
      expert_opinion: finalReview.expert_opinion || null,
      negotiation_arguments: JSON.stringify(finalReview.negotiation_arguments || []),
      status: "completed",
      total_vehicules: 1,
      notes: JSON.stringify(finalReview.devis_estime || []),
      market_data: {
        type: "single_audit",
        original_title: rawCarData.original_title || `${rawCarData.marque} ${rawCarData.modele}`,
        options: rawCarData.options_premium || [],
        etat: finalScore > 75 ? "Excellent" : (finalScore > 50 ? "Bon" : "Moyen"),
        points_forts: finalTagsList.filter((t: string) => !t.includes('⚠️') && !t.includes('💀')),
        points_faibles: finalTagsList.filter((t: string) => t.includes('⚠️') || t.includes('💀')),
        score: finalScore,
        localisation: rawCarData.localisation || null,
        image_url: imageUrl,
        screenshot: screenshot,
        prix_ferme: isPrixFerme,
        code_moteur: rawCarData.code_moteur_estime || null,
        modifications_tuning: rawCarData.modifications_tuning || null,
      },
    };

    const { data: report, error: insertError } = await supabaseAdmin
      .from("reports")
      .insert(reportData)
      .select("id")
      .single();

    if (insertError) {
      console.error("DB insert error:", JSON.stringify(insertError));
      return jsonResponse({ error: "Erreur lors de la sauvegarde du rapport en base de données." }, 500);
    }

    // === ÉTAPE 6 : DÉDUCTION DU CRÉDIT (atomique, via service_role) ===
    if (!isVip) {
      const { data: deducted, error: deductErr } = await supabaseAdmin.rpc('deduct_credit', { _user_id: user.id });
      if (deductErr) console.error("Credit deduction error:", deductErr);
    }

    return jsonResponse({ reportId: report.id });
  } catch (e: any) {
    console.error("audit-url uncaught error:", e);
    return jsonResponse({ error: e?.message || "Erreur interne du serveur. Réessayez." }, 500);
  }
});
