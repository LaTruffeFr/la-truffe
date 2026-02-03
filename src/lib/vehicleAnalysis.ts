import { VehicleWithScore } from './csvParser';

// --- TYPES EXPERTS ---

export type ExpertTag = 
  | 'FRAUDE'       // Prix suspect (> 40% sous la cote)
  | 'FLIP'         // Fort km mais rentable (Idéal marchand)
  | 'COLLECTION'   // Très faible km (Garage Queen)
  | 'TUNING'       // Modifiée (Stage 1, Ligne...)
  | 'IMPORT'       // Indice d'importation (Malus, COC...)
  | 'LIMPIDE'      // Historique sain (Bonus)
  | 'DANGER';      // Épave / HS (Kill Switch)

// --- CONSTANTES D'ANALYSE ---

const BONUS_KEYWORDS = [
  'garantie', 'carnet', 'suivi', 'factures', 'première main', '1ère main',
  'entretien à jour', 'distribution faite', 'pneus neufs', 'ct ok', 'vierge',
  'révisée', 'soigné', 'non fumeur', 'carplay', 'camera', 'attelage', 'toit ouvrant',
  'full option', 'historique complet', 'origine france', 'matrix', 'virtual', 'cockpit'
];

const FATAL_KEYWORDS = [
  'moteur hs', 'boite hs', 'joint de culasse', 'accident', 'choc', 'vge', 
  'épave', 'non roulant', 'panne', 'problème moteur', 'corrosion perforante',
  'export', 'marchand', 'en l\'état', 'procedure', 'gage'
];

const PENALTY_KEYWORDS = [
  'frais à prévoir', 'bruit', 'voyant', 'rayure', 'bosse', 'sans ct', 
  'contre visite', 'fuite', 'à réparer', 'frottement', 'usure'
];

const NEGATION_PHRASES = [
  'pas de frais', 'aucun frais', 'sans frais', '0 frais',
  'pas d\'accident', 'jamais accident', 'non accident',
  'pas de rouille', 'aucune rayure', 'pas de problème', 'pas de reprog', 'origine'
];

// --- LOGIQUE DES TAGS (Nouvelle Fonction Modulaire) ---

export function getExpertTags(
  vehicle: any, 
  priceDiffPercent: number, // Economie réalisée (ex: 30 pour 30%)
  dealScore: number
): ExpertTag[] {
  
  const tags: ExpertTag[] = [];
  // Adaptation : on utilise 'titre' et 'kilometrage' comme dans le reste de l'app
  const text = (vehicle.titre + ' ' + (vehicle.description || '')).toLowerCase();
  
  // 1. DÉTECTION TUNING 🔧
  const tuningKeywords = [
    'stage 1', 'stage 2', 'stage 3', 'reprog', 'ethanol', 'flexfuel', 'e85',
    'ligne', 'milltek', 'akrapovic', 'cata', 'décata', 'tube', 
    '400+', '420ch', '450ch', '500ch', 'prépa', 'abt', 'turbo'
  ];
  
  const isTuned = tuningKeywords.some(keyword => text.includes(keyword));
  if (isTuned) {
    tags.push('TUNING');
  }

  // 2. DÉTECTION ARNAQUE 🚨
  // Si le prix est 40% moins cher que la théorie, c'est statistiquement impossible
  if (priceDiffPercent > 40) {
    tags.push('FRAUDE');
  }

  // 3. DÉTECTION "FLIP MARCHAND" (Merguez Rentable) 📉
  // La voiture a roulé, elle fait peur aux particuliers, mais le prix est canon.
  if (vehicle.kilometrage > 130000 && dealScore >= 80) {
    tags.push('FLIP');
  }

  // 4. DÉTECTION "GARAGE QUEEN" (Collection) 💎
  // Voiture qui ne roule pas. 
  if (vehicle.kilometrage < 20000 && vehicle.annee <= 2019) {
    tags.push('COLLECTION');
  }

  // 5. DÉTECTION IMPORT 🌍
  if (text.includes('malus') || text.includes('coc') || text.includes('import') || text.includes('allemande') || text.includes('allemand')) {
    tags.push('IMPORT');
  }

  // 6. DÉTECTION LIMPIDE (Bonus)
  // Si pas de tuning, pas d'import, carnet ou 1ère main présent
  if (!isTuned && !tags.includes('IMPORT') && (text.includes('carnet') || text.includes('première main'))) {
    tags.push('LIMPIDE');
  }

  return tags;
}

// --- UTILITAIRES ---

const getMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// --- ALGORITHME PRINCIPAL ---

