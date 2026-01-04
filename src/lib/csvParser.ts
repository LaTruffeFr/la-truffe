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

type ColumnScore = {
  idx: number;
  header: string;
  priceScore: number;
  kmScore: number;
  yearScore: number;
};

function headerHas(header: string, re: RegExp) {
  return re.test(String(header || '').toLowerCase());
}

/**
 * CSV scrapers are inconsistent: sometimes headers are weird, or columns shift.
 * We "refine" the initial regex mapping by scoring each column on real sample values.
 */
function refineMapping(
  headers: string[],
  sampleRows: string[][],
  initial: Partial<ColumnMapping>
): Partial<ColumnMapping> {
  const sample = sampleRows.slice(0, 80).filter(r => r.length > 0);
  if (sample.length === 0) return initial;

  const colCount = Math.max(headers.length, ...sample.map(r => r.length));

  const scores: ColumnScore[] = Array.from({ length: colCount }).map((_, idx) => {
    const header = String(headers[idx] ?? '');
    let priceHits = 0;
    let kmHits = 0;
    let yearHits = 0;
    let total = 0;

    for (const row of sample) {
      const val = String(row[idx] ?? '').trim();
      if (!val) continue;
      total++;

      if (cleanPrice(val) > 0) priceHits++;
      if (cleanKilometrage(val) > 0) kmHits++;
      if (cleanYear(val) > 0) yearHits++;
    }

    const denom = Math.max(total, 1);

    // Header bonuses
    const priceBonus = headerHas(header, /(prix|price|€|eur|euro)/i) ? 0.35 : 0;
    const kmBonus = headerHas(header, /(kilom|mileage|odometer|\bkm\b)/i) ? 0.35 : 0;
    const yearBonus = headerHas(header, /(annee|année|year|mise en circulation|registration)/i) ? 0.25 : 0;

    return {
      idx,
      header,
      priceScore: priceHits / denom + priceBonus,
      kmScore: kmHits / denom + kmBonus,
      yearScore: yearHits / denom + yearBonus,
    };
  });

  const used = new Set<number>();
  const pickBest = (key: keyof Pick<ColumnScore, 'priceScore' | 'kmScore' | 'yearScore'>) => {
    return scores
      .filter(s => !used.has(s.idx))
      .sort((a, b) => (b[key] as number) - (a[key] as number))[0];
  };

  const refined: Partial<ColumnMapping> = { ...initial };

  // Decide if we should override a detected column
  const maybeOverride = (
    field: keyof Pick<ColumnMapping, 'prix' | 'kilometrage' | 'annee'>,
    key: keyof Pick<ColumnScore, 'priceScore' | 'kmScore' | 'yearScore'>
  ) => {
    const currentIdx = refined[field];
    const best = pickBest(key);
    if (!best) return;

    // If missing -> always set when confident
    if (currentIdx === undefined) {
      if ((best[key] as number) >= 0.55) {
        refined[field] = best.idx as any;
        used.add(best.idx);
      }
      return;
    }

    // If present but weak and another column is clearly better
    const currentScore = scores.find(s => s.idx === currentIdx)?.[key] ?? 0;
    const bestScore = best[key] as number;

    used.add(currentIdx);

    if (bestScore >= 0.70 && bestScore - (currentScore as number) >= 0.25) {
      refined[field] = best.idx as any;
      used.delete(currentIdx);
      used.add(best.idx);
    }
  };

  maybeOverride('prix', 'priceScore');
  maybeOverride('kilometrage', 'kmScore');
  maybeOverride('annee', 'yearScore');

  return refined;
}

// ============================================
// DATA EXTRACTION & CLEANING
// ============================================

function cleanPrice(value: string): number {
  if (!value) return 0;

  const raw = String(value).trim();

  // Normalize unicode (handles thin spaces, NBSP, etc.) and keep a copy for heuristics
  const normalized = raw.normalize('NFKC');

  // Keep only digits for "integer-ish" prices (CSV exports often use spaces, dots, NBSP, narrow NBSP, etc.)
  const digitsOnly = normalized.replace(/[^0-9]/g, '');
  if (!digitsOnly) return 0;

  const num = parseInt(digitsOnly, 10);
  if (!Number.isFinite(num)) return 0;

  // Guardrail: prevent years/dates from being interpreted as prices
  const looksLikeYearOnly = /^\d{4}$/.test(digitsOnly) && num >= 1980 && num <= 2026;
  if (looksLikeYearOnly) return 0;

  // e.g. "2019/06" or "mise en circulation: 2020" should not become a 2,019€ price
  const containsYearToken = /\b(19[89]\d|20[0-2]\d)\b/.test(raw);
  const hasCurrencyHint = /[€$£]/.test(raw) || /\b(eur|euro)\b/i.test(raw);
  if (containsYearToken && !hasCurrencyHint && num <= 3000) return 0;

  // Validate range (500€ - 2M€)
  if (num >= 500 && num <= 2000000) return num;
  return 0;
}

