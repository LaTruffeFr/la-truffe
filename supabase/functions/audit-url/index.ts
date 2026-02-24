import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// ================================================================
// KNOWLEDGE_DB & SCORING ENGINE (Ported from vehicleAnalysis.ts)
// ================================================================

const BOOSTERS = [
  { regex: /première main|1ère main|1ere main/i, score: 5, tag: '💎 1ÈRE MAIN' },
  { regex: /origine france|française/i, score: 5, tag: '🇫🇷 ORIGINE FR' },
  { regex: /carnet.*jour|suivi.*limpide|full suivi|factures/i, score: 4, tag: '📘 HISTORIQUE' },
  { regex: /carnet.*tamponné|suivi.*exclusif|entretien.*réseau/i, score: 5, tag: '📘 HISTORIQUE PREMIUM' },
  { regex: /propriétaire depuis.*(ans|année)/i, score: 4, tag: '💎 PROPRIO LONGUE DURÉE' },
  { regex: /double des cl[ée]fs?|2 cl[ée]fs?/i, score: 3, tag: '🔑 DOUBLE CLÉS' },
  { regex: /non fumeur|non-fumeur/i, score: 2, tag: '🚭 NON FUMEUR' },
  { regex: /dort.*garage|stockée.*sec/i, score: 3, tag: '🏠 DORT GARAGE' },
  { regex: /malus payé|écotaxe payée|pas de malus/i, score: 8, tag: '💶 TAXE OK' },
  { regex: /garantie.*(12|24).*mois|sous garantie/i, score: 4, tag: '🛡️ GARANTIE' },
  { regex: /ct ok|contrôle technique ok|vierge/i, score: 3, tag: '✅ CT OK' },
  { regex: /distri.*neuve|chaine.*neuve|vidange.*boite/i, score: 3, tag: '🔧 GROS ENTRETIEN FAIT' },
  { regex: /embrayage.*neuf|volant moteur.*neuf/i, score: 4, tag: '⚙️ EMBRAYAGE NEUF' },
  { regex: /rien à prévoir|état irréprochable/i, score: 5, tag: '✨ RIEN À PRÉVOIR' },
  { regex: /full option|toutes options/i, score: 2, tag: '🎯 FULL OPTIONS' },
  { regex: /céramique|ppf|film protection/i, score: 3, tag: '✨ PROTECTION CARROSSERIE' },
  { regex: /unique|config.*unique/i, score: 3, tag: '✨ CONFIG UNIQUE' },
  { regex: /edition one|edition 1/i, score: 8, tag: '✨ ÉDITION ONE' },
  { regex: /passionné|maniaque/i, score: 2, tag: '💖 PROPRIO PASSIONNÉ' },
];

const TUNING_PRO = [
  { regex: /homologu|certificat|tüv/i, score: 5, tag: '✅ PIÈCES HOMOLOGUÉES' },
  { regex: /mhd|xhp|bootmod|jb4|flexfuel|e85/i, score: 3, tag: '💻 GESTION AVANCÉE' },
  { regex: /milltek|akrapovic|remus|bullx|supersprint|scorpion/i, score: 3, tag: '💨 LIGNE DE MARQUE' },
  { regex: /schirmer|g[- ]power|manhart|ac schnitzer|alpina|abt/i, score: 10, tag: '🦄 PRÉPA D\'ÉLITE' },
  { regex: /kw|bilstein|ohlins|h&r|eibach/i, score: 4, tag: '🏁 CHÂSSIS PRO' },
  { regex: /brembo|ap racing|alcon/i, score: 4, tag: '🛑 FREINAGE PISTE' },
  { regex: /crankhub|poulie|capture plate|renforc/i, score: 5, tag: '🛡️ MÉCANIQUE RENFORCÉE' },
];

