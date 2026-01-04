import Papa from 'papaparse';

export interface ParsedVehicle {
  id: string;
  titre: string;
  marque: string;
  modele: string;
  prix: number;
  kilometrage: number;
  annee: number;
  carburant: string;
  transmission: string;
  puissance: number;
  image: string;
  lien: string;
  localisation: string;
}

export interface VehicleWithScore extends ParsedVehicle {
  clusterId: string;          // Fingerprint: MARQUE_MODELE_ANNEE_CARBURANT_TRANS
  clusterSize: number;        // Nombre de véhicules dans le cluster
  coteCluster: number;        // Prix moyen du cluster exact
  ecartEuros: number;         // coteCluster - prix (positif = bonne affaire)
  ecartPourcent: number;      // (ecartEuros / coteCluster) * 100
  dealScore: number;          // 0-100, higher = better deal
  isPremium: boolean;         // Version premium détectée (S-Line, AMG, etc.)
  hasEnoughData: boolean;     // True si cluster >= 3 véhicules
  // Legacy compatibility
  prixMoyen: number;
  prixMedian: number;
  ecart: number;
  segmentKey: string;
}

export interface ColumnMapping {
  titre: number;
  marque: number;
  modele: number;
  prix: number;
  kilometrage: number;
  annee: number;
  carburant: number;
  transmission: number;
  puissance: number;
  image: number;
  lien: number;
  localisation: number;
}

// ============================================
// SMART COLUMN DETECTION
// ============================================

const COLUMN_PATTERNS: Record<keyof ColumnMapping, RegExp[]> = {
  titre: [/title/i, /titre/i, /name/i, /annonce/i, /vehicle/i, /véhicule/i],
  marque: [/make/i, /marque/i, /brand/i, /manufacturer/i],
  modele: [/model/i, /modèle/i, /modele/i],
  prix: [/price/i, /prix/i, /€/i, /cost/i, /tarif/i],
  kilometrage: [/mileage/i, /km/i, /kilom/i, /odometer/i],
  annee: [/year/i, /année/i, /annee/i, /date/i, /registration/i],
  carburant: [/fuel/i, /carburant/i, /energy/i, /énergie/i, /motorisation/i],
  transmission: [/transmission/i, /gearbox/i, /boîte/i, /boite/i, /gear/i],
  puissance: [/power/i, /puissance/i, /hp/i, /cv/i, /ch/i, /bhp/i],
  image: [/image/i, /img/i, /photo/i, /picture/i, /src/i, /thumbnail/i],
  lien: [/link/i, /url/i, /href/i, /lien/i],
  localisation: [/location/i, /city/i, /ville/i, /localisation/i, /region/i, /département/i],
};

const BRANDS = [
  'Audi', 'BMW', 'Mercedes', 'Volkswagen', 'Renault', 'Peugeot', 'Citroën', 'Citroen',
  'Toyota', 'Honda', 'Ford', 'Opel', 'Fiat', 'Seat', 'Skoda', 'Hyundai', 'Kia',
  'Nissan', 'Mazda', 'Volvo', 'Porsche', 'Jaguar', 'Land Rover', 'Mini', 'Tesla',
  'Dacia', 'Suzuki', 'Mitsubishi', 'Lexus', 'Alfa Romeo', 'Jeep', 'DS', 'Cupra',
  'Chevrolet', 'Smart', 'Maserati', 'Ferrari', 'Lamborghini', 'Bentley', 'Aston Martin',
];

function detectColumnIndex(headers: string[], patterns: RegExp[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase().trim();
    for (const pattern of patterns) {
      if (pattern.test(header)) {
        return i;
      }
    }
  }
  return -1;
}

function detectColumns(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};
  
  for (const [key, patterns] of Object.entries(COLUMN_PATTERNS)) {
    const idx = detectColumnIndex(headers, patterns);
    if (idx >= 0) {
      mapping[key as keyof ColumnMapping] = idx;
    }
  }
  
  return mapping;
}