function cleanKilometrage(value: string): number {
  if (!value) return 0;

  const raw = String(value).trim().normalize('NFKC');
  // Keep only digits (handles "45 000", "45 000", "45.000", etc.)
  const digitsOnly = raw.replace(/[^0-9]/g, '');
  if (!digitsOnly) return 0;

  const num = parseInt(digitsOnly, 10);
  if (!Number.isFinite(num)) return 0;

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
// COMBINED FIELD EXTRACTION (LeBonCoin format)
// ============================================

interface CombinedData {
  annee: number;
  kilometrage: number;
  carburant: string;
  transmission: string;
}

/**
 * Extracts data from combined strings like:
 * 'Année: "2018". Kilométrage: "54000 km". Carburant: "Essence". Boîte de vitesse: "Automatique"'
 */
function extractFromCombinedField(text: string): CombinedData {
  const result: CombinedData = {
    annee: 0,
    kilometrage: 0,
    carburant: 'autre',
    transmission: 'autre',
  };

  if (!text) return result;

  // Extract year: Année: "2018" or Année: 2018
  const yearMatch = text.match(/ann[ée]e\s*[:=]?\s*"?(\d{4})"?/i);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (year >= 1980 && year <= 2026) result.annee = year;
  }

  // Extract mileage: Kilométrage: "54000 km" or Kilométrage: "54 000 km"
  const kmMatch = text.match(/kilom[ée]trage\s*[:=]?\s*"?([0-9\s.]+)\s*km"?/i);
  if (kmMatch) {
    const kmDigits = kmMatch[1].replace(/[^0-9]/g, '');
    const km = parseInt(kmDigits, 10);
    if (km >= 0 && km <= 500000) result.kilometrage = km;
  }

  // Extract fuel: Carburant: "Essence"
  const fuelMatch = text.match(/carburant\s*[:=]?\s*"?([^".,]+)"?/i);
  if (fuelMatch) {
    const fuel = fuelMatch[1].trim().toLowerCase();
    if (/essence/i.test(fuel)) result.carburant = 'essence';
    else if (/diesel/i.test(fuel)) result.carburant = 'diesel';
    else if (/[ée]lectrique/i.test(fuel)) result.carburant = 'electrique';
    else if (/hybride/i.test(fuel)) result.carburant = 'hybride';
    else if (/gpl|gnv/i.test(fuel)) result.carburant = 'gpl';
  }

  // Extract transmission: Boîte de vitesse: "Automatique"
  const transMatch = text.match(/bo[îi]te\s*(?:de\s*vitesse)?\s*[:=]?\s*"?([^".,]+)"?/i);
  if (transMatch) {
    const trans = transMatch[1].trim().toLowerCase();
    if (/automatique|auto/i.test(trans)) result.transmission = 'automatique';
    else if (/manu/i.test(trans)) result.transmission = 'manuelle';
  }

  return result;
}

/**
 * Extracts price from "Prix: 45 990 €." format
 */
