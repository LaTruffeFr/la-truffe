// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
- '⚠️ MODIFIÉE' (-15) : Cherche "decata", "défap", "stage", "cartographie", "ligne inox".
- '⚠️ NON HOMOLOGUÉ' (-30) : Si 'décata', 'défap', 'reprog', 'stage 1/2', 'ligne inox non homologuée' sont détectés.
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

    const { marque, modele, annee, kilometrage, prix, description } = await req.json();
    if (!marque || !modele || !description) throw new Error("Données incomplètes.");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("Clé API manquante");

    // === ÉTAPE 1 : EXTRACTION IA (GOD MODE) ===
    const extractPrompt = `Tu es un extracteur de données expert. Lis cette description écrite par un vendeur automobile pour une ${marque} ${modele} de ${annee} avec ${kilometrage}km :
    "${description}"
    
    ${RULEBOOK}
    
    Format JSON attendu :
    { 
      "code_moteur_estime": "Devine le code moteur exact (ex: S55, MR16DDT). CRUCIAL.",
      "options_premium": ["Carbone", "Harman Kardon", "Recaro"], 
      "pieces_neuves_annoncees": "Liste TOUT ce que le vendeur dit avoir changé ou mis à neuf. Si rien, écris 'Aucune'.",
      "modifications_tuning": "Liste les modifs illégales ou tuning. Si aucune, écris 'Aucune'.",
      "tags_detectes": [{ "tag": "💎 1ÈRE MAIN", "score": 5 }] 
    }`;
    
    const extractRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: extractPrompt }] }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } }),
    });
    
    const extractData = await extractRes.json();
    const rawCarData = JSON.parse(extractData.candidates[0].content.parts[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

    // === ÉTAPE 2 : SCORING ===
    let scoreMod = 0; const finalTagsList: string[] = []; let isKiller = false;
    for (const item of (rawCarData.tags_detectes || [])) {
      scoreMod += item.score; finalTagsList.push(item.tag);
      if (item.score <= -50) isKiller = true;
    }
    let finalScore = isKiller ? 0 : Math.max(0, Math.min(99, Math.round(60 + scoreMod)));

    // === ÉTAPE 3 : RÉDACTION IA (LA TRUFFE V9 — EXPERT COURTOIS MARKETPLACE) ===
    const writingPrompt = `Tu es "La Truffe", l'expert en mécanique automobile le plus rigoureux et courtois de France. Tu analyses cette voiture POUR NOTRE MARKETPLACE pour rassurer (ou alerter) les futurs acheteurs.

    VÉHICULE : ${marque} ${modele} | MOTEUR : ${rawCarData.code_moteur_estime} | KM : ${kilometrage} | Prix : ${prix}€.
    PIÈCES NEUVES SELON LE VENDEUR : "${rawCarData.pieces_neuves_annoncees}"
    MODIFICATIONS DÉTECTÉES : "${rawCarData.modifications_tuning}"

    CONSIGNES DE LECTURE CRITIQUES :
    1. Lecture Intégrale : Tu as lu CHAQUE LIGNE de la description du vendeur. Ne saute aucun détail.
    2. Détection de Frais Récents : Si le vendeur mentionne une pièce comme 'neuve', 'récente', 'changée' ou avec 'facture', tu ne DOIS PAS l'inclure dans le devis.
    3. Détection de Drapeaux Rouges : Si tu vois 'décata', 'défap', 'reprog', 'stage 1/2', 'ligne inox non homologuée', baisse le score de 30 points minimum et ajoute '⚠️ NON HOMOLOGUÉ'.

    TON ET COMPORTEMENT :
    - Professionnel mais simple : Cite les codes moteurs (${rawCarData.code_moteur_estime}) mais explique simplement pour un néophyte.
    - Courtois et Positif : Reste poli. Même si la voiture est risquée, explique-le avec calme et expertise.
    - Incorruptible : Tu es là pour protéger l'acheteur.

    RÈGLES MÉCANIQUES :
    1. Base-toi UNIQUEMENT sur le code moteur (${rawCarData.code_moteur_estime}). Ne cite que les maladies documentées de CE bloc précis.
    2. Si modifications tuning/décata détectées, préviens les acheteurs du risque légal.
    3. DEVIS : Calcul mathématique strict. Inclus uniquement ce qui est statistiquement nécessaire au kilométrage actuel et que le vendeur n'a PAS déclaré comme fait.

    STRUCTURE DE RÉPONSE :
    - "expert_opinion" : Ton avis global en 3-4 phrases. Commence par saluer l'utilisateur. Sois factuel.
    - "negotiation_arguments" : 3 points :
      * Point 1 (Titre: "L'Avis de La Truffe") : Ton avis direct de mécano sur ce modèle à ce prix.
      * Point 2 (Titre: "Mécanique et Historique") : Les maladies connues de CE moteur et commentaire sur l'entretien.
      * Point 3 (Titre: "Inspection sous le capot") : Ce que l'acheteur devra vérifier lors de la visite.
    - "devis_estime" : Liste des interventions nécessaires avec coûts.
    - "tags" : Maximum 5 tags percutants.

    Retourne CE JSON EXACT : 
    { 
      "expert_opinion": "string", 
      "negotiation_arguments": [{"titre": "...", "desc": "..."}],
      "devis_estime": [{"piece": "Nom de l'intervention", "cout_euros": 250}],
      "score": ${finalScore},
      "tags": ${JSON.stringify(finalTagsList)}
    }`;

    const writingRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: writingPrompt }] }], generationConfig: { temperature: 0.3, responseMimeType: "application/json" } }),
    });

    const writingData = await writingRes.json();
    const finalReview = JSON.parse(writingData.candidates[0].content.parts[0].text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

    return new Response(JSON.stringify(finalReview), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