// ============================================
// DATA EXTRACTION & CLEANING
// ============================================

function cleanPrice(value: string): number {
  if (!value) return 0;

  const raw = String(value).trim();
  // Remove currency symbols, spaces, and convert to number
  const cleaned = raw
    .replace(/[€$£\s\u00a0]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const num = parseFloat(cleaned);
  if (!Number.isFinite(num)) return 0;

  // Guardrail: prevent years/dates from being interpreted as prices
  // (common failure mode when the "prix" column isn't detected and we fallback-scan fields)
  const looksLikeYearOnly = /^\d{4}$/.test(cleaned) && num >= 1980 && num <= 2026;
  if (looksLikeYearOnly) return 0;

  // e.g. "2019/06" or "mise en circulation: 2020" should not become a 2,019€ price
  const containsYearToken = /\b(19[89]\d|20[0-2]\d)\b/.test(raw);
  const hasCurrencyHint = /[€$£]/.test(raw) || /\b(eur|euro)\b/i.test(raw);
  if (containsYearToken && !hasCurrencyHint && num <= 3000) return 0;

  // Validate range (500€ - 2M€)
  if (num >= 500 && num <= 2000000) return Math.round(num);
  return 0;
}

function cleanKilometrage(value: string): number {
  if (!value) return 0;
  // Remove "km", spaces, dots
  const cleaned = value.replace(/km/gi, '').replace(/[\s\u00a0.]/g, '').replace(',', '');
  const num = parseInt(cleaned);
  // Validate range (0 - 500,000 km)
  if (num >= 0 && num <= 500000) return num;
  return 0;
}

function cleanYear(value: string): number {
  if (!value) return 0;
  // Word boundaries are critical so a price like "19990" does NOT become year "1999"
  const match = String(value).match(/\b(19[89]\d|20[0-2]\d)\b/);
  if (match) {
    const year = parseInt(match[1]);
    if (year >= 1980 && year <= 2026) return year;
  }
  return 0;
}

function cleanPuissance(value: string): number {
  if (!value) return 0;
  const match = value.match(/(\d{2,4})\s*(?:cv|ch|hp|bhp)/i);
  if (match) {
    const power = parseInt(match[1]);
    if (power >= 50 && power <= 2000) return power;
  }
  return 0;
}

function extractBrand(text: string): string {
  const lower = text.toLowerCase();
  for (const brand of BRANDS) {
    if (lower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return 'Autre';
}

function extractModel(text: string, brand: string): string {
  if (brand === 'Autre') return 'Inconnu';
  
  // Remove brand from title and get remaining words
  const withoutBrand = text.replace(new RegExp(brand, 'gi'), '').trim();
  const words = withoutBrand.split(/\s+/).filter(w => w.length > 1 && !/^\d+$/.test(w));
  
  if (words.length > 0) {
    return words.slice(0, 2).join(' ').toUpperCase();
  }
  return 'Inconnu';
}

function extractCarburant(text: string): string {
  const lower = text.toLowerCase();
  if (/électrique|electric|ev\b/i.test(lower)) return 'electrique';
  if (/hybride|hybrid|phev/i.test(lower)) return 'hybride';
  if (/diesel|hdi|tdi|dci|cdti|bluehdi/i.test(lower)) return 'diesel';
  if (/essence|tsi|tfsi|tce|puretech|ecoboost|petrol/i.test(lower)) return 'essence';
  if (/gpl|gnv|lpg/i.test(lower)) return 'gpl';
  return 'autre';
}

function extractTransmission(text: string): string {
  const lower = text.toLowerCase();
  if (/automatique|auto|bva|dsg|s.?tronic|tiptronic|cvt|edc|eat|dct/i.test(lower)) return 'automatique';
  if (/manuelle?|manuel|bvm|mt\b/i.test(lower)) return 'manuelle';
  return 'autre';
}

// ============================================
// SMART ROW PARSING
// ============================================

function parseRow(
  row: string[], 
  mapping: Partial<ColumnMapping>,
  index: number
): ParsedVehicle | null {
  const allText = row.join(' ');
  
  // Extract with mapping or fallback to detection
  let titre = mapping.titre !== undefined ? row[mapping.titre] : '';
  let prix = mapping.prix !== undefined ? cleanPrice(row[mapping.prix]) : 0;
  let kilometrage = mapping.kilometrage !== undefined ? cleanKilometrage(row[mapping.kilometrage]) : 0;
  let annee = mapping.annee !== undefined ? cleanYear(row[mapping.annee]) : 0;
  let marque = mapping.marque !== undefined ? row[mapping.marque]?.trim() : '';
  let modele = mapping.modele !== undefined ? row[mapping.modele]?.trim() : '';
  let image = mapping.image !== undefined ? row[mapping.image]?.trim() : '';
  let lien = mapping.lien !== undefined ? row[mapping.lien]?.trim() : '';
  
  // Fallback: scan all fields if primary extraction failed
  if (!prix) {
    for (const field of row) {
      const extracted = cleanPrice(field);
      if (extracted > 0) { prix = extracted; break; }
    }
  }
  
  if (!kilometrage) {
    for (const field of row) {
      if (/\d+\s*km/i.test(field)) {
        const extracted = cleanKilometrage(field);
        if (extracted > 0) { kilometrage = extracted; break; }
      }
    }
  }
  
  if (!annee) {
    for (const field of row) {
      const extracted = cleanYear(field);
      if (extracted > 0) { annee = extracted; break; }
    }
  }
  
  // Extract brand/model from title or all text
  const searchText = titre || allText;
  if (!marque) marque = extractBrand(searchText);
  if (!modele || modele === 'Inconnu') modele = extractModel(searchText, marque);
  
  // Find URLs
  if (!image) {
    const imgUrl = row.find(f => f.startsWith('http') && /\.(jpg|jpeg|png|webp|gif)/i.test(f));
    if (imgUrl) image = imgUrl;
  }
  
  if (!lien) {
    const link = row.find(f => f.startsWith('http') && !image?.includes(f));
    if (link) lien = link;
  }
  
  // Validate minimum required data
  if (prix <= 0) return null;
  if (!titre && marque === 'Autre') return null;
  
  // Build final title if missing
  if (!titre) {
    titre = `${marque} ${modele}`.trim();
  }
  
  return {
    id: `v-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    titre: titre.slice(0, 200),
    marque,
    modele: modele || 'Inconnu',
    prix,
    kilometrage,
    annee: annee || new Date().getFullYear(),
    carburant: extractCarburant(allText),
    transmission: extractTransmission(allText),
    puissance: cleanPuissance(allText),
    image: image || '',
    lien: lien || '#',
    localisation: mapping.localisation !== undefined ? row[mapping.localisation]?.trim() || '' : '',
  };
}

// ============================================
// MAIN PARSER
// ============================================

export function parseCSVFile(file: File): Promise<ParsedVehicle[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const data = results.data as string[][];
          if (data.length < 2) {
            reject(new Error('CSV vide ou invalide'));
            return;
          }
          
          // Detect columns from first row (headers)
          const headers = data[0].map(h => String(h || ''));
          const mapping = detectColumns(headers);
          
          console.log('Detected columns:', mapping);
          console.log('Headers:', headers.slice(0, 10));
          
          // Parse all rows
          const vehicles: ParsedVehicle[] = [];
          for (let i = 1; i < data.length; i++) {
            const row = data[i].map(cell => String(cell || ''));
            if (row.length < 3) continue;
            
            const vehicle = parseRow(row, mapping, i);
            if (vehicle) {
              vehicles.push(vehicle);
            }
          }
          
          console.log(`Parsed ${vehicles.length} vehicles from ${data.length - 1} rows`);
          resolve(vehicles);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => reject(error),
      skipEmptyLines: true,
    });
  });
}

// ============================================
// PRICING ENGINE V2 - EXACT SEGMENTATION
// ============================================

// Premium keywords for version detection (+10% bonus on cote)
const PREMIUM_KEYWORDS = [
  // German performance
  's-line', 'sline', 's line', 'rs', 'rs3', 'rs4', 'rs5', 'rs6', 'rs7',
  'amg', 'amg-line', 'm sport', 'msport', 'm-sport', 'm performance',
  // French premium
  'gt-line', 'gtline', 'gt line', 'initiale', 'initiale paris', 'rivoli',
  'tekno', 'premiere', 'première',
  // Sport versions
  'gti', 'gtd', 'gte', 'cupra', 'fr', 'tsi r', 'vrs', 'rs line',
  'type r', 'type-r', 'nismo', 'n-line', 'n line',
  // Luxury trims
  'avantgarde', 'avant-garde', 'exclusive', 'prestige', 'lounge',
  'business', 'executive', 'premium', 'sport', 'luxe',
  // Italian
  'quadrifoglio', 'veloce', 'speciale',
];

/**
 * Normalize text for consistent fingerprinting
 */
function normalizeForFingerprint(text: string): string {
  return String(text || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^A-Z0-9]/g, '')        // Keep only alphanumeric
    .trim();
}

/**
 * Normalize transmission for fingerprint
 */
function normalizeTransmission(trans: string): string {
  const lower = trans.toLowerCase();
  if (lower === 'automatique' || lower === 'auto') return 'AUTO';
  if (lower === 'manuelle' || lower === 'manuel') return 'MAN';
  return 'AUTRE';
}

/**
 * Normalize fuel type for fingerprint
 */
function normalizeCarburant(carb: string): string {
  const lower = carb.toLowerCase();
  if (lower === 'diesel') return 'DIESEL';
  if (lower === 'essence') return 'ESS';
  if (lower === 'electrique' || lower === 'électrique') return 'ELEC';
  if (lower === 'hybride') return 'HYB';
  return 'AUTRE';
}

/**
 * Create unique cluster fingerprint
 * Format: MARQUE_MODELE_ANNEE_CARBURANT_TRANSMISSION
 */
function createClusterFingerprint(vehicle: ParsedVehicle): string {
  const marque = normalizeForFingerprint(vehicle.marque);
  const modele = normalizeForFingerprint(vehicle.modele);
  const annee = vehicle.annee.toString();
  const carburant = normalizeCarburant(vehicle.carburant);
  const transmission = normalizeTransmission(vehicle.transmission);
  
  return `${marque}_${modele}_${annee}_${carburant}_${transmission}`;
}

/**
 * Detect if vehicle has premium finish based on title
 */
function detectPremiumVersion(titre: string): boolean {
  const lower = titre.toLowerCase();
  return PREMIUM_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * Calculate cluster statistics with IQR outlier removal
 */
function calculateClusterStats(prices: number[]): { moyenne: number; median: number } | null {
  if (prices.length === 0) return null;
  
  const sorted = [...prices].sort((a, b) => a - b);
  
  // IQR outlier removal for 4+ samples
  let filtered = sorted;
  if (sorted.length >= 4) {
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    filtered = sorted.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
  }
  
  if (filtered.length === 0) filtered = sorted;
  
  const moyenne = filtered.reduce((a, b) => a + b, 0) / filtered.length;
  const mid = Math.floor(filtered.length / 2);
  const median = filtered.length % 2 
    ? filtered[mid] 
    : (filtered[mid - 1] + filtered[mid]) / 2;
  
  return { moyenne, median };
}

/**
 * Main pricing engine with exact cluster segmentation
 */
export function calculateDealScores(vehicles: ParsedVehicle[]): VehicleWithScore[] {
  // STEP 1: Create clusters by exact fingerprint
  const clusters: Record<string, ParsedVehicle[]> = {};
  
  for (const vehicle of vehicles) {
    const clusterId = createClusterFingerprint(vehicle);
    if (!clusters[clusterId]) clusters[clusterId] = [];
    clusters[clusterId].push(vehicle);
  }
  
  console.log(`Created ${Object.keys(clusters).length} unique clusters from ${vehicles.length} vehicles`);
  
  // STEP 2: Calculate stats per cluster
  const clusterStats: Record<string, { 
    moyenne: number; 
    median: number; 
    count: number;
  }> = {};
  
  for (const [clusterId, clusterVehicles] of Object.entries(clusters)) {
    const prices = clusterVehicles.map(v => v.prix);
    const stats = calculateClusterStats(prices);
    
    if (stats) {
      clusterStats[clusterId] = {
        moyenne: stats.moyenne,
        median: stats.median,
        count: clusterVehicles.length,
      };
    }
  }
  
  // Log cluster distribution
  const validClusters = Object.values(clusterStats).filter(s => s.count >= 3).length;
  console.log(`${validClusters} clusters with 3+ vehicles (reliable data)`);
  
  // STEP 3: Calculate scores for each vehicle
  return vehicles.map(vehicle => {
    const clusterId = createClusterFingerprint(vehicle);
    const stats = clusterStats[clusterId];
    const isPremium = detectPremiumVersion(vehicle.titre);
    const hasEnoughData = stats ? stats.count >= 3 : false;
    
    // No stats = no comparison possible
    if (!stats) {
      return {
        ...vehicle,
        clusterId,
        clusterSize: 1,
        coteCluster: vehicle.prix,
        ecartEuros: 0,
        ecartPourcent: 0,
        dealScore: 50,
        isPremium,
        hasEnoughData: false,
        // Legacy fields
        prixMoyen: vehicle.prix,
        prixMedian: vehicle.prix,
        ecart: 0,
        segmentKey: clusterId,
      };
    }
    
    // Calculate cote with premium bonus
    let coteCluster = stats.moyenne;
    if (isPremium) {
      // Premium versions are worth 10% more than cluster average
      coteCluster = coteCluster * 1.10;
    }
    
    // Calculate écart (positive = good deal, negative = overpriced)
    const ecartEuros = coteCluster - vehicle.prix;
    const ecartPourcent = (ecartEuros / coteCluster) * 100;
    
    // Deal score: map -30% to +30% écart → 0 to 100 score
    // +30% under market = 100, 0% = 50, +30% over market = 0
    let dealScore: number;
    if (!hasEnoughData) {
      // Not enough data: neutral score
      dealScore = 50;
    } else {
      // Score formula: 50 + (ecartPourcent * 1.67) capped at 0-100
      dealScore = Math.max(0, Math.min(100, 50 + (ecartPourcent * 1.67)));
    }
    
    return {
      ...vehicle,
      clusterId,
      clusterSize: stats.count,
      coteCluster: Math.round(coteCluster),
      ecartEuros: Math.round(ecartEuros),
      ecartPourcent: Math.round(ecartPourcent * 10) / 10,
      dealScore: Math.round(dealScore),
      isPremium,
      hasEnoughData,
      // Legacy fields for compatibility
      prixMoyen: Math.round(stats.moyenne),
      prixMedian: Math.round(stats.median),
      ecart: Math.round(-ecartEuros), // Legacy uses opposite sign
      segmentKey: clusterId,
    };
  });
}

export function getTopOpportunities(vehicles: VehicleWithScore[], limit = 500): VehicleWithScore[] {
  return [...vehicles]
    .filter(v => v.hasEnoughData && v.dealScore >= 50) // Only reliable good deals
    .sort((a, b) => b.dealScore - a.dealScore)
    .slice(0, limit);
}