function extractPriceFromField(text: string): number {
  if (!text) return 0;
  
  // Match "Prix: 45 990 €" or "Prix: 45990€" patterns
  const priceMatch = text.match(/prix\s*[:=]?\s*([0-9\s.]+)\s*€/i);
  if (priceMatch) {
    const digits = priceMatch[1].replace(/[^0-9]/g, '');
    const price = parseInt(digits, 10);
    if (price >= 500 && price <= 2000000) return price;
  }
  
  return cleanPrice(text);
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
  
  // First pass: try to find combined data field (LeBonCoin format)
  let combinedData: CombinedData | null = null;
  for (const field of row) {
    if (/ann[ée]e.*kilom[ée]trage/i.test(field) || /kilom[ée]trage.*ann[ée]e/i.test(field)) {
      combinedData = extractFromCombinedField(field);
      break;
    }
  }

  // Extract with mapping or fallback to detection
  let titre = mapping.titre !== undefined ? row[mapping.titre] : '';
  let prix = 0;
  let kilometrage = combinedData?.kilometrage ?? 0;
  let annee = combinedData?.annee ?? 0;
  let carburant = combinedData?.carburant ?? 'autre';
  let transmission = combinedData?.transmission ?? 'autre';
  let marque = mapping.marque !== undefined ? row[mapping.marque]?.trim() : '';
  let modele = mapping.modele !== undefined ? row[mapping.modele]?.trim() : '';
  let image = mapping.image !== undefined ? row[mapping.image]?.trim() : '';
  let lien = mapping.lien !== undefined ? row[mapping.lien]?.trim() : '';
  
  // Try to find price from "Prix: XXX €" format first
  for (const field of row) {
    if (/prix\s*[:=]/i.test(field)) {
      prix = extractPriceFromField(field);
      if (prix > 0) break;
    }
  }
  
  // Fallback: use mapping or scan all fields
  if (!prix && mapping.prix !== undefined) {
    prix = cleanPrice(row[mapping.prix]);
  }
  if (!prix) {
    for (const field of row) {
      const extracted = cleanPrice(field);
      if (extracted > 0) { prix = extracted; break; }
    }
  }
  
  // Fallback for km if not from combined field
  if (!kilometrage) {
    if (mapping.kilometrage !== undefined) {
      kilometrage = cleanKilometrage(row[mapping.kilometrage]);
    }
    if (!kilometrage) {
      const candidates: Array<{ v: number; weight: number }> = [];
      for (const field of row) {
        const v = cleanKilometrage(field);
        if (v <= 0) continue;
        const hasKmHint = /\bkm\b|kilom|mileage|odometer/i.test(field);
        if (!hasKmHint && v < 5000) continue;
        candidates.push({ v, weight: hasKmHint ? 2 : 1 });
      }
      candidates.sort((a, b) => (b.weight - a.weight) || (b.v - a.v));
      const best = candidates.find(c => c.v !== prix) ?? candidates[0];
      kilometrage = best?.v ?? 0;
    }
  }
  
  // Fallback for year
  if (!annee) {
    if (mapping.annee !== undefined) {
      annee = cleanYear(row[mapping.annee]);
    }
    if (!annee) {
      for (const field of row) {
        const extracted = cleanYear(field);
        if (extracted > 0) { annee = extracted; break; }
      }
    }
  }
  
  // Extract brand/model from title or all text (prioritize first cell as title)
  if (!titre) {
    titre = row[0] || '';
  }
  const searchText = titre || allText;
  if (!marque) marque = extractBrand(searchText);
  if (!modele || modele === 'Inconnu') modele = extractModel(searchText, marque);
  
  // Fallback carburant/transmission from title if not found in combined
  if (carburant === 'autre') carburant = extractCarburant(allText);
  if (transmission === 'autre') transmission = extractTransmission(allText);
  
  // Find URLs
  if (!image) {
    const imgUrl = row.find(f => f.startsWith('http') && /\.(jpg|jpeg|png|webp|gif)/i.test(f));
    if (imgUrl) image = imgUrl;
  }
  
  if (!lien) {
    const link = row.find(f => f.startsWith('http') && !/\.(jpg|jpeg|png|webp|gif)/i.test(f));
    if (link) lien = link;
  }
  
  // Validate minimum required data
  if (prix <= 0) return null;
  if (!titre && marque === 'Autre') return null;
  
  // Build final title if missing
  if (!titre) {
    titre = `${marque} ${modele}`.trim();
  }
  
  // Extract localisation from "Située à XXX" format
  let localisation = '';
  for (const field of row) {
    const locMatch = field.match(/situ[ée]e?\s*[àa]\s*(.+)/i);
    if (locMatch) {
      localisation = locMatch[1].trim().replace(/\.$/, '');
      break;
    }
  }
  if (!localisation && mapping.localisation !== undefined) {
    localisation = row[mapping.localisation]?.trim() || '';
  }
  
  return {
    id: `v-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    titre: titre.slice(0, 200),
    marque,
    modele: modele || 'Inconnu',
    prix,
    kilometrage,
    annee: annee || new Date().getFullYear(),
    carburant,
    transmission,
    puissance: cleanPuissance(allText),
    image: image || '',
    lien: lien || '#',
    localisation,
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
          let mapping = detectColumns(headers);

          // Refine mapping by inspecting real sample rows (fixes swapped/missed KM/Price columns)
          const sampleRows = data.slice(1, 51).map(r => r.map(cell => String(cell || '')));
          mapping = refineMapping(headers, sampleRows, mapping);

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
