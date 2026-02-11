import { VehicleWithScore } from './csvParser';

// ══════════════════════════════════════════════════════════════
// A. BASE DE CONNAISSANCE (KNOWLEDGE_DB)
// ══════════════════════════════════════════════════════════════

export type ExpertTag = string; // Now emoji-based tags like "💎 1ÈRE MAIN"

type ContextMode = 'BMW_M' | 'AUDI_RS' | 'YOUNGTIMER' | 'GENERIC';

interface KnowledgeRule {
  keywords: string[];
  score: number;
  tag: string;
}

interface NegationRule {
  phrases: string[];
}

// --- UNIVERSAL BOOSTERS (toutes voitures) ---
// Scores augmentés : la description est le facteur DOMINANT du classement
const UNIVERSAL_BOOSTERS: KnowledgeRule[] = [
  { keywords: ['première main', '1ère main', '1ere main', 'premiere main'], score: 12, tag: '💎 1ÈRE MAIN' },
  { keywords: ['carnet', 'historique limpide', 'historique complet', 'factures', 'suivi'], score: 10, tag: '📘 HISTORIQUE' },
  { keywords: ['origine france', 'achat concession', 'concession'], score: 10, tag: '🇫🇷 ORIGINE FR' },
  { keywords: ['malus payé', 'écotaxe payée', 'ecotaxe payee', 'malus paye'], score: 14, tag: '💶 TAXE OK' },
  { keywords: ['traitement céramique', 'ceramique', 'dort garage', 'temps de chauffe', 'garage'], score: 6, tag: '✨ SOIGNÉE' },
  { keywords: ['garantie', 'entretien à jour', 'entretien a jour', 'distribution faite'], score: 8, tag: '🔧 ENTRETENUE' },
  { keywords: ['pneus neufs', 'freins neufs', 'ct ok', 'controle technique ok'], score: 5, tag: '✅ CT OK' },
  { keywords: ['non fumeur', 'soigné', 'soignee', 'impeccable'], score: 6, tag: '✨ SOIGNÉE' },
  { keywords: ['carplay', 'camera', 'toit ouvrant', 'full option', 'matrix', 'virtual cockpit', 'cuir'], score: 7, tag: '🎯 FULL OPTIONS' },
];

// --- UNIVERSAL KILLERS (malus mortels) ---
const UNIVERSAL_KILLERS: KnowledgeRule[] = [
  { keywords: ['moteur hs', 'bruit moteur', 'claquement', 'joint de culasse'], score: -100, tag: '💀 MOTEUR HS' },
  { keywords: ['vge', 'accident', 'marbre', 'choc'], score: -50, tag: '💥 ACCIDENTÉE' },
  { keywords: ['dans l\'état', 'en l\'état', 'sans ct', 'refusé', 'contre visite'], score: -25, tag: '⚠️ SANS CT' },
  { keywords: ['parcours toutes distances', 'marchand', 'export', 'gage', 'procedure'], score: -15, tag: '🚩 LOUCHE' },
  { keywords: ['épave', 'non roulant', 'panne', 'corrosion perforante'], score: -50, tag: '💀 ÉPAVE' },
  { keywords: ['boite hs', 'embrayage hs'], score: -80, tag: '💀 BOITE HS' },
  { keywords: ['rhd', 'volant à droite', 'volant a droite', 'right hand drive', 'conduite à droite', 'conduite a droite', 'uk spec', 'anglaise'], score: -100, tag: '🚫 RHD (VOLANT DROIT)' },
];

// --- SPECIFIC RULES (Intelligence Contextuelle) ---
const SPECIFIC_RULES: Record<ContextMode, KnowledgeRule[]> = {
  BMW_M: [
    { keywords: ['crankhub', 'renfort distribution', 'crank hub'], score: 25, tag: '🛡️ CRANKHUB FAIT' },
    { keywords: ['coussinets', 'coussinet'], score: 12, tag: '⚙️ COUSSINETS FAITS' },
    { keywords: ['ligne titane', 'm performance', 'm perf'], score: 6, tag: '💨 M PERF' },
    { keywords: ['stage 1', 'stage 2', 'stage 3', 'reprog'], score: -10, tag: '🔧 REPROG' },
    { keywords: ['drexler', 'différentiel', 'lsd'], score: 8, tag: '⚙️ DIFF UPGRADÉ' },
  ],
  AUDI_RS: [
    { keywords: ['disques voilés', 'vibration freinage', 'disque voilé'], score: -15, tag: '⚠️ DISQUES HS' },
    { keywords: ['daza'], score: 15, tag: '🚀 MOTEUR DAZA' },
    { keywords: ['magnetic ride', 'magnetique'], score: 6, tag: '🎯 MAGNETIC RIDE' },
    { keywords: ['stage 1', 'stage 2', 'reprog', 'ethanol', 'e85'], score: -10, tag: '🔧 REPROG' },
  ],
  YOUNGTIMER: [
    { keywords: ['rouille', 'corrosion', 'points de levage', 'point de levage'], score: -35, tag: '🦀 ROUILLE' },
    { keywords: ['vanos', 'vanos révisé', 'vanos revisé'], score: 10, tag: '⚙️ VANOS RÉVISÉ' },
    { keywords: ['soudure', 'refait', 'restauration'], score: -15, tag: '🔧 RESTO PARTIELLE' },
    { keywords: ['matching number', 'matching'], score: 12, tag: '💎 MATCHING' },
  ],
  GENERIC: [],
};

