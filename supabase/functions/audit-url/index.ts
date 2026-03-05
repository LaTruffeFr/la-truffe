// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_DOMAINS = ["leboncoin.fr", "lacentrale.fr", "autoscout24.", "mobile.de"];

function isValidListingUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return SUPPORTED_DOMAINS.some(d => parsed.hostname.includes(d));
  } catch { return false; }
}

const RULEBOOK = `
RÈGLES D'ATTRIBUTION DES TAGS (AVEC LEUR SCORE) :
=== BOOSTERS (positifs) ===
- '💎 1ÈRE MAIN' (+10)
- '🇫🇷 ORIGINE FR' (+5)
- '📘 HISTORIQUE PREMIUM' (+12)
- '📘 HISTORIQUE' (+6)
- '💶 TAXE OK' (+5)
- '🛡️ GARANTIE' (+8)
- '✅ CT OK' (+5)
- '🔧 GROS ENTRETIEN FAIT' (+8)
=== TUNING / PRÉPARATION ===
- '🔩 PRÉPARÉE' (+0 à -10) : Stage 1/2, reprog, ligne inox, décata. Score neutre si pièces reconnues (Akrapovic, MHD, Wagner, etc.), sinon malus.
- '⚠️ NON HOMOLOGUÉ' (-15) : Si décata, défap, ou pièces non homologuées détectées. Avertissement légal obligatoire mais PAS de chiffrage du rachat catalyseur.
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
    const { data: rolesData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'vip']);

    const userRoles = (rolesData || []).map((r: any) => r.role);
    const hasUnlimitedCredits = userRoles.includes('admin') || userRoles.includes('vip');

    if (!hasUnlimitedCredits) {
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
    if (!url || !isValidListingUrl(url)) return jsonResponse({ error: "URL invalide. Seuls LeBonCoin, La Centrale, AutoScout24 et Mobile.de sont supportés." }, 400);

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!FIRECRAWL_API_KEY || !GEMINI_API_KEY) return jsonResponse({ error: "Configuration serveur incomplète (clés API manquantes)." }, 500);

    // === ÉTAPE 1 : EXTRACTION SÉCURISÉE (avec timeout et params adaptés par site) ===
    const scrapeController = new AbortController();
    const scrapeTimeout = setTimeout(() => scrapeController.abort(), 45000);

    // Detect platform for optimized scraping
    const parsedUrl = new URL(url);
    const isLeBonCoin = parsedUrl.hostname.includes('leboncoin.fr');
    const isLaCentrale = parsedUrl.hostname.includes('lacentrale.fr');
    const isAutoScout = parsedUrl.hostname.includes('autoscout24');
    const isMobileDe = parsedUrl.hostname.includes('mobile.de');

    // Longer wait for JS-heavy sites
    const waitTime = isLeBonCoin ? 8000 : 15000;

    let scrapeData: any;
    try {
      const scrapeBody: any = {
        url,
        formats: ["markdown", "html", "screenshot"],
        onlyMainContent: false,
        waitFor: waitTime,
      };

      // For non-LBC sites, add location to avoid geo-blocking
      if (isMobileDe) {
        scrapeBody.location = { country: "DE", languages: ["de", "fr"] };
      } else if (isAutoScout && !parsedUrl.hostname.includes('.fr')) {
        scrapeBody.location = { country: "DE", languages: ["de", "fr"] };
      }

      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(scrapeBody),
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
        return jsonResponse({ error: "L'extraction de l'annonce a pris trop de temps (timeout 45s). Réessayez." }, 504);
      }
      throw fetchErr;
    }

    const html = scrapeData?.data?.html || scrapeData?.html || "";
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || html;
    const screenshot = scrapeData?.data?.screenshot || scrapeData?.screenshot || null;
    const metadataTitle = scrapeData?.data?.metadata?.title || scrapeData?.metadata?.title || "";
    const metadataDesc = scrapeData?.data?.metadata?.description || scrapeData?.metadata?.description || "";

    // Image extraction with site-specific patterns
    let imageUrl = scrapeData?.data?.metadata?.ogImage || scrapeData?.metadata?.ogImage || null;
    if (!imageUrl && html) {
      const imgPatterns = [
        /<img[^>]+src=["']([^"']*(?:leboncoin|lbc|slatic)[^"']*(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i,
        /<img[^>]+src=["']([^"']*(?:lacentrale|lfrmedias)[^"']*(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i,
        /<img[^>]+src=["']([^"']*(?:autoscout24|as24)[^"']*(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i,
        /<img[^>]+src=["']([^"']*(?:mobile\.de|img\.classistatic)[^"']*(?:\.jpg|\.jpeg|\.png|\.webp)[^"']*)["']/i,
        /<img[^>]+src=["'](https?:\/\/[^"']*(?:\.jpg|\.jpeg|\.png|\.webp))[^"']*["']/i,
      ];
      for (const pattern of imgPatterns) {
        const match = html.match(pattern);
        if (match) { imageUrl = match[1]; break; }
      }
    }

    // Combine all available text for better extraction
    const fullContent = [markdown, metadataTitle, metadataDesc].filter(Boolean).join("\n\n");
    console.log(`Scrape result for ${parsedUrl.hostname}: markdown=${markdown?.length || 0} chars, html=${html?.length || 0} chars, meta_title="${metadataTitle}"`);

    if (!fullContent || fullContent.length < 30) {
      return jsonResponse({ error: "L'annonce n'a pas pu être lue correctement. Vérifiez le lien et réessayez." }, 422);
    }

    // === ÉTAPE 2 : ANALYSE IA APPROFONDIE ===
    const platformHint = isLaCentrale ? "La Centrale (France)" 
      : isAutoScout ? "AutoScout24 (Europe)" 
      : isMobileDe ? "Mobile.de (Allemagne — le texte peut être en allemand, traduis tout en français)"
      : "LeBonCoin (France)";

    const extractPrompt = `Tu es un extracteur de données expert en automobile. Cette annonce provient de ${platformHint}.

    CONTENU DE L'ANNONCE :
    ${fullContent}
    
    ${RULEBOOK}

    RÈGLES STRICTES :
    1. TITRE ORIGINAL : Tu DOIS extraire le titre EXACT et complet de l'annonce d'origine et le placer dans le champ "original_title". Ne te contente pas de concaténer la marque et le modèle.
    2. MULTI-PLATEFORME : L'annonce peut provenir de LeBonCoin, La Centrale, AutoScout24 ou Mobile.de. Elle peut être en français, allemand, italien, etc. TRADUIS et EXTRAIS toutes les informations en français. Les prix peuvent être en EUR (€). Les kilométrages peuvent être en "km" ou "Kilometerstand".
    3. RIGUEUR MÉCANIQUE ABSOLUE (Anti-Hallucination) : Tu es un expert automobile intraitable. Ne devine JAMAIS un moteur. Croise l'année, le modèle et la puissance. Par exemple, une Renault Clio 4 RS de 200ch est OBLIGATOIREMENT équipée du 1.6 Turbo (M5M), et SURTOUT PAS du 1.3 TCe (apparu plus tard). En cas de doute, mentionne uniquement la cylindrée standard.
    4. DÉTECTEUR DE MODIFICATIONS (Tuning) : Traque IMPÉRATIVEMENT toute mention de préparation moteur, ligne d'échappement (ex: Akrapovic, Milltek, tube afrique, suppression intermédiaire), ressorts courts, combinés filetés ou reprogrammation (Stage 1/2). Liste-les TOUTES dans "modifications_tuning". Distingue les pièces de marques reconnues (Akrapovic, KW, Wagner, Eventuri, MHD) des modifications artisanales.
    5. PRIX FERME : Si le texte mentionne "Prix ferme", "Non négociable" ou "Festpreis", note-le dans le champ "prix_ferme": true.
    6. ÉQUIPEMENTS CLÉS : Dans le tableau "options_premium", tu DOIS lister la finition (ex: S-line), les options d'usine (ex: Cuir, Toit ouvrant), les modifications esthétiques/mécaniques (ex: Silencieux, Jantes) ET les ajouts technologiques (ex: Apple CarPlay, Écran Android, Caméra de recul).
    7. OBLIGATION DE RÉSULTAT : Tu DOIS ABSOLUMENT remplir les champs "marque" et "modele" même si l'annonce est partiellement lisible. Déduis-les du titre, de l'URL, ou des caractéristiques techniques. Ne renvoie JAMAIS une marque ou un modèle vide.
    
    Format JSON attendu (Sois ultra précis) :
    { 
      "original_title": "Le titre exact copié depuis l'annonce",
      "marque": "MARQUE EN MAJUSCULES (ex: BMW, VOLKSWAGEN, AUDI)", 
      "modele": "Modèle précis (ex: Golf GTI, M4 Competition, RS3)", 
      "annee": 2020, "kilometrage": 50000, "prix_affiche": 25000, "carburant": "", "transmission": "", "localisation": "", 
      "code_moteur_estime": "Devine le code moteur exact (ex: S55, MR16DDT, 2.0 TFSI DAZA). C'est CRUCIAL.",
      "options_premium": ["Finition S-line", "Silencieux sport", "Jantes noires", "Vitres teintées"], 
      "pieces_neuves_annoncees": "Liste TOUT ce que le vendeur dit avoir changé ou mis à neuf. Si rien, écris 'Aucune'.",
      "modifications_tuning": "Liste les modifs illégales ou tuning (ex: decata, stage 1, defap). Si aucune, écris 'Aucune'.",
      "prix_ferme": false,
      "market_range": "Fourchette de prix réaliste sur le marché de l'occasion pour ce modèle/année/km (ex: '32 000 € - 34 000 €')",
      "reliability_score": 7,
      "known_issues": ["Maladie chronique 1", "Maladie chronique 2", "Maladie chronique 3"],
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

    // Fallback: try to extract marque/modele from URL if Gemini returned empty
    if (!rawCarData.marque || !rawCarData.modele) {
      console.warn("Gemini failed to extract marque/modele, attempting URL fallback");
      // AutoScout24 URLs contain brand-model: /offres/volkswagen-golf-gti-...
      const urlPath = parsedUrl.pathname.toLowerCase();
      const autoScoutMatch = urlPath.match(/\/offres\/([a-z-]+?)-([\w-]+?)(?:-essence|-diesel|-electrique|-hybride)/);
      if (autoScoutMatch) {
        if (!rawCarData.marque) rawCarData.marque = autoScoutMatch[1].replace(/-/g, ' ').toUpperCase();
        if (!rawCarData.modele) rawCarData.modele = autoScoutMatch[2].replace(/-/g, ' ');
      }
      // Mobile.de - extract from meta title
      if ((!rawCarData.marque || !rawCarData.modele) && metadataTitle) {
        const titleParts = metadataTitle.split(/[-–|]/);
        if (titleParts.length > 0) {
          const firstPart = titleParts[0].trim();
          const words = firstPart.split(/\s+/);
          if (words.length >= 2 && !rawCarData.marque) {
            rawCarData.marque = words[0].toUpperCase();
            rawCarData.modele = words.slice(1).join(' ');
          }
        }
      }
    }

    console.log("Extracted car data:", JSON.stringify({ marque: rawCarData.marque, modele: rawCarData.modele, prix: rawCarData.prix_affiche, km: rawCarData.kilometrage }));

    let scoreMod = 0; const finalTagsList: string[] = []; let isKiller = false;
    for (const item of (rawCarData.tags_detectes || [])) {
      scoreMod += item.score; finalTagsList.push(item.tag);
      if (item.score <= -50) isKiller = true;
    }
    let finalScore = isKiller ? 0 : Math.max(0, Math.min(99, Math.round(68 + scoreMod)));
    let prixAffiche = Number(rawCarData.prix_affiche) || 0;
    let prixEstime = prixAffiche;
    if (prixAffiche > 0) {
      if (finalScore >= 90) prixEstime = Math.round(prixAffiche * 1.15);
      else if (finalScore > 80) prixEstime = Math.round(prixAffiche * 1.08);
      else if (finalScore < 50) prixEstime = Math.round(prixAffiche * 0.85);
      else prixEstime = Math.round(prixAffiche * 0.95);
    }

    const prix_truffe = Math.round(prixEstime * 0.95);
    const isPrixFerme = rawCarData.prix_ferme === true;

    // === ÉTAPE 4 : RÉDACTION IA (DIAGNOSTIC LA TRUFFE V10) ===
    const writingPrompt = `Tu es "La Truffe", l'expert en mécanique automobile le plus rigoureux et courtois de France. Tu t'adresses à des passionnés ET des néophytes.

    VÉHICULE : ${rawCarData.marque} ${rawCarData.modele} | BOÎTE : ${rawCarData.transmission || 'Inconnue'} | MOTEUR : ${rawCarData.code_moteur_estime} | KM : ${rawCarData.kilometrage} | Prix affiché : ${prixAffiche}€.
    PIÈCES NEUVES SELON LE VENDEUR : "${rawCarData.pieces_neuves_annoncees}"
    MODIFICATIONS DÉTECTÉES : "${rawCarData.modifications_tuning}"
    OPTIONS PREMIUM : ${JSON.stringify(rawCarData.options_premium || [])}
    PRIX FERME DÉTECTÉ : ${isPrixFerme ? "OUI" : "NON"}

    === RÈGLE 1 : ÉVALUATION DU PRIX (LE JUSTE PRIX DU MARCHÉ) ===
    N'utilise JAMAIS le prix du vendeur comme base absolue. Estime d'abord la vraie valeur de CE véhicule d'ORIGINE sur le marché français (selon modèle exact, année, kilométrage, motorisation). Compare ensuite le prix affiché à cette estimation. Indique clairement si le prix est au-dessus, en-dessous ou au niveau du marché.

    === RÈGLE 2 : GESTION DU TUNING (VALORISATION PASSIONNÉ) ===
    Si la voiture possède des pièces de performance RECONNUES (Akrapovic, Wagner, Eventuri, combinés filetés KW/Bilstein/Öhlins, Stage MHD/Bootmod3, intercooler upgraded, charge pipe alu, ligne Milltek/Scorpion), NE CALCULE PAS de frais de remise à l'origine dans le devis. Considère-les comme une PLUS-VALUE pour un passionné et mentionne leur valeur ajoutée. Le devis ne doit contenir QUE les interventions d'entretien/fiabilisation nécessaires.

    === RÈGLE 3 : ENTRETIEN SÉVÉRISÉ (VOITURES PRÉPARÉES OU FORT KM) ===
    Si la voiture est préparée (Stage 1/2, reprog) OU fort kilométrée (>80 000 km pour sportive, >120 000 km pour standard), ajoute OBLIGATOIREMENT au devis les frais préventifs suivants si non déclarés comme faits :
    - Vidange de boîte : Ne propose cette intervention QUE si la BOÎTE est "Automatique" (ex: ZF8, DSG). Si la BOÎTE est "Manuelle", NE PROPOSE SURTOUT PAS de vidange de boîte dans le devis.
    - Bougies et bobines d'allumage
    - Fiabilisation spécifique au modèle (ex: charge pipe alu pour N55/B58 BMW, chaîne de distribution pour EA888, etc.)
    - Liquide de frein + purge (surtout si usage circuit mentionné)

    === RÈGLE 4 : LÉGALITÉ (DISCOURS PASSIONNÉ) ===
    Si des modifications non homologuées sont détectées (décata, défap, ligne non homologuée) :
    - Avertis l'acheteur des risques RÉELS : refus CT, problème assurance en cas de sinistre
    - Adapte le discours pour un passionné : reste factuel, pas moralisateur
    - NE CHIFFRE PAS le rachat d'un catalyseur neuf ou d'une remise en conformité dans le devis
    - Mentionne simplement le risque comme note informative

    CONSIGNES DE LECTURE :
    1. Lecture Intégrale : Tu as lu CHAQUE LIGNE de la description. Ne saute aucun détail.
    2. Détection de Frais Récents : Si le vendeur mentionne une pièce comme 'neuve', 'récente', 'changée' ou avec 'facture', tu ne DOIS PAS l'inclure dans le devis.

    TON ET COMPORTEMENT :
    - Expert passionné : Tu parles comme un mécano qui aime les belles voitures. Cite les codes moteurs mais explique simplement.
    - Courtois et honnête : Même si la voiture est risquée, explique-le avec calme.
    - Incorruptible : Tu protèges l'acheteur tout en respectant le travail du préparateur.

    RÈGLES MÉCANIQUES ABSOLUES (ANTI-HALLUCINATION) :
    1. Base-toi UNIQUEMENT sur le code moteur (${rawCarData.code_moteur_estime}). Ne cite que les maladies documentées de CE bloc précis.
    2. Ne devine JAMAIS un moteur. Croise l'année, le modèle et la puissance. En cas de doute, mentionne uniquement la cylindrée standard.

    STRATÉGIE DE NÉGOCIATION :
    - Analyse le profil du vendeur. S'il se dit "passionné", "minutieux" ou refuse les "pros", rédige le SMS d'approche (Stratégie d'approche) sur un ton amical, de passionné à passionné, en le rassurant sur le fait que la voiture sera entre de bonnes mains, tout en justifiant fermement la baisse de prix par la mécanique.
    ${isPrixFerme 
      ? `- L'annonce mentionne "Prix ferme". Le SMS de négociation doit être TRÈS diplomatique. Justifie uniquement par les frais d'entretien préventif à venir. Montre de l'intérêt sincère avant d'aborder le prix.`
      : `- Rédige un SMS poli mais assertif avec une offre autour de ${prix_truffe}€, justifiée par les frais d'entretien identifiés.`
    }

    STRUCTURE DE RÉPONSE :
    - "expert_opinion" : Ton avis global en 3-4 phrases. Commence par saluer l'utilisateur. Inclus ton estimation de la valeur marché d'origine et compare au prix affiché.
    - "negotiation_arguments" : 3 points précis :
      * Point 1 (Titre: "Stratégie d'approche") : SMS de négociation adapté.
      * Point 2 (Titre: "Mécanique et Historique") : Maladies connues de CE moteur + commentaire entretien.
      * Point 3 (Titre: "Inspection sous le capot") : Points d'inspection à vérifier sur place.
    - "devis_estime" : UNIQUEMENT les interventions d'entretien/fiabilisation nécessaires. PAS de remise en conformité légale.
    - "tags" : Maximum 5 tags percutants.

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
      marque: rawCarData.marque || "Inconnue",
      modele: rawCarData.modele || "Inconnu",
      annee: rawCarData.annee || null,
      kilometrage: rawCarData.kilometrage || null,
      prix_affiche: prixAffiche || null,
      prix_estime: prixEstime || null,
      prix_truffe: prix_truffe || null,
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
        market_range: rawCarData.market_range || null,
        reliability_score: rawCarData.reliability_score || null,
        known_issues: rawCarData.known_issues || [],
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
    if (!hasUnlimitedCredits) {
      const { data: deducted, error: deductErr } = await supabaseAdmin.rpc('deduct_credit', { _user_id: user.id });
      if (deductErr) console.error("Credit deduction error:", deductErr);
    }

    return jsonResponse({ reportId: report.id });
  } catch (e: any) {
    console.error("audit-url uncaught error:", e);
    return jsonResponse({ error: e?.message || "Erreur interne du serveur. Réessayez." }, 500);
  }
});
