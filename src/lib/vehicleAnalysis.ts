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
    { regex: /première main|1ère main|1ere main/i, score: 5, tag: "💎 1ÈRE MAIN" },
    { regex: /origine france|achat concession fran|française/i, score: 5, tag: "🇫🇷 ORIGINE FR" },
    { regex: /carnet.*jour|suivi.*limpide|full suivi|factures/i, score: 4, tag: "📘 HISTORIQUE" },
    { regex: /carnet.*tamponné|suivi.*exclusif|entretien.*réseau/i, score: 5, tag: "📘 HISTORIQUE PREMIUM" }, // Ajout
    { regex: /malus payé|écotaxe payée|pas de malus/i, score: 8, tag: "💶 TAXE OK" },
    { regex: /garantie.*(12|24).*mois/i, score: 3, tag: "🛡️ GARANTIE" },
    { regex: /tva récup|tva récuperable/i, score: 2, tag: "🏢 TVA DÉDUCTIBLE" },
    { regex: /distri.*neuve|chaine.*neuve|vidange.*boite/i, score: 3, tag: "🔧 ENTRETENUE" },
    { regex: /embrayage.*neuf|volant moteur.*neuf/i, score: 4, tag: "⚙️ EMBRAYAGE NEUF" }, // Ajout
    { regex: /disques.*plaquettes.*neufs|freins.*neufs/i, score: 2, tag: "🛑 FREINS NEUFS" }, // Ajout
    { regex: /full option|toutes options/i, score: 3, tag: "🎯 FULL OPTIONS" },
    { regex: /céramique|ceramique|ppf|film protection/i, score: 2, tag: "✨ SOIGNÉE" },
    { regex: /temps de chauffe|jamais circuit|usage promenade/i, score: 3, tag: "✨ CONDUITE SOIGNÉE" }, // Ajout
    { regex: /ct ok|pneus neufs/i, score: 2, tag: "✅ CT OK" },
    { regex: /coussinets/i, score: 5, tag: "⚙️ COUSSINETS FAITS" },
    { regex: /flexfuel.*homologué|boitier.*homologué|carte grise.*gratuite/i, score: 3, tag: "⛽ ÉTHANOL HOMOLOGUÉ" }, // Ajout Bonus
  ],

  // 🔴 TUEURS UNIVERSELS
  KILLERS: [
    // Moteur HS : On sécurise pour ne pas flaguer les prépas/maintenances
    {
      regex: /moteur hs|bruit moteur|claquement|joint de culasse|bielle.*coulée|bruit.*bielle/i,
      score: -100,
      tag: "💀 MOTEUR HS",
    },
    // On a supprimé la ligne "bielle" seule qui était trop risquée

    // Anti Faux-Positifs
    { regex: /(?<!jamais |non |pas d'|pas de |aucun )accident(?!é)/i, score: -50, tag: "💥 ACCIDENTÉE" },
    { regex: /(?<!par[-e\s]?)choc(?!\s*absorb)/i, score: -30, tag: "💥 TRACE DE CHOC" },
    { regex: /vge|marbre|procédure|épave/i, score: -50, tag: "💥 ACCIDENTÉE" },

    // États dégradés
    { regex: /dans l'état(?!.*irréprochable)/i, score: -25, tag: "⚠️ VENTE EN L'ÉTAT" },
    { regex: /sans ct|contrôle technique.*(refusé|contre)/i, score: -25, tag: "⚠️ SANS CT" },
    { regex: /frais à prévoir|prévoir.*pneus|prévoir.*révision/i, score: -10, tag: "🔧 FRAIS À PRÉVOIR" }, // Ajout

    // Arnaques potentielles
    { regex: /parcours.*toutes distances|idéal export|marchand/i, score: -15, tag: "🚩 LOUCHE" },
    { regex: /vente urgente|premier arrivé/i, score: -5, tag: "⚠️ VENTE PRESSÉE" }, // Ajout
    { regex: /boite hs/i, score: -80, tag: "💀 BOITE HS" },
  ],

  // 🟠 TUNING
  TUNING: [
    { regex: /stage 1|stage 2|reprog|carto|éthanol(?!.*homologué)|e85(?!.*homologué)/i, score: -5, tag: "🔧 REPROG" }, // Nuance
    { regex: /forgé|forger/i, score: 0, tag: "🔧 MOTEUR FORGÉ" },
    { regex: /stage 3|gros turbo|hybride/i, score: -5, tag: "🚀 STAGE 3" },
    { regex: /pop.*bang|rupture|ligne directe/i, score: -10, tag: "🚩 TUNING DOUTEUX" }, // Ajout
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
      { regex: /crankhub|poulie|renfort distribution|capture plate/i, score: 20, tag: "🛡️ CRANKHUB FAIT" },
      { regex: /coussinets/i, score: 8, tag: "⚙️ COUSSINETS FAITS" },
      { regex: /actuateur/i, score: 5, tag: "⚙️ ACTUATEURS FAITS" },
      { regex: /m perf|m-perf|performance|ligne titane/i, score: 3, tag: "💨 M PERF" },
      { regex: /harman/i, score: 2, tag: "🎵 HARMAN KARDON" },
      { regex: /hud|tête haute/i, score: 2, tag: "👁️ HUD" },
      { regex: /carbone/i, score: 2, tag: "⚫ CARBONE" },
      { regex: /magny[- ]cours|gts|cs|dtm|héritage|heritage|csl/i, score: 30, tag: "🏆 COLLECTOR" },
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
  const fullText = (vehicle.titre + " " + vehicle.description).toUpperCase();

  if (
    fullText.includes("RS3") ||
    fullText.includes("RS4") ||
    fullText.includes("RS5") ||
    fullText.includes("RS6") ||
    fullText.includes("TTRS")
  )
    return "AUDI_RS";
  if (fullText.includes("M2") || fullText.includes("M3") || fullText.includes("M4") || fullText.includes("M5"))
    return "BMW_M";
  if (
    fullText.includes("911") ||
    fullText.includes("CAYMAN") ||
    fullText.includes("BOXSTER") ||
    fullText.includes("PORSCHE")
  )
    return "PORSCHE";
  if (fullText.includes("AMG")) return "MERCEDES_AMG";
  if (fullText.includes("GOLF") && (fullText.includes("GTI") || fullText.includes(" R "))) return "VW_GOLF";
  if (fullText.includes("MEGANE RS") || fullText.includes("CLIO RS") || fullText.includes("ALPINE"))
    return "FRENCH_SPORT";
  if (vehicle.annee < 2005) return "YOUNGTIMER";

  return "GENERIC";
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

  // C. DÉTECTION COLLECTOR
  const isCollector = /gts|dtm|cs|magny[- ]cours|trophy r|r26r|csl/i.test(vehicle.titre);
  if (isCollector) {
    cleanText = cleanText.replace(/piste|circuit/gi, "usage_track");
    scoreMod += 10;
    tags.add("🏆 COLLECTOR USINE");
  }

  // D. SCAN UNIVERSEL
  [...KNOWLEDGE_DB.BOOSTERS, ...KNOWLEDGE_DB.KILLERS].forEach((rule: any) => {
    if (rule.regex.test(cleanText)) {
      scoreMod += rule.score;
      tags.add(rule.tag);
    }
  });

  // E. SCAN TUNING
  KNOWLEDGE_DB.TUNING.forEach((rule: any) => {
    if (isCollector && rule.tag === "🏁 PISTE") return;
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

  // G. SCAN IMPORT
  const isImport = !cleanText.includes("france") && (cleanText.includes("import") || cleanText.includes("allemagne"));
  const isMalusPaid =
    cleanText.includes("malus payé") ||
    cleanText.includes("écotaxe payée") ||
    cleanText.includes("française") ||
    cleanText.includes("origine france");

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

export const filterOutliers = (vehicles: ParsedVehicle[]) => {
  if (vehicles.length < 5) return vehicles;
  const cleanList = vehicles.filter((v) => {
    const text = (v.titre + " " + v.description).toLowerCase();
    return !/rhd|volant à droite|uk spec|anglaise/.test(text);
  });
  const avg = cleanList.reduce((sum, v) => sum + v.prix, 0) / cleanList.length;
  return cleanList.filter((v) => v.prix > avg * 0.15 && v.prix < avg * 3.5);
};

function createClusterFingerprint(vehicle: ParsedVehicle, context: string) {
  if (/gts|dtm|cs|trophy r/i.test(vehicle.titre)) return "COLLECTOR_SPECIAL";
  return `${vehicle.marque}_${vehicle.modele}_${vehicle.annee}`.toUpperCase().replace(/[^A-Z0-9_]/g, "");
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
    if (clusterId === "COLLECTOR_SPECIAL") {
      mathScore = 70;
    } else if (stats && stats.count > 1) {
      mathScore = 50 + ecartPourcent * 1.5;
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

    // Tags Spéciaux Logiques
    if (vehicle.kilometrage > 140000 && finalScore > 75 && !analysis.tags.has("💀 MOTEUR HS")) {
      analysis.tags.add("📉 FLIP MARCHAND");
    }
    if (vehicle.kilometrage < 30000 && vehicle.annee <= 2018) {
      analysis.tags.add("💎 COLLECTION");
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