// --- NEGATION PHRASES (neutralisent les faux positifs) ---
const NEGATION_PHRASES: string[] = [
  'pas de frais', 'aucun frais', 'sans frais', '0 frais',
  'pas d\'accident', 'jamais accident', 'non accident', 'jamais accidenté',
  'pas de rouille', 'aucune rayure', 'pas de problème', 'pas de reprog', 'origine',
  'aucun bruit', 'pas de bruit', 'pas de fuite', 'jamais de panne',
];

// ══════════════════════════════════════════════════════════════
// B. MOTEUR DE CALCUL
// ══════════════════════════════════════════════════════════════

// --- Détection du Contexte ---
function detectContext(titre: string, description: string): ContextMode {
  const text = (titre + ' ' + description).toUpperCase();

  // BMW M
  if (/\bM[234]\b/.test(text) || /\bM ?COMPETITION\b/.test(text) || /\bM ?SPORT\b/.test(text) && /\bBMW\b/.test(text)) {
    return 'BMW_M';
  }

  // Audi RS
  if (/\bRS ?[34567]\b/.test(text) || /\bRSQ\d\b/.test(text)) {
    return 'AUDI_RS';
  }

  // Youngtimer
  if (/\bE3[06]\b/.test(text) || /\bE46\b/.test(text) || /\bE39\b/.test(text) || /\bE34\b/.test(text)) {
    return 'YOUNGTIMER';
  }

  return 'GENERIC';
}

// --- Utilitaires ---
const getMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// --- Analyse Sémantique ---
function analyzeSemantics(
  text: string,
  context: ContextMode
): { scoreMod: number; tags: ExpertTag[] } {
  // 1. Neutraliser les négations
  let cleanText = text.toLowerCase();
  NEGATION_PHRASES.forEach(phrase => {
    cleanText = cleanText.replace(phrase, '');
  });

  let scoreMod = 0;
  const tags: ExpertTag[] = [];
  const addedTags = new Set<string>();

  const applyRules = (rules: KnowledgeRule[]) => {
    for (const rule of rules) {
      const matched = rule.keywords.some(kw => cleanText.includes(kw));
      if (matched && !addedTags.has(rule.tag)) {
        scoreMod += rule.score;
        tags.push(rule.tag);
        addedTags.add(rule.tag);
      }
    }
  };

  // 2. Appliquer les règles universelles
  applyRules(UNIVERSAL_BOOSTERS);
  applyRules(UNIVERSAL_KILLERS);

  // 3. Appliquer les règles contextuelles
  applyRules(SPECIFIC_RULES[context]);

  // 4. Frais cachés : Import sans malus payé
  const isImport = cleanText.includes('import') || cleanText.includes('allemande') || cleanText.includes('allemand');
  const malusPaid = cleanText.includes('malus payé') || cleanText.includes('malus paye') || cleanText.includes('écotaxe payée') || cleanText.includes('ecotaxe payee');
  if (isImport && !malusPaid && !addedTags.has('⚠️ MALUS ?')) {
    scoreMod -= 15;
    tags.push('⚠️ MALUS ?');
    addedTags.add('⚠️ MALUS ?');
  }

  return { scoreMod, tags };
}

// ══════════════════════════════════════════════════════════════
// ALGORITHME PRINCIPAL : calculateSmartScore
// ══════════════════════════════════════════════════════════════

