export type Carburant = 'essence' | 'diesel' | 'electrique' | 'hybride' | 'gpl' | 'autre';
export type Transmission = 'manuelle' | 'automatique' | 'autre';

export interface Vehicle {
  id: string;
  titre: string;
  prix: number;
  annee?: number;
  kilometrage: number;
  lien?: string;
  image?: string;
  localisation?: string;
  marque: string;
  modele: string;
  carburant?: Carburant;
  transmission?: Transmission;
  puissance?: number; // CV/HP extracted from title
  // Calculated fields
  prixMoyen?: number;
  prixAjuste?: number; // Price adjusted for km, transmission, power
  gainPotentiel?: number;
  segment?: string;
  scoreConfiance?: number; // 0-100, multi-factor confidence
  ecartKm?: number; // Difference from segment average km
  prixMedianSegment?: number; // Median price of segment
}

export interface MarketStats {
  totalVehicules: number;
  opportunitesDetectees: number;
  margeMoyenne: number;
  budgetTotal: number;
  meilleureAffaire?: Vehicle;
}

export interface FilterState {
  prixMin: number;
  prixMax: number;
  kmMax: number;
  marques: string[];
  gainMin: number;
  carburants?: Carburant[];
}

export interface SegmentStats {
  key: string;
  count: number;
  prixMedian: number;
  prixMoyen: number;
  kmMoyen: number;
  prixParKm: number; // €/km depreciation
}