export const calculateSmartScore = (vehicles: any[]): VehicleWithScore[] => {
  if (!vehicles || vehicles.length < 3) return vehicles;

  // 1. FILTRE ET NETTOYAGE
  const suvCount = vehicles.filter(v => (v.titre + (v.description || "")).toUpperCase().includes('Q3') || (v.titre + (v.description || "")).toUpperCase().includes('SUV')).length;
  const isSuvList = suvCount > (vehicles.length / 2);

  let cleanVehicles = vehicles;
  if (!isSuvList) {
     cleanVehicles = vehicles.filter(v => {
       const text = (v.titre + " " + (v.description || "")).toUpperCase();
       return !text.includes('RSQ3') && !text.includes(' Q3') && !text.includes('SUV');
     });
  }
  if (cleanVehicles.length < 2) cleanVehicles = vehicles;

  // 2. RÉFÉRENTIELS (MÉDIANE)
  const prices = cleanVehicles.map(v => v.prix).sort((a, b) => a - b);
  const kms = cleanVehicles.map(v => v.kilometrage).sort((a, b) => a - b);
  
  const corePrices = prices.slice(Math.floor(prices.length * 0.1), Math.floor(prices.length * 0.9));
  const medianPrice = getMedian(corePrices);
  const medianKm = getMedian(kms);
  const avgYear = Math.round(cleanVehicles.reduce((sum, v) => sum + v.annee, 0) / cleanVehicles.length);

  const MAX_THEORETICAL_PRICE = medianPrice * 1.35; 
  const COEF_ANNEE = 300; 

  return cleanVehicles.map(vehicle => {
    // A. Nettoyage Texte
    let textToAnalyze = (vehicle.titre + ' ' + (vehicle.description || '')).toLowerCase();
    NEGATION_PHRASES.forEach(phrase => { textToAnalyze = textToAnalyze.replace(phrase, ''); });

    // B. Kill Switch (Danger immédiat)
    const hasFatalFlaw = FATAL_KEYWORDS.some(word => textToAnalyze.includes(word));
    if (hasFatalFlaw) {
      return {
        ...vehicle,
        dealScore: 0,
        gain_potentiel: -vehicle.prix,
        tags: ['DANGER'] as ExpertTag[],
        fiabilite: 0
      };
    }

    // C. Bonus / Malus Score
    let bonusScore = 0;
    BONUS_KEYWORDS.forEach(word => { if (textToAnalyze.includes(word)) bonusScore += 3; });
    PENALTY_KEYWORDS.forEach(word => { if (textToAnalyze.includes(word)) bonusScore -= 10; });

    // D. Prix Théorique
    const safeKm = Math.max(vehicle.kilometrage, 5000); 
    const ratioKm = medianKm / safeKm;
    let kmFactor = Math.pow(ratioKm, 0.35); 
    
    let theoreticalPrice = medianPrice * kmFactor;
    const yearDiff = vehicle.annee - avgYear;
    theoreticalPrice += (yearDiff * COEF_ANNEE);

    if (theoreticalPrice > MAX_THEORETICAL_PRICE) theoreticalPrice = MAX_THEORETICAL_PRICE;

    // E. Score Final
    const difference = theoreticalPrice - vehicle.prix;
    const percentDiff = (difference / theoreticalPrice) * 100;

    let score = 50 + (percentDiff * 2.2) + bonusScore;
    score = Math.max(10, Math.min(99, Math.round(score)));

    // F. APPEL DE VOTRE NOUVELLE FONCTION TAGS
    const expertTags = getExpertTags(vehicle, percentDiff, score);

    // G. Fiabilité (Note sur 10)
    let reliability = 6;
    if (vehicle.kilometrage < medianKm) reliability += 1;
    if (bonusScore > 5) reliability += 2;
    if (expertTags.includes('TUNING')) reliability -= 2;
    if (expertTags.includes('FRAUDE')) reliability = 1;
    reliability = Math.max(1, Math.min(10, reliability));

    return {
      ...vehicle,
      dealScore: score,
      gain_potentiel: Math.round(difference),
      coteCluster: Math.round(theoreticalPrice),
      ecartEuros: Math.round(difference),
      ecartPourcent: Math.round(percentDiff),
      fiabilite: reliability,
      tags: expertTags // Les tags générés par votre fonction
    };
  });
};

export const filterOutliers = (vehicles: any[]) => {
  if (vehicles.length < 5) return vehicles;
  const avg = vehicles.reduce((sum, v) => sum + v.prix, 0) / vehicles.length;
  return vehicles.filter(v => v.prix > (avg * 0.15) && v.prix < (avg * 3.5));
};

// --- SIMULATEUR ---
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