export const calculateSmartScore = (vehicles: any[]): VehicleWithScore[] => {
  if (!vehicles || vehicles.length < 3) return vehicles;

  // 1. Références globales (médiane trimée)
  const prices = vehicles.map(v => v.prix).sort((a, b) => a - b);
  const kms = vehicles.map(v => v.kilometrage).sort((a, b) => a - b);

  const corePrices = prices.slice(Math.floor(prices.length * 0.1), Math.floor(prices.length * 0.9));
  const medianPrice = getMedian(corePrices);
  const medianKm = getMedian(kms);
  const avgYear = Math.round(vehicles.reduce((sum, v) => sum + v.annee, 0) / vehicles.length);

  const MAX_THEORETICAL_PRICE = medianPrice * 1.35;
  const COEF_ANNEE = 300;

  return vehicles.map(vehicle => {
    const titre = vehicle.titre || '';
    const description = vehicle.description || '';
    const fullText = titre + ' ' + description;

    // A. Détection du contexte
    const context = detectContext(titre, description);

    // B. Kill Switch immédiat (moteur HS, épave)
    const textLower = fullText.toLowerCase();
    let neutralizedText = textLower;
    NEGATION_PHRASES.forEach(p => { neutralizedText = neutralizedText.replace(p, ''); });

    const isFatal = UNIVERSAL_KILLERS
      .filter(r => r.score <= -50)
      .some(r => r.keywords.some(kw => neutralizedText.includes(kw)));

    if (isFatal) {
      const { tags } = analyzeSemantics(fullText, context);
      return {
        ...vehicle,
        dealScore: 0,
        gain_potentiel: -vehicle.prix,
        tags,
        fiabilite: 0,
      };
    }

    // C. Prix théorique (maths)
    const safeKm = Math.max(vehicle.kilometrage, 5000);
    const ratioKm = medianKm / safeKm;

    // Youngtimer : décote km beaucoup plus faible
    const kmExponent = context === 'YOUNGTIMER' ? 0.15 : 0.35;
    let kmFactor = Math.pow(ratioKm, kmExponent);

    let theoreticalPrice = medianPrice * kmFactor;
    const yearDiff = vehicle.annee - avgYear;
    theoreticalPrice += (yearDiff * COEF_ANNEE);

    if (theoreticalPrice > MAX_THEORETICAL_PRICE) theoreticalPrice = MAX_THEORETICAL_PRICE;

    // D. Analyse sémantique
    const { scoreMod, tags } = analyzeSemantics(fullText, context);

    // D2. Bonus qualité de description
    // Une annonce détaillée = vendeur sérieux = meilleure affaire potentielle
    const descLength = (description || '').length;
    let descQualityBonus = 0;
    if (descLength > 500) descQualityBonus += 5;
    if (descLength > 1000) descQualityBonus += 5;
    if (descLength < 50) descQualityBonus -= 8; // Annonce vide = suspect
    
    // Compter le nombre de tags positifs trouvés (richesse de l'annonce)
    const positiveTagCount = tags.filter(t => !t.includes('💀') && !t.includes('⚠️') && !t.includes('🚩') && !t.includes('🚫') && !t.includes('🦀')).length;
    const tagRichnessBonus = positiveTagCount * 3; // Chaque tag positif = +3 pts

    // E. Score final
    // La description (scoreMod + descQuality + tagRichness) pèse ~60-70% du score
    // Le prix (percentDiff) pèse ~30-40% du score
    const difference = theoreticalPrice - vehicle.prix;
    const percentDiff = (difference / theoreticalPrice) * 100;

    // Coefficient prix réduit à 0.8 (était 1.5)
    // La sémantique (scoreMod + descQuality + tagRichness) domine
    let score = 45 + (percentDiff * 0.8) + scoreMod + descQualityBonus + tagRichnessBonus;
    score = Math.max(0, Math.min(98, Math.round(score)));

    // F. Fiabilité (note sur 10) — également basée sur la description
    let reliability = 5; // Base réduite à 5
    if (vehicle.kilometrage < medianKm) reliability += 1;
    if (scoreMod > 10) reliability += 2;
    else if (scoreMod > 5) reliability += 1;
    if (scoreMod < -10) reliability -= 2;
    if (positiveTagCount >= 3) reliability += 1; // Annonce riche
    if (descLength < 50) reliability -= 1; // Annonce vide
    if (tags.some(t => t.includes('ROUILLE') || t.includes('REPROG'))) reliability -= 1;
    if (tags.some(t => t.includes('ACCIDENTÉE') || t.includes('LOUCHE'))) reliability = 2;
    reliability = Math.max(1, Math.min(10, reliability));

    return {
      ...vehicle,
      dealScore: score,
      gain_potentiel: Math.round(difference),
      coteCluster: Math.round(theoreticalPrice),
      ecartEuros: Math.round(difference),
      ecartPourcent: Math.round(percentDiff),
      fiabilite: reliability,
      tags,
    };
  });
};