const KILLERS = [
  { regex: /moteur hs|bruit moteur|claquement|joint de culasse/i, score: -100, tag: '💀 MOTEUR HS' },
  { regex: /subi.*accident|véhicule accidenté|sinistre|épave/i, score: -100, tag: '💀 ACCIDENT GRAVE' },
  { regex: /(?<!jamais |non |pas d'|pas de |aucun |sans )accident(?!é)/i, score: -50, tag: '💥 ACCIDENTÉE' },
  { regex: /dans l'état(?!.*irréprochable)/i, score: -25, tag: '⚠️ VENTE EN L\'ÉTAT' },
  { regex: /sans ct|contrôle technique.*(refusé|contre)/i, score: -25, tag: '⚠️ SANS CT' },
  { regex: /frais à prévoir|prévoir.*pneus/i, score: -10, tag: '🔧 FRAIS À PRÉVOIR' },
  { regex: /parcours.*toutes distances|idéal export|marchand/i, score: -15, tag: '🚩 LOUCHE' },
  { regex: /vente urgente|premier arrivé/i, score: -5, tag: '⚠️ VENTE PRESSÉE' },
  { regex: /boite hs/i, score: -80, tag: '💀 BOITE HS' },
  { regex: /voyant.*allumé|témoin.*allumé/i, score: -40, tag: '⚠️ VOYANT MOTEUR' },
  { regex: /kilométrage non garanti|compteur non garanti|km non garanti/i, score: -100, tag: '⚠️ KM NON GARANTI' },
];

const TUNING = [
  { regex: /stage 1|stage 2|reprog|carto|éthanol(?!.*homologué)/i, score: -5, tag: '🔧 REPROG' },
  { regex: /stage 3|gros turbo/i, score: -5, tag: '🚀 STAGE 3' },
  { regex: /suppression.*(fap|cata|egr|adblue)|décata|defap|downpipe/i, score: -5, tag: '⚠️ DÉFAP (ILLÉGAL)' },
];

function detectContext(marque: string, modele: string, description: string): string {
  const fullText = `${marque} ${modele} ${description}`.toUpperCase();
  if (/\bRS3\b|\bRS4\b|\bRS5\b|\bTTRS\b/.test(fullText)) return 'AUDI_RS';
  if (/\bM2\b|\bM3\b|\bM4\b/.test(fullText)) return 'BMW_M';
  if (/\bMERCEDES\b|\bAMG\b|\bCLASSE\s*[ABCEGVS]\b/.test(fullText)) return 'MERCEDES';
  if (/\bGTI\b|\bTCR\b|\bCLUBSPORT\b|\bGOLF\b/.test(fullText)) return 'VW_GOLF';
  if (/\bPORSCHE\b/.test(fullText)) return 'PORSCHE';
  return 'GENERIC';
}

interface ScoringResult {
  score: number;
  tags: string[];
  verdict: string;
  coteEstimee: number;
}

function scoreSingleCarBackend(car: {
  marque: string; modele: string; prix: number;
  kilometrage: number; annee: number; description: string;
  options?: string[];
}): ScoringResult {
  const description = (car.description || '') + ' ' + (car.options || []).join(' ');
  const context = detectContext(car.marque, car.modele, description);
  
  let scoreMod = 0;
  const tags = new Set<string>();

  // Clean text
  let cleanText = description
    .replace(/OUVERT DEPUIS \d+ ANS/gi, "")
    .replace(/extension de garantie.*/gi, " ")
    .replace(/financement de \d+ à \d+ mois/gi, " ")
    .replace(/livraison dans toute la france/gi, " ")
    .replace(/non contractuel.*/gi, "")
    .replace(/jamais accident.*/gi, "")
    .replace(/pas d[' ]accident/gi, "")
    .replace(/sans accident/gi, "")
    .replace(/par[- ]choc/gi, "parechoc");

  // DOM-TOM detection
  if (/réunion|reunion|guadeloupe|martinique|guyane|mayotte/i.test(cleanText)) {
    scoreMod += 5; tags.add('🏝️ DOM-TOM');
  }

  // Collector detection
  const titleUpper = `${car.marque} ${car.modele}`.toUpperCase();
  const isFakeCollector = /(STYLE|LOOK|REPLICA|TYPE)\s+.*(GTS|CS|DTM|TCR)/i.test(titleUpper);
  const isRealSpecial = !isFakeCollector && /\bGTS\b|\bDTM\b|\bCS\b|\bCSL\b|\bHERITAGE\b|\bTCR\b|\bCLUBSPORT\b/i.test(titleUpper);
  if (isRealSpecial) { scoreMod += 40; tags.add("🏆 COLLECTOR USINE"); }

  // Scan all rules
  [...BOOSTERS, ...TUNING_PRO, ...KILLERS, ...TUNING].forEach(rule => {
    if (rule.regex.test(cleanText)) { scoreMod += rule.score; tags.add(rule.tag); }
  });

  // Import detection
  const isImport = !cleanText.includes("france") && (cleanText.includes("import") || cleanText.includes("allemagne"));
  const isMalusPaid = /malus payé|écotaxe payée|française|origine france|carte grise fran|immatricul/i.test(cleanText);
  if (isImport && !isMalusPaid) { scoreMod -= 15; tags.add("⚠️ MALUS ?"); }

  // Km adjustment
  let coteRef = car.prix;
  const currentYear = new Date().getFullYear();
  const age = Math.max(1, currentYear - car.annee);
  const kmRef = 15000 * age;

  const isWreck = tags.has("💀 MOTEUR HS") || tags.has("💀 ACCIDENT GRAVE") || tags.has("⚠️ KM NON GARANTI");
  if (car.kilometrage > 0 && !isWreck) {
    if (car.kilometrage < age * 8000) { coteRef *= 1.30; tags.add('💎 PÉPITE KM'); }
    else if (car.kilometrage < kmRef * 0.7) { coteRef *= 1.15; }
    if (car.kilometrage > kmRef * 1.5) { coteRef *= 0.85; }
  }

  // Suspect price
  const ecartPourcent = coteRef > 0 ? ((coteRef - car.prix) / coteRef) * 100 : 0;
  const isElite = tags.has('🦄 PRÉPA D\'ÉLITE') || tags.has('🏆 COLLECTOR USINE') || tags.has('✨ ÉDITION ONE');

  // Base score
  let finalScore = 60 + scoreMod;
  if (ecartPourcent > 35 && !isWreck && !isElite) {
    finalScore = 40; tags.add("🚨 PRIX SUSPECT");
  }
  if (isElite) { finalScore = Math.max(finalScore, 90); tags.delete("🚨 PRIX SUSPECT"); }
  if (isWreck) finalScore = 0;

  finalScore = Math.max(0, Math.min(99, Math.round(finalScore)));

  let verdict = 'Correct';
  if (finalScore >= 80) verdict = 'Excellente affaire';
  else if (finalScore >= 65) verdict = 'Bonne affaire';
  else if (finalScore >= 45) verdict = 'Correct';
  else verdict = 'Risqué';

  return { score: finalScore, tags: Array.from(tags), verdict, coteEstimee: Math.round(coteRef) };
}

// ================================================================
// MAIN HANDLER
// ================================================================

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

    // ============================
    // STEP 0: SCRAPE WITH FIRECRAWL
    // ============================
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Connecteur Firecrawl non configuré" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    if (!imageUrl && html) {
      const imgMatch2 = html.match(/https?:\/\/[^"'\s]+(?:\.jpg|\.jpeg|\.png|\.webp)/i);
      if (imgMatch2) imageUrl = imgMatch2[0];
    }

    const scrapedContent = markdown.length > 200 ? markdown : html;
    if (!scrapedContent || scrapedContent.length < 50) {
      return new Response(JSON.stringify({ error: "Contenu de l'annonce insuffisant." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================
    // STEP 1: EXTRACTION (1st Gemini call - Facts only)
    // ============================
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    console.log("[STEP 1] Extracting facts with Gemini...");
    const extractPrompt = `Tu es un extracteur de données automobile. Lis le contenu de cette annonce et extrais UNIQUEMENT les faits bruts. Ne donne AUCUN avis, AUCUN score, AUCUNE opinion.

Contenu de l'annonce :
${scrapedContent.slice(0, 6000)}

Retourne UNIQUEMENT un JSON valide :
{
  "marque": "string",
  "modele": "string",
  "annee": number|null,
  "kilometrage": number|null,
  "prix_affiche": number|null,
  "carburant": "Diesel|Essence|Hybride|Électrique|null",
  "transmission": "Manuelle|Automatique|null",
  "puissance": "string|null",
  "localisation": "string|null",
  "options": ["liste", "brute", "des", "équipements", "max 15"],
  "description_vendeur": "le texte complet de la description du vendeur, copié tel quel"
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
      return new Response(JSON.stringify({ error: "Erreur lors de l'extraction IA." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractData = await extractResponse.json();
    const extractText = extractData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let facts;
    try {
      facts = JSON.parse(extractText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      console.error("Failed to parse extraction:", extractText.slice(0, 300));
      return new Response(JSON.stringify({ error: "L'IA n'a pas pu lire cette annonce." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[STEP 1] Extracted:", facts.marque, facts.modele, facts.prix_affiche, "€");

    // ============================
    // STEP 2: THE JUDGE (Deterministic Algorithm)
    // ============================
    console.log("[STEP 2] Running deterministic scoring engine...");
    const scoring = scoreSingleCarBackend({
      marque: facts.marque || "Inconnu",
      modele: facts.modele || "Inconnu",
      prix: facts.prix_affiche || 0,
      kilometrage: facts.kilometrage || 0,
      annee: facts.annee || new Date().getFullYear(),
      description: facts.description_vendeur || scrapedContent.slice(0, 3000),
      options: facts.options || [],
    });

    console.log("[STEP 2] Score:", scoring.score, "| Tags:", scoring.tags.join(", "));

    // ============================
    // STEP 3: THE WRITER (2nd Gemini call - Redaction with tags context)
    // ============================
    console.log("[STEP 3] Writing expert opinion with Gemini...");
    const writePrompt = `Tu es un expert automobile français qui rédige des analyses pour des acheteurs.

Voici les données factuelles :
- Véhicule : ${facts.marque} ${facts.modele} de ${facts.annee || 'N/A'}
- Prix affiché : ${facts.prix_affiche ? facts.prix_affiche.toLocaleString() + ' €' : 'N/A'}
- Kilométrage : ${facts.kilometrage ? facts.kilometrage.toLocaleString() + ' km' : 'N/A'}
- Carburant : ${facts.carburant || 'N/A'}
- Localisation : ${facts.localisation || 'N/A'}
- Options notables : ${(facts.options || []).join(', ') || 'Aucune mentionnée'}

Voici le SCORE calculé par notre algorithme : ${scoring.score}/100 (Verdict : ${scoring.verdict})
Voici les TAGS détectés par l'algorithme : ${scoring.tags.join(' | ') || 'Aucun'}

Rédige un JSON avec EXACTEMENT ce format :
{
  "expert_opinion": "3-4 phrases MAX. Commence par le verdict (${scoring.verdict}). Commente les tags détectés. Sois direct et passionné. N'invente PAS de tags ou de données non présentes.",
  "negotiation_playbook": [
    {
      "titre": "Titre de l'argument 1",
      "desc": "Explication concrète. OBLIGATOIRE : termine par un modèle de message entre guillemets français « comme ceci ». Ex: «Bonjour, j'ai vu votre annonce pour la ${facts.marque} ${facts.modele}...»"
    },
    {
      "titre": "Titre de l'argument 2", 
      "desc": "Explication concrète basée sur les tags détectés."
    },
    {
      "titre": "Titre de l'argument 3",
      "desc": "Dernier argument basé sur le marché."
    }
  ]
}

RÈGLES STRICTES :
- Base-toi UNIQUEMENT sur les tags fournis. N'invente rien.
- L'argument de négociation n°1 DOIT contenir un modèle de SMS/email entre « guillemets français ».
- Le texte doit refléter le score : si score > 80, sois enthousiaste. Si < 50, sois prudent.`;

    const writeResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: writePrompt }] }],
        generationConfig: { temperature: 0.5, responseMimeType: "application/json" },
      }),
    });

    let redaction = { expert_opinion: "", negotiation_playbook: [] as any[] };
    if (writeResponse.ok) {
      const writeData = await writeResponse.json();
      const writeText = writeData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      try {
        redaction = JSON.parse(writeText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      } catch {
        console.error("Failed to parse redaction, using fallback");
        redaction.expert_opinion = `Score ${scoring.score}/100 - ${scoring.verdict}. ${scoring.tags.slice(0, 3).join(', ')}.`;
      }
    }

    console.log("[STEP 3] Redaction complete.");

    // ============================
    // SAVE REPORT
    // ============================
    const reportData = {
      user_id: user.id,
      marque: facts.marque || "Inconnu",
      modele: facts.modele || "Inconnu",
      annee: facts.annee || null,
      kilometrage: facts.kilometrage || null,
      prix_affiche: facts.prix_affiche || null,
      prix_estime: scoring.coteEstimee,
      prix_truffe: Math.round(scoring.coteEstimee * 0.92),
      prix_moyen: scoring.coteEstimee,
      lien_annonce: url,
      carburant: facts.carburant || null,
      transmission: facts.transmission || null,
      expert_opinion: redaction.expert_opinion || null,
      negotiation_arguments: JSON.stringify(redaction.negotiation_playbook || []),
      status: "completed" as const,
      total_vehicules: 1,
      market_data: {
        type: "single_audit",
        options: facts.options || [],
        etat: scoring.verdict,
        points_forts: scoring.tags.filter(t => !t.includes('⚠️') && !t.includes('💀') && !t.includes('🚨') && !t.includes('💥') && !t.includes('🔧')),
        points_faibles: scoring.tags.filter(t => t.includes('⚠️') || t.includes('💀') || t.includes('🚨') || t.includes('💥') || t.includes('🔧')),
        tags: scoring.tags,
        resume: `${facts.marque} ${facts.modele} ${facts.annee || ''} — Score ${scoring.score}/100 (${scoring.verdict}).`,
        score: scoring.score,
        localisation: facts.localisation || null,
        image_url: imageUrl || null,
        screenshot: screenshot || null,
        description_vendeur: facts.description_vendeur || null,
        puissance: facts.puissance || null,
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

    return new Response(JSON.stringify({ reportId: report.id, analysis: { ...facts, ...scoring, ...redaction } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("audit-url error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
