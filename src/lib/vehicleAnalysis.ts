import { VehicleWithScore } from './csvParser';

// Mots-clés qui augmentent la valeur (Options / Rassurance)
// On ajoute des termes spécifiques très recherchés
const BONUS_KEYWORDS = [
  'garantie', 'carnet', 'suivi', 'factures', 'première main', '1ère main',
  'toit ouvrant', 'pano', 'cuir', 'matrix', 'bang', 'olufsen', 'rs', 'quattro',
  'virtual', 'cockpit', 'carplay', 'camera', '360', 'acc', 'adaptatif', 
  'echappement', 'sport', 'bucket', 'recaro', 'bose', 'harman'
];

// Mots-clés qui diminuent la confiance
const MALUS_KEYWORDS = [
  'prévoir', 'dans l\'état', 'panne', 'bruit', 'voyant', 'accident', 'choc', 'export', 
  'problème', 'hs', 'moteur hs', 'boite hs'
];

/**
 * ALGORITHME V3 "PURISTE" : Focus sur Km & Options
 * L'année compte très peu (simple ajustement marginal).
 * Le kilométrage et les options dictent le score.
 */
export const calculateSmartScore = (vehicles: any[]): VehicleWithScore[] => {
  if (!vehicles || vehicles.length < 5) return vehicles;

  // 1. Calcul des Moyennes Globales
  const avgPrice = vehicles.reduce((sum, v) => sum + v.prix, 0) / vehicles.length;
  const avgKm = vehicles.reduce((sum, v) => sum + v.kilometrage, 0) / vehicles.length;
  const avgYear = vehicles.reduce((sum, v) => sum + v.annee, 0) / vehicles.length;

  // 2. Détermination du Coût du Kilomètre (Le facteur dominant)
  let pricePerKm = 0;
  let kmWeight = 0;

  vehicles.forEach(v => {
    if (v.kilometrage !== avgKm) {
      const kmDiff = v.kilometrage - avgKm;
      const priceDiff = v.prix - avgPrice;
      pricePerKm += (priceDiff / kmDiff);
      kmWeight++;
    }
  });

  // Coefficient Km (ex: -0.08€ / km)
  // On le force à être négatif (plus de km = moins cher)
  const rawCoefKm = kmWeight > 0 ? (pricePerKm / kmWeight) : -0.05;
  const SAFE_COEF_KM = -Math.abs(rawCoefKm); 

  // Coefficient Année (Ajustement marginal)
  // On fixe arbitrairement une valeur faible (ex: 200€ par an) juste pour départager
  // Au lieu de calculer une régression temporelle complexe.
  const SAFE_COEF_YEAR = 250; 

  // 3. Scoring Individuel
  return vehicles.map(vehicle => {
    // A. Calcul du Prix Théorique
    const yearDiff = vehicle.annee - avgYear;
    const kmDiff = vehicle.kilometrage - avgKm;

    // Formule "Puriste" : Le prix dépend surtout du Km
    const theoreticalPrice = avgPrice + (yearDiff * SAFE_COEF_YEAR) + (kmDiff * SAFE_COEF_KM);

    // B. Écart Réel
    const difference = theoreticalPrice - vehicle.prix;
    const percentDiff = (difference / theoreticalPrice) * 100;

    // C. Analyse Sémantique (BOOSTÉ !!!)
    // Les options comptent double maintenant
    let textBonus = 0;
    const fullText = (vehicle.titre + ' ' + (vehicle.description || '')).toLowerCase();
    
    // +4 points par option importante (au lieu de 2)
    // Une voiture "full option" peut gagner 20 points de score juste grâce à ça
    BONUS_KEYWORDS.forEach(word => { if (fullText.includes(word)) textBonus += 4; }); 
    
    // Malus sévère pour les pannes
    MALUS_KEYWORDS.forEach(word => { if (fullText.includes(word)) textBonus -= 20; });

    // D. Calcul du Deal Score (0 à 100)
    // Base 50 + (Écart Prix * 2) + (Bonus Options)
    // On augmente le multiplicateur de l'écart prix (x2 au lieu de x1.5) pour être plus radical sur les bonnes affaires financières
    let score = 50 + (percentDiff * 2.0) + textBonus;

    // Bornage 0-100 (mais on laisse monter à 99 facile si c'est une tuerie)
    score = Math.max(10, Math.min(99, Math.round(score)));

    // E. Label de Fiabilité (Indicateur visuel simple)
    // Moins de km que la moyenne = fiable
    let reliability = 5;
    if (vehicle.kilometrage < avgKm) reliability += 2;
    if (vehicle.kilometrage < (avgKm * 0.5)) reliability += 2; // Très peu kilométrée
    if (textBonus > 0) reliability += 1; // A des options/suivi

    return {
      ...vehicle,
      dealScore: score,
      gain_potentiel: Math.round(difference),
      coteCluster: Math.round(theoreticalPrice),
      ecartEuros: Math.round(difference),
      ecartPourcent: Math.round(percentDiff),
      fiabilite: Math.min(10, reliability)
    };
  });
};

/**
 * Filtre les aberrations
 */
export const filterOutliers = (vehicles: any[]) => {
  if (vehicles.length < 10) return vehicles;

  // Filtrage basique
  const cleanBasic = vehicles.filter(v => 
    v.prix > 1000 && 
    v.kilometrage > 100 && 
    v.kilometrage < 600000 
  );

  const avg = cleanBasic.reduce((sum, v) => sum + v.prix, 0) / cleanBasic.length;
  
  // On garde une fourchette large car les options peuvent faire varier le prix fortement
  return cleanBasic.filter(v => {
    return v.prix > (avg * 0.25) && v.prix < (avg * 2.5);
  });
};