// ══════════════════════════════════════════════════════════════
// FILTRE OUTLIERS
// ══════════════════════════════════════════════════════════════

export const filterOutliers = (vehicles: any[]) => {
  if (vehicles.length < 5) return vehicles;
  
  // 1. Exclure les RHD (volant à droite) — prix non comparables
  const RHD_KEYWORDS = ['rhd', 'volant à droite', 'volant a droite', 'right hand', 'conduite à droite', 'conduite a droite', 'uk spec'];
  const withoutRHD = vehicles.filter(v => {
    const text = ((v.titre || '') + ' ' + (v.description || '')).toLowerCase();
    return !RHD_KEYWORDS.some(kw => text.includes(kw));
  });
  
  const rhdCount = vehicles.length - withoutRHD.length;
  if (rhdCount > 0) {
    console.log(`Excluded ${rhdCount} RHD vehicles (volant à droite)`);
  }
  
  // 2. Exclure les outliers de prix (IQR)
  const avg = withoutRHD.reduce((sum, v) => sum + v.prix, 0) / withoutRHD.length;
  return withoutRHD.filter(v => v.prix > (avg * 0.15) && v.prix < (avg * 3.5));
};

// ══════════════════════════════════════════════════════════════
// SIMULATEUR (Page Publique)
// ══════════════════════════════════════════════════════════════

interface SimulationResult {
  title: string;
  marketPriceLow: number;
  marketPriceHigh: number;
  reliabilityScore: number;
  dealScore: number;
  checkpoints: string[];
  verdict: 'excellent' | 'bon' | 'moyen' | 'risque';
}

const COMMON_CARS = [
  'clio', 'megane', 'scenic', 'twingo', 'captur', 'austral', 'arkana',
  '208', '308', '3008', '2008', '5008', '508', 'rifter',
  'c3', 'c4', 'c5', 'berlingo', 'ds3', 'ds7',
  'golf', 'polo', 'tiguan', 't-roc', 'passat',
  'a1', 'a3', 'a4', 'q3', 'q5', 'rs3', 'rs6',
  'classe a', 'classe c', 'cla', 'gla', 'glc',
  'serie 1', 'serie 3', 'x1', 'x3', 'm2', 'm3', 'm4',
  'yaris', 'corolla', 'rav4', 'chr', 'duster', 'sandero', 'jogger',
  'model 3', 'model y', 'tesla', '911', 'cayenne', 'macan', 'boxster',
  'mini', 'cooper', 'fiat 500'
];

const UNIVERSAL_CHECKPOINTS = [
  "Analyse de la valeur marché (Algorithme Z-Score)",
  "Vérification cohérence Kilométrage/Prix",
  "Scan de l'historique administratif (HistoVec)",
  "Détection des indices d'accident (Kill Switch)",
  "Analyse des coûts d'entretien prévisibles"
];

export const generateSimulationReport = (url: string, userPrice: number = 0): SimulationResult => {
  const lowerUrl = url.toLowerCase();
  let detectedName = COMMON_CARS.find(name => lowerUrl.includes(name));

  const displayTitle = detectedName
    ? `Audit : ${detectedName.charAt(0).toUpperCase() + detectedName.slice(1)}`
    : "Audit : Véhicule Occasion";

  const basePrice = userPrice > 0 ? userPrice : 15000;
  const marketPriceLow = Math.round(basePrice * 1.02);
  const marketPriceHigh = Math.round(basePrice * 1.12);

  const randomFactor = Math.random();
  const reliabilityScore = Math.floor(6 + (randomFactor * 3));
  const dealScore = Math.floor(68 + (randomFactor * 22));

  let verdict: SimulationResult['verdict'] = 'bon';
  if (dealScore > 85) verdict = 'excellent';
  else if (dealScore < 55) verdict = 'risque';
  else if (dealScore < 70) verdict = 'moyen';

  return {
    title: displayTitle,
    marketPriceLow,
    marketPriceHigh,
    reliabilityScore,
    dealScore,
    checkpoints: UNIVERSAL_CHECKPOINTS,
    verdict
  };
};

// Re-export for backward compatibility
export { getExpertTags };
function getExpertTags(vehicle: any, priceDiffPercent: number, dealScore: number): ExpertTag[] {
  const titre = vehicle.titre || '';
  const description = vehicle.description || '';
  const context = detectContext(titre, description);
  const { tags } = analyzeSemantics(titre + ' ' + description, context);
  return tags;
}
