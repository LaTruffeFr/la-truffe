import { ParsedVehicle, VehicleWithScore } from "./csvParser";

// ============================================
// 1. CONFIGURATION "CERVEAU GLOBAL"
// ============================================

export type ExpertTag = string;

export interface MissionRules {
  requiredKeywords?: string[];
  bannedKeywords?: string[];
  boostKeywords?: { word: string; score: number }[];
  ignoreMileage?: boolean;
}

interface ModelRules {
  generations?: { start: number; end: number; tag: string; score?: number }[];
  rules: { regex: RegExp; score: number; tag: string }[];
}

const KNOWLEDGE_DB: Record<string, any> = {
  // 🟢 BOOSTERS UNIVERSELS
  BOOSTERS: [
    { regex: /première main|1ère main|1ere main/i, score: 5, tag: '💎 1ÈRE MAIN' },
    { regex: /origine france|achat concession fran|française/i, score: 5, tag: '🇫🇷 ORIGINE FR' },
    { regex: /carnet.*jour|suivi.*limpide|full suivi|factures/i, score: 4, tag: '📘 HISTORIQUE' },
    { regex: /carnet.*tamponné|suivi.*exclusif|entretien.*réseau/i, score: 5, tag: '📘 HISTORIQUE PREMIUM' },
    { regex: /malus payé|écotaxe payée|pas de malus/i, score: 8, tag: '💶 TAXE OK' },
    { regex: /garantie.*(12|24).*mois/i, score: 3, tag: '🛡️ GARANTIE' },
    { regex: /tva récup|tva récuperable/i, score: 2, tag: '🏢 TVA DÉDUCTIBLE' },
    { regex: /distri.*neuve|chaine.*neuve|vidange.*boite/i, score: 3, tag: '🔧 ENTRETENUE' },
    { regex: /embrayage.*neuf|volant moteur.*neuf/i, score: 4, tag: '⚙️ EMBRAYAGE NEUF' },
    { regex: /disques.*plaquettes.*neufs|freins.*neufs/i, score: 2, tag: '🛑 FREINS NEUFS' },
    { regex: /full option|toutes options/i, score: 3, tag: '🎯 FULL OPTIONS' },
    { regex: /céramique|ceramique|ppf|film protection/i, score: 2, tag: '✨ SOIGNÉE' },
    { regex: /temps de chauffe|jamais circuit|usage promenade/i, score: 3, tag: '✨ CONDUITE SOIGNÉE' },
    { regex: /ct ok|pneus neufs/i, score: 2, tag: '✅ CT OK' },
    { regex: /coussinets/i, score: 5, tag: '⚙️ COUSSINETS FAITS' },
    { regex: /flexfuel.*homologué|boitier.*homologué|carte grise.*gratuite/i, score: 3, tag: '⛽ ÉTHANOL HOMOLOGUÉ' },
    { regex: /rien à prévoir|aucun frais|état irréprochable|état concours/i, score: 5, tag: '✨ RIEN À PRÉVOIR' },
    { regex: /alarme|anti[- ]vol|tracker|geolocalisation/i, score: 2, tag: '🛡️ SÉCURITÉ VOL' }, // Pour la TCR
    { regex: /dort.*garage|stockée.*sec|sous housse/i, score: 3, tag: '🏠 DORT GARAGE' }, // Pour la Clubsport
  ],

  // 🔵 TUNING PRO & PIÈCES DE MARQUE (V4.5 - Liste Complète)
  TUNING_PRO: [
    // LÉGALITÉ
    { regex: /homologu|certificat|tüv/i, score: 5, tag: '✅ PIÈCES HOMOLOGUÉES' },
    
    // ÉCHAPPEMENT
    { regex: /milltek|akrapovic|remus|bullx|arp|supersprint|scorpion/i, score: 3, tag: '💨 LIGNE DE MARQUE' },
    
    // PRÉPARATEURS RECONNUS
    { regex: /br[- ]performance|shiftech|o2|digiservices|mrc|ksf|jd ingineering/i, score: 2, tag: '🔧 PRÉPA CONNUE' },
    
    // CHÂSSIS & ESTHÉTIQUE
    { regex: /kw|bilstein|ohlins|fox|h&r|eibach|st sus|vwr|volkswagen racing/i, score: 3, tag: '🏁 CHÂSSIS SPORT' },
    { regex: /maxton|zaero|rieger|oettinger/i, score: 2, tag: '✨ KIT CARROSSERIE' }, // Maxton valorisé
    { regex: /covering|ppf|film protection/i, score: 2, tag: '🎨 PROTECT CARROSSERIE' },
    
    // MOTEUR & FREINAGE (PERFORMANCE)
    { regex: /r600|racingline|apr|wagner|forge|eventuri|cts|airtek|airtec/i, score: 3, tag: '🌬️ ADMISSION PERF' },
    { regex: /loba|tte|is38|the turbo/i, score: 2, tag: '🐌 TURBO/POMPE PERF' }, // Loba/IS38 reconnus
    { regex: /brembo|ap racing|alcon|étriers?.*(rs|macan|porsche)/i, score: 4, tag: '🛑 GROS FREINS' } // Brembo valorisé
  ],

  // 🔴 TUEURS UNIVERSELS
  KILLERS: [
    { regex: /moteur hs|bruit moteur|claquement|joint de culasse|bielle.*coulée|bruit.*bielle/i, score: -100, tag: '💀 MOTEUR HS' },
    // Anti Faux-Positifs
    { regex: /(?<!jamais |non |pas d'|pas de |aucun )accident(?!é)/i, score: -50, tag: '💥 ACCIDENTÉE' },
    { regex: /(?<!par[-e\s]?)choc(?!\s*absorb)/i, score: -30, tag: '💥 TRACE DE CHOC' },
    { regex: /vge|marbre|procédure|épave/i, score: -50, tag: '💥 ACCIDENTÉE' },
    { regex: /dans l'état(?!.*irréprochable)/i, score: -25, tag: '⚠️ VENTE EN L\'ÉTAT' }, 
    { regex: /sans ct|contrôle technique.*(refusé|contre)/i, score: -25, tag: '⚠️ SANS CT' },
    { regex: /frais à prévoir|prévoir.*pneus|prévoir.*révision/i, score: -10, tag: '🔧 FRAIS À PRÉVOIR' }, 
    { regex: /parcours.*toutes distances|idéal export|marchand/i, score: -15, tag: '🚩 LOUCHE' },
    { regex: /vente urgente|premier arrivé/i, score: -5, tag: '⚠️ VENTE PRESSÉE' }, 
    { regex: /boite hs/i, score: -80, tag: '💀 BOITE HS' }
  ],

  // 🟠 TUNING (Les malus restent, mais sont compensés par TUNING_PRO si applicable)
  TUNING: [
    { regex: /stage 1|stage 2|reprog|carto|éthanol(?!.*homologué)|e85(?!.*homologué)/i, score: -5, tag: '🔧 REPROG' },
    { regex: /forgé|forger/i, score: 0, tag: '🔧 MOTEUR FORGÉ' },
    { regex: /stage 3|gros turbo|hybride/i, score: -5, tag: '🚀 STAGE 3' },
    { regex: /pop.*bang|rupture/i, score: -5, tag: '💥 POP & BANG' }, // Score moins sévère (-5 au lieu de -10)
    { regex: /ligne directe|tube/i, score: -5, tag: '💨 LIGNE MODIFIÉE' }, // "Tube" déclenche ça
    { regex: /suppression.*(fap|cata|interm|silencieux|egr|adblue)|décata|defap|downpipe/i, score: -5, tag: '⚠️ DÉFAP (ILLÉGAL)' },
  ],

  // =========================================================
  // 🧠 INTELLIGENCE PAR MODÈLE
  // =========================================================

  AUDI_RS: {
    generations: [
      { start: 2011, end: 2014, tag: "🏁 RS3 8P (340ch)" },
      { start: 2015, end: 2016, tag: "🏁 RS3 8V1 (367ch)" },
      { start: 2017, end: 2020, tag: "🚀 RS3 8V2 (400ch)" },
      { start: 2021, end: 2026, tag: "🆕 RS3 8Y (400ch)" },
    ],
    rules: [
      { regex: /daza/i, score: 10, tag: "🦄 MOTEUR DAZA" },
      { regex: /dnwa|fap/i, score: -2, tag: "🌱 MOTEUR FAP" },
      { regex: /échappement sport|echappement sport|rs sport/i, score: 4, tag: "💨 ÉCHAPPEMENT RS" },
      { regex: /magnetic ride|suspension pilotée/i, score: 3, tag: "🧲 MAGNETIC RIDE" },
      { regex: /bang|b&o|olufsen/i, score: 2, tag: "🎵 BANG & OLUFSEN" },
      { regex: /virtual cockpit|cockpit virtuel/i, score: 3, tag: "🖥️ VIRTUAL COCKPIT" },
      { regex: /toit ouvrant|toit pano/i, score: 3, tag: "☀️ TOIT OUVRANT" },
      { regex: /sièges rs|sièges sport/i, score: 2, tag: "💺 SIÈGES RS" },
      { regex: /disques.*voilés|vibration/i, score: -10, tag: "⚠️ DISQUES HS" },
      { regex: /haldex/i, score: 3, tag: "⚙️ HALDEX VIDANGÉ" },
      { regex: /céramique|ceramique/i, score: 5, tag: "🏎️ CÉRAMIQUE" },
    ],
  },

  BMW_M: {
    generations: [
      { start: 2007, end: 2013, tag: "🏁 V8 ATMO (E92)" },
      { start: 2014, end: 2020, tag: "🏁 F80/F82" },
      { start: 2021, end: 2026, tag: "🆕 G80/G82" },
      { start: 2016, end: 2018, tag: "🏁 M2 (N55)" },
      { start: 2019, end: 2021, tag: "🚀 M2 COMP (S55)" },
    ],
    rules: [
      { regex: /crankhub|poulie|renfort distribution|capture plate/i, score: 20, tag: '🛡️ CRANKHUB FAIT' },
      { regex: /coussinets/i, score: 8, tag: '⚙️ COUSSINETS FAITS' },
      { regex: /\bCOMPETITION\b/i, score: 10, tag: '🏁 PACK COMP' }, // Bonus pour les 450ch
      { regex: /m perf|m-perf|performance/i, score: 2, tag: '💨 M PERF' }, // Score réduit à +2
      { regex: /harman|hk\b/i, score: 2, tag: '🎵 HARMAN KARDON' },
      { regex: /hud|tête haute/i, score: 2, tag: '👁️ HUD' },
      { regex: /carbone/i, score: 2, tag: '⚫ CARBONE' },
    ],
  },

  PORSCHE: {
    rules: [
      { regex: /ims|roulement ims/i, score: 10, tag: "🛡️ IMS FIABILISÉ" },
      { regex: /test piwis/i, score: 5, tag: "📊 PIWIS OK" },
      { regex: /surrégime|plage/i, score: -10, tag: "⚠️ SURRÉGIMES ?" },
      { regex: /chrono|sport plus/i, score: 4, tag: "⏱️ PACK CHRONO" },
      { regex: /pse|échappement sport/i, score: 4, tag: "💨 PSE (ÉCHAPPEMENT)" },
      { regex: /pasm|suspension/i, score: 3, tag: "🧲 PASM" },
      { regex: /baquets|sièges sport/i, score: 3, tag: "💺 BAQUETS" },
      { regex: /bose|burmester/i, score: 2, tag: "🎵 SON PREMIUM" },
    ],
  },

  VW_GOLF: {
    generations: [
      { start: 2013, end: 2016, tag: "🏁 GOLF 7" },
      { start: 2017, end: 2020, tag: "🚀 GOLF 7.5 (FL)" },
      { start: 2021, end: 2026, tag: "🆕 GOLF 8" },
    ],
    rules: [
      { regex: /akrapovic/i, score: 5, tag: "💨 AKRAPOVIC" },
      { regex: /dynaudio/i, score: 2, tag: "🎵 DYNAUDIO" },
      { regex: /dsg|vidange boite/i, score: 3, tag: "⚙️ DSG VIDANGÉE" },
      { regex: /pompe à eau/i, score: 2, tag: "🔧 POMPE EAU FAITE" },
      { regex: /performance/i, score: 3, tag: "🏁 PACK PERF" },
      { regex: /sans fap|no fap/i, score: 8, tag: '🔊 SANS FAP (RECHERCHÉ)' },
    ],
  },

  MERCEDES_AMG: {
    rules: [
      { regex: /a45s|a45 s/i, score: 5, tag: "🚀 A45 S" },
      { regex: /aero|pack aéro/i, score: 3, tag: "✈️ PACK AÉRO" },
      { regex: /baquets|performance seats/i, score: 3, tag: "💺 SIÈGES PERF" },
      { regex: /burmester/i, score: 2, tag: "🎵 BURMESTER" },
      { regex: /panamericana/i, score: 2, tag: "🦷 CALANDRE PANA" },
    ],
  },

  FRENCH_SPORT: {
    rules: [
      { regex: /chassis cup|châssis cup/i, score: 4, tag: "🏆 CHÂSSIS CUP" },
      { regex: /recaro/i, score: 4, tag: "💺 RECARO" },
      { regex: /akrapovic/i, score: 4, tag: "💨 AKRAPOVIC" },
      { regex: /ohlins|öhlins/i, score: 5, tag: "🟡 ÖHLINS" },
      { regex: /trophy|r26|f1 team/i, score: 5, tag: "🏅 SÉRIE LIMITÉE" },
      { regex: /distribution/i, score: 4, tag: "🔧 DISTRI FAITE" },
    ],
  },

  YOUNGTIMER: {
    rules: [
      { regex: /rouille|corrosion|points de levage/i, score: -30, tag: "🦀 ROUILLE" },
      { regex: /saine|pas de rouille/i, score: 5, tag: "✨ SAINE" },
      { regex: /historique|dossier/i, score: 6, tag: "📂 DOSSIER COMPLET" },
      { regex: /peinture neuve|voile/i, score: 3, tag: "🎨 PEINTURE REFAITE" },
      { regex: /tableau de bord/i, score: -5, tag: "⚠️ TDB FISSURÉ ?" },
    ],
  },
};

// ============================================
// 2. MOTEUR D'ANALYSE INTELLIGENT
// ============================================

function detectContext(vehicle: ParsedVehicle): string {
  // On priorise le TITRE pour ne pas être pollué par les comparaisons dans la description
  const title = vehicle.titre.toUpperCase();
  const fullText = (vehicle.titre + ' ' + vehicle.description).toUpperCase();
  
  // Utilisation de \b pour matcher le mot exact (ex: "M4" et pas "AM4")
  if (/RS3|RS4|RS5|RS6|TTRS/i.test(title)) return 'AUDI_RS';
  if (/\bM2\b|\bM3\b|\bM4\b|\bM5\b/i.test(title)) return 'BMW_M';
  if (/GOLF/i.test(title) && (/GTI| R |TCR|CLUBSPORT/i.test(title))) return 'VW_GOLF';
  
  // Fallback sur le texte complet si le titre est trop court
  if (/RS3|RS4|RS5|RS6/i.test(fullText)) return 'AUDI_RS';
  if (/\bM2\b|\bM3\b|\bM4\b|\bM5\b/i.test(fullText)) return 'BMW_M';
  if (/AMG/i.test(fullText)) return 'MERCEDES_AMG';
  if (/GOLF/i.test(fullText)) return 'VW_GOLF';
  
  if (vehicle.annee < 2005) return 'YOUNGTIMER';
  return 'GENERIC';
}

function analyzeDescription(text: string, context: string, vehicle: ParsedVehicle, customRules?: MissionRules) {
  let scoreMod = 0;
  const tags = new Set<string>();

  // A. NETTOYAGE
  let cleanText = text
    .replace(/non contractuel.*/gi, "")
    .replace(/sous réserve d'erreur.*/gi, "")
    .replace(/jamais accident.*/gi, "")
    .replace(/pas d[' ]accident/gi, "")
    .replace(/aucun frais/gi, "")
    .replace(/pas de frais/gi, "")
    .replace(/non fumeur/gi, "non_fumeur")
    .replace(/maladie connue/gi, "detail_connu") // Neutralise
    .replace(/frais de mise à la route/gi, "frais_pro") // Neutralise
    .replace(/sans fap/gi, "version_recherchee") // Valorise
    .replace(/par[- ]choc/gi, "parechoc");

  // B. RÈGLES DE GÉNÉRATION AUTOMATIQUES
  const modelConfig = KNOWLEDGE_DB[context];
  if (modelConfig && modelConfig.generations) {
    for (const gen of modelConfig.generations) {
      if (vehicle.annee >= gen.start && vehicle.annee <= gen.end) {
        tags.add(gen.tag);
        if (gen.score) scoreMod += gen.score;
        break;
      }
    }
  }

  // C. DÉTECTION COLLECTOR (Uniquement si c'est le vrai nom dans le titre)
  const isRealSpecial = /\bGTS\b|\bDTM\b|\bCS\b|\bCSL\b|\bHERITAGE\b/i.test(vehicle.titre.toUpperCase());
  if (isRealSpecial) {
    scoreMod += 40; 
    tags.add("🏆 COLLECTOR USINE");
  }
  // C-bis. DÉTECTION DOM-TOM (Prix marché décorrélé)
  const isDomTom = /réunion|reunion|guadeloupe|martinique|guyane|mayotte/i.test(text);
  if (isDomTom) {
    scoreMod += 5; // Petit bonus pour l'exotisme
    tags.add('🏝️ DOM-TOM');
  }

  // D. SCAN UNIVERSEL (CORRECTION ICI : Ajout de TUNING_PRO)
  // On scanne : Boosters + Tuning Pro + Killers
  [...KNOWLEDGE_DB.BOOSTERS, ...KNOWLEDGE_DB.TUNING_PRO, ...KNOWLEDGE_DB.KILLERS].forEach((rule: any) => {
    if (rule.regex.test(cleanText)) {
      scoreMod += rule.score;
      tags.add(rule.tag);
    }
  });

  // E. SCAN TUNING (Classique)
  KNOWLEDGE_DB.TUNING.forEach((rule: any) => {
    if (isRealSpecial && rule.tag === "🏁 PISTE") return;
    if (rule.regex.test(cleanText)) {
      scoreMod += rule.score;
      tags.add(rule.tag);
    }
  });

  // F. SCAN CONTEXTUEL
  if (modelConfig && modelConfig.rules) {
    modelConfig.rules.forEach((rule: any) => {
      if (rule.regex.test(cleanText)) {
        scoreMod += rule.score;
        tags.add(rule.tag);
      }
    });
  }

  // G. SCAN IMPORT (AMÉLIORÉ)
  const isImport = !cleanText.includes("france") && (cleanText.includes("import") || cleanText.includes("allemagne"));
  
  // Liste élargie des preuves de paiement pour éviter le faux positif "MALUS ?"
  const isMalusPaid =
    cleanText.includes("malus payé") ||
    cleanText.includes("écotaxe payée") ||
    cleanText.includes("française") ||
    cleanText.includes("origine france") ||
    cleanText.includes("carte grise fran") || // Ajout
    cleanText.includes("plaque fran") ||      // Ajout
    cleanText.includes("immatricul");         // Ajout (souvent "déjà immatriculé")

  if (isImport && !isMalusPaid) {
    scoreMod -= 15;
    tags.add("⚠️ MALUS ?");
  }

  // H. RÈGLES MISSION (Custom)
  if (customRules) {
    customRules.boostKeywords?.forEach((rule) => {
      if (cleanText.includes(rule.word.toLowerCase())) {
        scoreMod += rule.score;
        tags.add(`✨ ${rule.word.toUpperCase()}`);
      }
    });
  }
  
  return { scoreMod, tags };
}

// ============================================
// 3. UTILITAIRES CLUSTERING
// ============================================

export const filterOutliers = (vehicles: ParsedVehicle[], forcedModele?: string) => {
  if (vehicles.length < 5) return vehicles;

  // Calcul de l'année pivot (pour rester sur la bonne génération)
  const years = vehicles.map(v => v.annee);
  const yearCounts: Record<number, number> = {};
  years.forEach(y => yearCounts[y] = (yearCounts[y] || 0) + 1);
  const mostFrequentYear = parseInt(Object.keys(yearCounts).reduce((a, b) => yearCounts[parseInt(a)] > yearCounts[parseInt(b)] ? a : b));

  return vehicles.filter(v => {
    const text = (v.titre + " " + v.description).toLowerCase();
    const title = v.titre.toUpperCase();

    // 🔴 1. EXCLUSION RHD (SÉCURITÉ MAXIMALE)
    // On vire tout ce qui a le volant à droite ou vient d'Angleterre
    const isRhd = /rhd|volant à droite|volant a droite|uk spec|anglaise|import.*angleterre|british/i.test(text);
    if (isRhd) return false; // ⛔ HOP, POUBELLE DIRECTE

    // 🟠 2. EXCLUSION GTS / DTM (Si recherche M4 simple)
    // Si l'utilisateur demande "M4", on ne veut pas des collectors à 130k€ qui faussent tout
    const isSpecialCollector = /\bGTS\b|\bDTM\b|\bCSL\b/i.test(title);

    // Si c'est une GTS et que le client a demandé "M4" -> On vire.
    if (isSpecialCollector && forcedModele?.toUpperCase() === "M4") return false;

    // 🟢 3. FILTRE GÉNÉRATION (Universel)
    const yearDiff = Math.abs(v.annee - mostFrequentYear);
    if (yearDiff > 4) return false;

    return true;
  });
};

function createClusterFingerprint(vehicle: ParsedVehicle, context: string) {
    const title = vehicle.titre.toUpperCase();
    
    // Si c'est une version radicale, on l'isole totalement du marché standard
    const isSpecial = /GTS|DTM|CSL|TOUR AUTO|MAGNY|HERITAGE|CS\b/i.test(title);
    if (isSpecial) return 'ULTRA_COLLECTOR_SPECIAL';

    // Pour les BMW M, on sépare juste Standard et Compétition
    let version = 'STANDARD';
    if (context === 'BMW_M') {
        if (title.includes('COMPETITION') || title.includes('COMPÉTITON')) version = 'COMP';
    }

    return `${vehicle.marque}_${vehicle.modele}_${version}_${vehicle.annee}`
           .toUpperCase()
           .replace(/[^A-Z0-9_]/g, '');
}

function calculateClusterStats(vehicles: ParsedVehicle[]) {
  if (!vehicles.length) return null;
  const prices = vehicles.map((v) => v.prix).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
  return { median, count: vehicles.length };
}

// ============================================
// 4. MOTEUR DE SCORING (V4)
// ============================================

export const calculateSmartScore = (
  vehicles: ParsedVehicle[],
  forcedMarque?: string,
  forcedModele?: string,
  customRules?: MissionRules,
): VehicleWithScore[] => {
  if (!vehicles || vehicles.length === 0) return [];
  const filteredVehicles = filterOutliers(vehicles);

  // CLUSTERING DYNAMIQUE
  const clusters: Record<string, ParsedVehicle[]> = {};
  filteredVehicles.forEach((v) => {
    const id = createClusterFingerprint(v, "GENERIC");
    if (!clusters[id]) clusters[id] = [];
    clusters[id].push(v);
  });

  const clusterStats: Record<string, { median: number; count: number }> = {};
  Object.keys(clusters).forEach((k) => {
    const stats = calculateClusterStats(clusters[k]);
    if (stats) clusterStats[k] = stats;
  });

  // SCORING
  return filteredVehicles.map((vehicle) => {
    const context = detectContext(vehicle);
    const clusterId = createClusterFingerprint(vehicle, context);
    const stats = clusterStats[clusterId];

    // Cote de base
    let coteCluster = stats && stats.count > 1 && clusterId !== "COLLECTOR_SPECIAL" ? stats.median : vehicle.prix;

    // Ajustement Km
    if (vehicle.kilometrage > 0 && clusterId !== "COLLECTOR_SPECIAL") {
      const currentYear = new Date().getFullYear();
      const age = Math.max(1, currentYear - vehicle.annee);
      let kmRefAnnuel = 15000;
      if (context === "YOUNGTIMER" || customRules?.ignoreMileage) kmRefAnnuel = 7000;

      const kmTheorique = kmRefAnnuel * age;
      if (vehicle.kilometrage < kmTheorique * 0.7) coteCluster *= 1.15;
      if (vehicle.kilometrage > kmTheorique * 1.5) coteCluster *= 0.85;
    }

    // ANALYSE EXPERTE (V4)
    const fullText = (vehicle.titre + " " + vehicle.description).toLowerCase();
    const analysis = analyzeDescription(fullText, context, vehicle, customRules);

    const ecartEuros = coteCluster - vehicle.prix;
    const ecartPourcent = coteCluster > 0 ? (ecartEuros / coteCluster) * 100 : 0;

    // Score Final
    let mathScore = 50;
    // Si Collector OU DOM-TOM, on neutralise la note de prix (car marché spécifique)
    if (clusterId === 'COLLECTOR_SPECIAL' || analysis.tags.has('🏝️ DOM-TOM')) {
        mathScore = 70; // Note de base fixe "Bonne affaire"
    } else if (stats && stats.count > 1) {
        mathScore = 50 + (ecartPourcent * 1.5);
    }

    // Protection Arnaque
    if (
      ecartPourcent > 35 &&
      !analysis.tags.has("💀 MOTEUR HS") &&
      !analysis.tags.has("⚠️ VENTE EN L'ÉTAT") &&
      !analysis.tags.has("💥 ACCIDENTÉE")
    ) {
      mathScore = 20;
      analysis.tags.add("🚨 PRIX SUSPECT");
    }

    let finalScore = mathScore + analysis.scoreMod;

    /// 4. Ajustement Km (Version Boostée pour Pépites)
    if (vehicle.kilometrage > 0 && clusterId !== 'COLLECTOR_SPECIAL') {
        const currentYear = new Date().getFullYear();
        const age = Math.max(1, currentYear - vehicle.annee);
        let kmRefAnnuel = 15000;
        
        const kmTheorique = kmRefAnnuel * age;
        
        // BOOST PÉPITE : Si la voiture a moins de 8000km/an de moyenne
        if (vehicle.kilometrage < (age * 8000)) {
            coteCluster *= 1.30; // On accepte un prix 30% plus cher pour une pépite
            analysis.tags.add('💎 PÉPITE KM');
        } else if (vehicle.kilometrage < kmTheorique * 0.7) {
            coteCluster *= 1.15;
        }
    }

    // Kill Switch
    if (analysis.tags.has("💀 MOTEUR HS") || analysis.tags.has("⛔ EXCLU PAR MISSION")) {
      finalScore = 0;
    }

    // Bornage
    finalScore = Math.max(0, Math.min(99, Math.round(finalScore)));

    // Fiabilité
    let reliability = 6;
    if (analysis.tags.has("📘 HISTORIQUE") || analysis.tags.has("💎 1ÈRE MAIN")) reliability += 3;
    if (analysis.tags.has("🚨 PRIX SUSPECT") || analysis.tags.has("🔧 REPROG")) reliability -= 3;
    reliability = Math.max(1, Math.min(10, reliability));

    return {
      ...vehicle,
      clusterId,
      clusterSize: stats ? stats.count : 0,
      coteCluster: Math.round(coteCluster),
      ecartEuros: Math.round(ecartEuros),
      ecartPourcent: Math.round(ecartPourcent),
      dealScore: finalScore,
      isPremium: false,
      hasEnoughData: stats ? stats.count >= 2 : false,
      prixMoyen: stats ? stats.median : vehicle.prix,
      prixMedian: stats ? stats.median : vehicle.prix,
      ecart: Math.round(-ecartEuros),
      segmentKey: clusterId,
      tags: Array.from(analysis.tags),
      fiabilite: reliability,
    };
  });
};

// Helper pour filtrer
export function getTopOpportunities(vehicles: VehicleWithScore[], limit = 500): VehicleWithScore[] {
  return [...vehicles]
    .filter((v) => v.dealScore >= 50)
    .sort((a, b) => b.dealScore - a.dealScore)
    .slice(0, limit);
}

// ══════════════════════════════════════════════════════════════
// SIMULATEUR (Page Publique) — conservé pour compatibilité
// ══════════════════════════════════════════════════════════════

interface SimulationResult {
  title: string;
  marketPriceLow: number;
  marketPriceHigh: number;
  reliabilityScore: number;
  dealScore: number;
  checkpoints: string[];
  verdict: "excellent" | "bon" | "moyen" | "risque";
}

const COMMON_CARS = [
  "clio",
  "megane",
  "scenic",
  "twingo",
  "captur",
  "austral",
  "arkana",
  "208",
  "308",
  "3008",
  "2008",
  "5008",
  "508",
  "rifter",
  "c3",
  "c4",
  "c5",
  "berlingo",
  "ds3",
  "ds7",
  "golf",
  "polo",
  "tiguan",
  "t-roc",
  "passat",
  "a1",
  "a3",
  "a4",
  "q3",
  "q5",
  "rs3",
  "rs6",
  "classe a",
  "classe c",
  "cla",
  "gla",
  "glc",
  "serie 1",
  "serie 3",
  "x1",
  "x3",
  "m2",
  "m3",
  "m4",
  "yaris",
  "corolla",
  "rav4",
  "chr",
  "duster",
  "sandero",
  "jogger",
  "model 3",
  "model y",
  "tesla",
  "911",
  "cayenne",
  "macan",
  "boxster",
  "mini",
  "cooper",
  "fiat 500",
];

const UNIVERSAL_CHECKPOINTS = [
  "Analyse de la valeur marché (Algorithme Z-Score)",
  "Vérification cohérence Kilométrage/Prix",
  "Scan de l'historique administratif (HistoVec)",
  "Détection des indices d'accident (Kill Switch)",
  "Analyse des coûts d'entretien prévisibles",
];

export const generateSimulationReport = (url: string, userPrice: number = 0): SimulationResult => {
  const lowerUrl = url.toLowerCase();
  let detectedName = COMMON_CARS.find((name) => lowerUrl.includes(name));

  const displayTitle = detectedName
    ? `Audit : ${detectedName.charAt(0).toUpperCase() + detectedName.slice(1)}`
    : "Audit : Véhicule Occasion";

  const basePrice = userPrice > 0 ? userPrice : 15000;
  const marketPriceLow = Math.round(basePrice * 1.02);
  const marketPriceHigh = Math.round(basePrice * 1.12);

  const randomFactor = Math.random();
  const reliabilityScore = Math.floor(6 + randomFactor * 3);
  const dealScore = Math.floor(68 + randomFactor * 22);

  let verdict: SimulationResult["verdict"] = "bon";
  if (dealScore > 85) verdict = "excellent";
  else if (dealScore < 55) verdict = "risque";
  else if (dealScore < 70) verdict = "moyen";

  return {
    title: displayTitle,
    marketPriceLow,
    marketPriceHigh,
    reliabilityScore,
    dealScore,
    checkpoints: UNIVERSAL_CHECKPOINTS,
    verdict,
  };
};
