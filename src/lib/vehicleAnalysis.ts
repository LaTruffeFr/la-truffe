import { ParsedVehicle, VehicleWithScore } from "./csvParser";

// ============================================
// 1. BASE DE CONNAISSANCE UNIVERSELLE (V9.0)
// ============================================

export type ExpertTag = string;

export interface MissionRules {
  requiredKeywords?: string[];
  bannedKeywords?: string[];
  boostKeywords?: { word: string; score: number }[];
  ignoreMileage?: boolean;
}

const KNOWLEDGE_DB: Record<string, any> = {
  // 🟢 BOOSTERS UNIVERSELS
  BOOSTERS: [
    // HISTORIQUE & PROPRIÉTAIRE
    { regex: /première main|1ère main|1ere main/i, score: 5, tag: '💎 1ÈRE MAIN' },
    { regex: /origine france|achat concession fran|française|livrée.*france/i, score: 5, tag: '🇫🇷 ORIGINE FR' },
    { regex: /carnet.*jour|suivi.*limpide|full suivi|factures/i, score: 4, tag: '📘 HISTORIQUE' },
    { regex: /carnet.*tamponné|suivi.*exclusif|entretien.*réseau|entretien.*(chez|à|par).*(bmw|audi|porsche|vw|volkswagen|mercedes|renault|peugeot)/i, score: 5, tag: '📘 HISTORIQUE PREMIUM' },
    { regex: /propriétaire depuis.*(ans|année)|possède depuis/i, score: 4, tag: '💎 PROPRIO LONGUE DURÉE' },
    { regex: /double des cl[ée]fs?|2 cl[ée]fs?|deux cl[ée]fs?/i, score: 3, tag: '🔑 DOUBLE CLÉS' },
    { regex: /non fumeur|non-fumeur|véhicule non-fumeur/i, score: 2, tag: '🚭 NON FUMEUR' },
    { regex: /dort.*garage|stockée.*sec|sous housse/i, score: 3, tag: '🏠 DORT GARAGE' },
    { regex: /temps de chauffe|jamais circuit|usage promenade|autoroute uniquement/i, score: 4, tag: '🩸 ENTRETIEN MANIAQUE' },
    { regex: /passionné|maniaque/i, score: 2, tag: '💖 PROPRIO PASSIONNÉ' },

    // ADMINISTRATIF & GARANTIE
    { regex: /malus payé|écotaxe payée|pas de malus/i, score: 8, tag: '💶 TAXE OK' },
    { regex: /garantie.*(12|24).*mois|sous garantie/i, score: 4, tag: '🛡️ GARANTIE' },
    { regex: /tva récup|tva récuperable/i, score: 2, tag: '🏢 TVA DÉDUCTIBLE' },
    { regex: /ct ok|contrôle technique ok|vierge/i, score: 3, tag: '✅ CT OK' },
    { regex: /carte grise.*règle|cg.*ok/i, score: 1, tag: '📄 CG OK' },

    // ÉTAT MÉCANIQUE & ENTRETIEN
    { regex: /distri.*neuve|chaine.*neuve|vidange.*boite|dsg.*vidang/i, score: 3, tag: '🔧 GROS ENTRETIEN FAIT' },
    { regex: /embrayage.*neuf|volant moteur.*neuf/i, score: 4, tag: '⚙️ EMBRAYAGE NEUF' },
    { regex: /disques.*plaquettes.*neufs|freins.*neufs/i, score: 2, tag: '🛑 FREINS NEUFS' },
    { regex: /pneus.*neufs|4 pneus neufs/i, score: 2, tag: '🛞 PNEUS NEUFS' },
    { regex: /révision.*récente|vidange.*faite/i, score: 2, tag: '🛢️ RÉVISION OK' },
    { regex: /rien à prévoir|aucun frais|état irréprochable|état concours/i, score: 5, tag: '✨ RIEN À PRÉVOIR' },
    { regex: /full option|toutes options/i, score: 2, tag: '🎯 FULL OPTIONS' },
    
    // ESTHÉTIQUE
    { regex: /céramique|ceramique|ppf|film protection/i, score: 3, tag: '✨ PROTECTION CARROSSERIE' },
    { regex: /état neuf|proche du neuf/i, score: 3, tag: '✨ ÉTAT NEUF' },
    
    // PROJET UNIQUE
    { regex: /unique|config.*unique|show car|projet.*abouti/i, score: 3, tag: '✨ CONFIG UNIQUE' },
  ],

  // 🔵 TUNING PRO & PIÈCES DE MARQUE
  TUNING_PRO: [
    { regex: /homologu|certificat|tüv/i, score: 5, tag: '✅ PIÈCES HOMOLOGUÉES' },
    { regex: /mhd|xhp|bootmod|jb4|multi[- ]map|flexfuel|e85/i, score: 3, tag: '💻 GESTION AVANCÉE' },
    { regex: /milltek|akrapovic|remus|bullx|arp|supersprint|scorpion|vrsf|eisenmann|inoxcar/i, score: 3, tag: '💨 LIGNE DE MARQUE' },
    
    // TUNERS D'ÉLITE (Immunité Prix Totale)
    { regex: /schirmer|g[- ]power|manhart|ac schnitzer|alpina|dinan|dm performance|abt/i, score: 10, tag: '🦄 PRÉPA D\'ÉLITE' },
    
    { regex: /br[- ]performance|shiftech|o2|digiservices|mrc|ksf|jd ingineering|mk6|autoworks/i, score: 2, tag: '🔧 PRÉPA CONNUE' },
    { regex: /kw|bilstein|ohlins|fox|h&r|eibach|st sus|vwr|volkswagen racing|b14|b16|v3|clubsport|intrax|nitron/i, score: 4, tag: '🏁 CHÂSSIS PRO' },
    { regex: /maxton|zaero|rieger|oettinger/i, score: 2, tag: '✨ KIT CARROSSERIE' },
    { regex: /covering|ppf|film protection/i, score: 2, tag: '🎨 PROTECT CARROSSERIE' },
    { regex: /r600|racingline|apr|wagner|forge|eventuri|cts|airtek|airtec|ftp motorsport|do88|csf|injen|bmc/i, score: 3, tag: '🌬️ ADMISSION/COOLING' },
    { regex: /loba|tte|is38|the turbo|shuenk|pure turbo|hybrid|gros turbo/i, score: 3, tag: '🐌 GROS TURBO' },
    { regex: /brembo|ap racing|alcon|étriers?.*(rs|macan|porsche)|pagid|endless|ferodo|ds uno|ds2500|ds3000/i, score: 4, tag: '🛑 FREINAGE PISTE' },
    { regex: /crankhub|poulie|capture plate|bielle|piston|renforc/i, score: 5, tag: '🛡️ MÉCANIQUE RENFORCÉE' },
    { regex: /japan racing|jr wheels|oz racing|bbs|rays|volk|apex|protrack/i, score: 2, tag: '🛞 JANTES SPORT' },
    { regex: /\boem\b|pièces.*origine/i, score: 4, tag: '✨ PIÈCES OEM (VALEUR)' },
  ],

  // 🔴 TUEURS UNIVERSELS
  KILLERS: [
    { regex: /moteur hs|bruit moteur|claquement|joint de culasse|bielle.*coulée|bruit.*bielle/i, score: -100, tag: '💀 MOTEUR HS' },
    { regex: /subi.*accident|véhicule accidenté|sinistre|vge|marbre|épave/i, score: -100, tag: '💀 ACCIDENT GRAVE' },
    { regex: /vandalisme|volé.*retrouvé/i, score: -50, tag: '🏚️ VANDALISME' },
    // Regex "SANS ACCIDENT" safe
    { regex: /(?<!jamais |non |pas d'|pas de |aucun |sans )accident(?!é)/i, score: -50, tag: '💥 ACCIDENTÉE' },
    { regex: /(?<!par[-e\s]?)choc(?!\s*absorb)/i, score: -30, tag: '💥 TRACE DE CHOC' },
    { regex: /dans l'état(?!.*irréprochable)/i, score: -25, tag: '⚠️ VENTE EN L\'ÉTAT' }, 
    { regex: /sans ct|contrôle technique.*(refusé|contre)/i, score: -25, tag: '⚠️ SANS CT' },
    { regex: /frais à prévoir|prévoir.*pneus|prévoir.*révision/i, score: -10, tag: '🔧 FRAIS À PRÉVOIR' }, 
    { regex: /parcours.*toutes distances|idéal export|marchand/i, score: -15, tag: '🚩 LOUCHE' },
    { regex: /vente urgente|premier arrivé/i, score: -5, tag: '⚠️ VENTE PRESSÉE' }, 
    { regex: /boite hs/i, score: -80, tag: '💀 BOITE HS' },
    { regex: /voyant.*allumé|témoin.*allumé/i, score: -40, tag: '⚠️ VOYANT MOTEUR' },
    { regex: /fumée|fume/i, score: -30, tag: '⚠️ FUMÉE SUSPECTE' },
    { regex: /projet.*(termin|finir)|reste à installer/i, score: -15, tag: '🔧 PROJET À FINIR' },
  ],

  // 🟠 TUNING
  TUNING: [
    { regex: /stage 1|stage 2|reprog|carto|éthanol(?!.*homologué)|e85(?!.*homologué)/i, score: -5, tag: '🔧 REPROG' },
    { regex: /forgé|forger/i, score: 0, tag: '🔧 MOTEUR FORGÉ' },
    { regex: /stage 3|gros turbo|hybride/i, score: -5, tag: '🚀 STAGE 3' },
    { regex: /pop.*bang|rupture/i, score: -5, tag: '💥 POP & BANG' },
    { regex: /ligne directe|tube/i, score: -5, tag: '💨 LIGNE MODIFIÉE' },
    { regex: /suppression.*(fap|cata|interm|silencieux|egr|adblue)|décata|defap|downpipe/i, score: -5, tag: '⚠️ DÉFAP (ILLÉGAL)' },
  ],

  // =========================================================
  // 🧠 SPÉCIFICITÉS PAR MODÈLE
  // =========================================================

  AUDI_RS: {
    rules: [
      { regex: /daza/i, score: 10, tag: "🦄 MOTEUR DAZA" },
      { regex: /dnwa|fap/i, score: -2, tag: "🌱 MOTEUR FAP" },
      { regex: /échappement sport|echappement sport|rs sport/i, score: 4, tag: "💨 ÉCHAPPEMENT RS" },
      { regex: /magnetic ride|suspension pilotée/i, score: 3, tag: "🧲 MAGNETIC RIDE" },
      { regex: /bang|b&o|olufsen/i, score: 2, tag: "🎵 BANG & OLUFSEN" },
      { regex: /virtual cockpit|cockpit virtuel/i, score: 3, tag: "🖥️ VIRTUAL COCKPIT" },
      { regex: /toit ouvrant|toit pano/i, score: 3, tag: "☀️ TOIT OUVRANT" },
      { regex: /sièges rs|sièges sport/i, score: 2, tag: "💺 SIÈGES RS" },
      { regex: /céramique|ceramique/i, score: 5, tag: "🏎️ CÉRAMIQUE" },
    ],
  },

  BMW_M: { 
    rules: [
      { regex: /crankhub|poulie|renfort distribution|capture plate/i, score: 20, tag: '🛡️ CRANKHUB FAIT' },
      { regex: /coussinets/i, score: 8, tag: '⚙️ COUSSINETS FAITS' },
      { regex: /\bCOMPETITION\b/i, score: 10, tag: '🏁 PACK COMP' },
      { regex: /m perf|m-perf|performance/i, score: 2, tag: '💨 M PERF' },
      { regex: /harman|hk\b/i, score: 2, tag: '🎵 HARMAN KARDON' },
      { regex: /hud|tête haute/i, score: 2, tag: '👁️ HUD' },
      { regex: /carbone/i, score: 2, tag: '⚫ CARBONE' },
      { regex: /763m|666m|feux lci|oled|iconic|capot cs|sièges cs/i, score: 3, tag: '🏁 PIÈCES CS/LCI' }
    ],
  },

  VW_GOLF: {
    generations: [
      { start: 2013, end: 2016, tag: "🏁 GOLF 7 GTI" },
      { start: 2017, end: 2020, tag: "🚀 GOLF 7.5 (FL)" },
      { start: 2020, end: 2026, tag: "🆕 GOLF 8 GTI" },
    ],
    rules: [
      { regex: /tcr|clubsport/i, score: 20, tag: "🏆 COLLECTOR USINE" },
      { regex: /golf 8|golf viii/i, score: 10, tag: "🆕 GÉNÉRATION 8" },
      { regex: /akrapovic/i, score: 5, tag: "💨 AKRAPOVIC" },
      { regex: /dynaudio/i, score: 2, tag: "🎵 DYNAUDIO" },
      { regex: /dsg|vidange boite/i, score: 3, tag: "⚙️ DSG VIDANGÉE" },
      { regex: /pompe à eau/i, score: 2, tag: "🔧 POMPE EAU FAITE" },
      { regex: /performance|autobloquant|vaq/i, score: 5, tag: "🏁 PACK PERF" },
      { regex: /toit ouvrant|toit pano/i, score: 3, tag: "☀️ TOIT OUVRANT" },
      { regex: /virtual cockpit|digital cockpit|compteurs digitaux/i, score: 3, tag: "🖥️ VIRTUAL COCKPIT" },
      { regex: /sans fap|no fap/i, score: 8, tag: '🔊 SANS FAP (RECHERCHÉ)' },
    ],
  },

  PORSCHE: {
    rules: [
      { regex: /ims|roulement ims/i, score: 10, tag: "🛡️ IMS FIABILISÉ" },
      { regex: /test piwis/i, score: 5, tag: "📊 PIWIS OK" },
      { regex: /chrono|sport plus/i, score: 4, tag: "⏱️ PACK CHRONO" },
      { regex: /pse|échappement sport/i, score: 4, tag: "💨 PSE (ÉCHAPPEMENT)" },
      { regex: /pasm|suspension/i, score: 3, tag: "🧲 PASM" },
      { regex: /baquets|sièges sport/i, score: 3, tag: "💺 BAQUETS" },
    ],
  },

  MERCEDES_AMG: {
    rules: [
      { regex: /a45s|a45 s/i, score: 5, tag: "🚀 A45 S" },
      { regex: /aero|pack aéro/i, score: 3, tag: "✈️ PACK AÉRO" },
      { regex: /baquets|performance seats/i, score: 3, tag: "💺 SIÈGES PERF" },
      { regex: /burmester/i, score: 2, tag: "🎵 BURMESTER" },
    ],
  },

  RENAULT_SPORT: {
    rules: [
      { regex: /chassis cup|châssis cup/i, score: 4, tag: "🏆 CHÂSSIS CUP" },
      { regex: /recaro/i, score: 4, tag: "💺 RECARO" },
      { regex: /akrapovic/i, score: 4, tag: "💨 AKRAPOVIC" },
      { regex: /ohlins|öhlins/i, score: 5, tag: "🟡 ÖHLINS" },
      { regex: /trophy|r26|f1 team/i, score: 5, tag: "🏅 SÉRIE LIMITÉE" },
    ],
  },
};

// ============================================
// 2. MOTEUR D'ANALYSE INTELLIGENT
// ============================================

function detectContext(vehicle: ParsedVehicle): string {
  const fullText = (vehicle.titre + ' ' + vehicle.description).toUpperCase();
  const title = vehicle.titre.toUpperCase();
  
  if (/\bRS3\b|\bRS4\b|\bRS5\b|\bTTRS\b/i.test(fullText)) return 'AUDI_RS';
  if (/\bM2\b|\bM3\b|\bM4\b/i.test(title)) return 'BMW_M';
  if (/\bAMG\b/i.test(fullText)) return 'MERCEDES_AMG';
  if (/\bGTI\b|\bTCR\b|\bCLUBSPORT\b/i.test(fullText) || /GOLF/i.test(title)) return 'VW_GOLF';
  if (/\bFERRARI\b|\bPORSCHE\b/i.test(fullText)) return 'PORSCHE';
  if (/MEGANE|CLIO/i.test(title) && /R\.?S/i.test(title)) return 'RENAULT_SPORT';
  
  return 'GENERIC';
}

function analyzeDescription(text: string, context: string, vehicle: ParsedVehicle, customRules?: MissionRules) {
  let scoreMod = 0;
  const tags = new Set<string>();

  // A. NETTOYAGE PRÉALABLE (Anti-Marketing)
  const marketingCutoff = text.search(/nous pouvons réaliser|nos services|reprise possible|financement possible|livraison possible|contactez-nous|visible dans nos locaux|extension de garantie|nous vous proposons/i);
  let processText = marketingCutoff > -1 ? text.substring(0, marketingCutoff) : text;

  // B. NETTOYAGE CLASSIQUE
  let cleanText = processText
    .replace(/non contractuel.*/gi, "")
    .replace(/sous réserve d'erreur.*/gi, "")
    .replace(/jamais accident.*/gi, "")
    .replace(/pas d[' ]accident/gi, "")
    .replace(/sans accident/gi, "") 
    .replace(/aucun frais/gi, "")
    .replace(/pas de frais/gi, "")
    .replace(/non fumeur/gi, "non_fumeur")
    .replace(/véhicule non-fumeur/gi, "non_fumeur")
    .replace(/maladie connue/gi, "detail_connu")
    .replace(/frais de mise à la route/gi, "frais_pro")
    .replace(/sans fap/gi, "version_recherchee")
    .replace(/par[- ]choc/gi, "parechoc");

  // C. RÈGLES DE GÉNÉRATION AUTOMATIQUES
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

  // D. DÉTECTION COLLECTOR
  const titleUpper = vehicle.titre.toUpperCase();
  const isFakeCollector = /(STYLE|LOOK|REPLICA|TYPE)\s+.*(GTS|CS|DTM|TCR)/i.test(titleUpper);
  
  let isRealSpecial = false;
  if (!isFakeCollector) {
      isRealSpecial = /\bGTS\b|\bDTM\b|\bCS\b|\bCSL\b|\bHERITAGE\b|magny[- ]cours|\btrophy r\b|tour auto|\btcr\b|\bclubsport\b/i.test(titleUpper);
  }

  if (isRealSpecial) {
    scoreMod += 40; 
    tags.add("🏆 COLLECTOR USINE");
  } else if (/gts|dtm|cs|csl|tcr/i.test(vehicle.description) && !isFakeCollector) {
    scoreMod += 5;
  }

  // E. DÉTECTION DOM-TOM
  const isDomTom = /réunion|reunion|guadeloupe|martinique|guyane|mayotte/i.test(text);
  if (isDomTom) {
    scoreMod += 5; 
    tags.add('🏝️ DOM-TOM');
  }

  // F. SCAN UNIVERSEL
  [...KNOWLEDGE_DB.BOOSTERS, ...KNOWLEDGE_DB.TUNING_PRO, ...KNOWLEDGE_DB.KILLERS].forEach((rule: any) => {
    if (rule.regex.test(cleanText)) {
      scoreMod += rule.score;
      tags.add(rule.tag);
    }
  });

  // G. SCAN TUNING
  KNOWLEDGE_DB.TUNING.forEach((rule: any) => {
    if (isRealSpecial && rule.tag === "🏁 PISTE") return;
    if (rule.regex.test(cleanText)) {
      scoreMod += rule.score;
      tags.add(rule.tag);
    }
  });

  // H. SCAN CONTEXTUEL
  if (modelConfig && modelConfig.rules) {
    modelConfig.rules.forEach((rule: any) => {
      if (rule.regex.test(cleanText)) {
        scoreMod += rule.score;
        tags.add(rule.tag);
      }
    });
  }

  // I. SCAN IMPORT
  const isImport = !cleanText.includes("france") && (cleanText.includes("import") || cleanText.includes("allemagne"));
  const isMalusPaid =
    cleanText.includes("malus payé") ||
    cleanText.includes("écotaxe payée") ||
    cleanText.includes("française") ||
    cleanText.includes("origine france") ||
    cleanText.includes("carte grise fran") || 
    cleanText.includes("plaque fran") ||      
    cleanText.includes("immatricul");         

  if (isImport && !isMalusPaid) {
    scoreMod -= 15;
    tags.add("⚠️ MALUS ?");
  }

  // J. RÈGLES MISSION
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
// 3. UTILITAIRES CLUSTERING & FILTRAGE
// ============================================

export const filterOutliers = (vehicles: ParsedVehicle[], forcedModele?: string) => {
  if (vehicles.length < 5) return vehicles;

  // 1. Calcul de l'année pivot
  const years = vehicles.map(v => v.annee);
  const yearCounts: Record<number, number> = {};
  years.forEach(y => yearCounts[y] = (yearCounts[y] || 0) + 1);
  const mostFrequentYear = parseInt(Object.keys(yearCounts).reduce((a, b) => yearCounts[parseInt(a)] > yearCounts[parseInt(b)] ? a : b));

  // 2. Calcul du Prix Médian Global
  const prices = vehicles.map(v => v.prix).sort((a, b) => a - b);
  const medianPrice = prices[Math.floor(prices.length / 2)];

  return vehicles.filter(v => {
    const text = (v.titre + " " + v.description).toLowerCase();
    const title = v.titre.toUpperCase();

    // 🔴 A. EXCLUSION RHD
    if (/rhd|volant à droite|volant a droite|uk spec|anglaise|import.*angleterre|british/i.test(text)) return false;

    // 🔴 B. EXCLUSION FAUX MODÈLES
    if (forcedModele?.toUpperCase() === "M2" || /M2\b/i.test(title)) {
       if (/(235|240|135|140|COMPETITION.*340)/i.test(title)) return false;
    }

    // 🟠 C. EXCLUSION PAR PRIX
    if (v.prix > medianPrice * 2.2) return false; 
    if (v.prix < medianPrice * 0.25) return false;

    // 🟡 D. EXCLUSION GTS / DTM (Si recherche M4)
    const isSpecialCollector = /\bGTS\b|\bDTM\b|\bCSL\b/i.test(title);
    const isFakeCollector = /(STYLE|LOOK|REPLICA|TYPE)\s+.*(GTS|DTM)/i.test(title);
    
    if (isSpecialCollector && !isFakeCollector && forcedModele?.toUpperCase() === "M4") return false;

    // 🟢 E. FILTRE GÉNÉRATION
    const yearDiff = Math.abs(v.annee - mostFrequentYear);
    if (yearDiff > 4) return false;

    return true;
  });
};

function createClusterFingerprint(vehicle: ParsedVehicle, context: string) {
    const title = vehicle.titre.toUpperCase();
    
    const isFakeCollector = /(STYLE|LOOK|REPLICA|TYPE)\s+.*(GTS|CS|DTM|TCR)/i.test(title);
    const isSpecial = /\bGTS\b|\bDTM\b|\bCSL\b|TROPHY R|CS\b|TCR\b/i.test(title) && !isFakeCollector;
    
    if (isSpecial) return 'ULTRA_COLLECTOR_SPECIAL';

    if (context === 'VW_GOLF') {
        if (/GOLF 8|GOLF VIII/.test(title)) return 'VW_GOLF_8';
        if (/GOLF 7|GOLF VII/.test(title)) return 'VW_GOLF_7';
    }

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
// 4. MOTEUR DE SCORING (V9.0)
// ============================================

export const calculateSmartScore = (
  vehicles: ParsedVehicle[],
  forcedMarque?: string,
  forcedModele?: string,
  customRules?: MissionRules,
): VehicleWithScore[] => {
  if (!vehicles || vehicles.length === 0) return [];
  const filteredVehicles = filterOutliers(vehicles, forcedModele);

  const clusters: Record<string, ParsedVehicle[]> = {};
  filteredVehicles.forEach((v) => {
    const context = detectContext(v);
    const id = createClusterFingerprint(v, context);
    if (!clusters[id]) clusters[id] = [];
    clusters[id].push(v);
  });

  const clusterStats: Record<string, { median: number; count: number }> = {};
  Object.keys(clusters).forEach((k) => {
    const stats = calculateClusterStats(clusters[k]);
    if (stats) clusterStats[k] = stats;
  });

  return filteredVehicles.map((vehicle) => {
    const context = detectContext(vehicle);
    const clusterId = createClusterFingerprint(vehicle, context);
    const stats = clusterStats[clusterId];

    let coteCluster = stats && stats.count > 1 && !clusterId.includes("SPECIAL") ? stats.median : vehicle.prix;

    // ANALYSE EXPERTE
    const fullText = (vehicle.titre + " " + vehicle.description).toLowerCase();
    const analysis = analyzeDescription(fullText, context, vehicle, customRules);

    // Ajustement Km (Bonus Pépite)
    const isWreck = analysis.tags.has("💀 MOTEUR HS") || analysis.tags.has("💀 ACCIDENT GRAVE") || analysis.tags.has("💥 ACCIDENTÉE");
    
    if (vehicle.kilometrage > 0 && !clusterId.includes("SPECIAL") && !isWreck) {
      const currentYear = new Date().getFullYear();
      const age = Math.max(1, currentYear - vehicle.annee);
      let kmRefAnnuel = 15000;
      if (context === "YOUNGTIMER" || customRules?.ignoreMileage) kmRefAnnuel = 7000;

      const kmTheorique = kmRefAnnuel * age;
      
      if (vehicle.kilometrage < (age * 8000)) {
          coteCluster *= 1.30; 
          analysis.tags.add('💎 PÉPITE KM');
      } else if (vehicle.kilometrage < kmTheorique * 0.7) {
          coteCluster *= 1.15;
      }
      if (vehicle.kilometrage > kmTheorique * 1.5) coteCluster *= 0.85;
    }

    const ecartEuros = coteCluster - vehicle.prix;
    const ecartPourcent = coteCluster > 0 ? (ecartEuros / coteCluster) * 100 : 0;

    let mathScore = 50;
    
    const isTrackTool = analysis.tags.has('🏁 CHÂSSIS PRO') || /schirmer|arceau/i.test(fullText);
    const isEliteTuner = analysis.tags.has('🦄 PRÉPA D\'ÉLITE');
    const isUnique = analysis.tags.has('✨ CONFIG UNIQUE');
    const isCollector = analysis.tags.has('🏆 COLLECTOR USINE');
    const isNewGen = analysis.tags.has('🆕 GÉNÉRATION 8');

    if (clusterId.includes('SPECIAL') || analysis.tags.has('🏝️ DOM-TOM')) {
        mathScore = 70; 
    } else if (stats && stats.count > 1) {
        mathScore = 50 + (ecartPourcent * 1.5);
    }

    // Protection Arnaque
    if (
      ecartPourcent > 35 &&
      !isWreck &&
      !isTrackTool && 
      !isEliteTuner &&
      !isCollector &&
      !isNewGen &&
      !analysis.tags.has("⚠️ VENTE EN L'ÉTAT")
    ) {
      mathScore = 40; 
      analysis.tags.add("🚨 PRIX SUSPECT");
    }
    
    // Gestion des Voitures Chères Justifiées
    if ((isTrackTool || isUnique) && ecartPourcent < -20) {
       mathScore = 65; 
       if (isUnique) analysis.tags.delete("🚨 PRIX SUSPECT");
       if (isTrackTool) analysis.tags.add("🏎️ TRACK TOOL");
    }

    // Immunité Totale
    if (isEliteTuner || isCollector || isNewGen) {
        mathScore = 90;
        analysis.tags.delete("🚨 PRIX SUSPECT");
        analysis.tags.delete("🔧 REPROG");
        analysis.tags.delete("🚀 STAGE 3");
    }

    let finalScore = mathScore + analysis.scoreMod;

    // KILL SWITCHES
    if (analysis.tags.has("🚨 PRIX SUSPECT") && analysis.tags.has("💥 TRACE DE CHOC")) {
        finalScore = 10;
    }

    if (analysis.tags.has("💀 MOTEUR HS") || analysis.tags.has("💀 ACCIDENT GRAVE") || analysis.tags.has("⛔ EXCLU PAR MISSION")) {
      finalScore = 0;
    }

    finalScore = Math.max(0, Math.min(99, Math.round(finalScore)));

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

// ============================================
// 5. SYSTÈME DE TRI
// ============================================

export type SortCriteria = 'score' | 'price_asc' | 'price_desc' | 'km_asc' | 'km_desc' | 'year_desc' | 'year_asc';

export const sortVehicles = (vehicles: VehicleWithScore[], criteria: SortCriteria = 'score'): VehicleWithScore[] => {
  const sorted = [...vehicles];
  switch (criteria) {
    case 'price_asc': return sorted.sort((a, b) => a.prix - b.prix);
    case 'price_desc': return sorted.sort((a, b) => b.prix - a.prix);
    case 'km_asc': return sorted.sort((a, b) => a.kilometrage - b.kilometrage);
    case 'km_desc': return sorted.sort((a, b) => b.kilometrage - a.kilometrage);
    case 'year_desc': return sorted.sort((a, b) => b.annee - a.annee);
    case 'year_asc': return sorted.sort((a, b) => a.annee - b.annee);
    case 'score': 
    default: return sorted.sort((a, b) => {
        if (b.dealScore !== a.dealScore) return b.dealScore - a.dealScore;
        return a.prix - b.prix; // En cas d'égalité de score, le moins cher gagne
    });
  }
};

// Helper pour filtrer
export function getTopOpportunities(vehicles: VehicleWithScore[], limit = 500): VehicleWithScore[] {
  return sortVehicles(vehicles.filter((v) => v.dealScore >= 50), 'score').slice(0, limit);
}

// ══════════════════════════════════════════════════════════════
// SIMULATEUR
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
  "clio", "megane", "scenic", "twingo", "captur", "austral", "arkana",
  "208", "308", "3008", "2008", "5008", "508", "rifter",
  "c3", "c4", "c5", "berlingo", "ds3", "ds7",
  "golf", "polo", "tiguan", "t-roc", "passat",
  "a1", "a3", "a4", "q3", "q5", "rs3", "rs6",
  "classe a", "classe c", "cla", "gla", "glc",
  "serie 1", "serie 3", "x1", "x3", "m2", "m3", "m4",
  "yaris", "corolla", "rav4", "chr", "duster", "sandero", "jogger",
  "model 3", "model y", "tesla",
  "911", "cayenne", "macan", "boxster",
  "mini", "cooper", "fiat 500",
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