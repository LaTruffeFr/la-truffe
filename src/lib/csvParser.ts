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
  prixMoyen: number;
  prixMedian: number;
  ecart: number;       // prix - prixMoyen
  ecartPourcent: number; // (prix - prixMoyen) / prixMoyen * 100
  dealScore: number;   // 0-100, higher = better deal
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
// PRICING ENGINE
// ============================================

export function calculateDealScores(vehicles: ParsedVehicle[]): VehicleWithScore[] {
  // Group by segment (Marque + Modele + Year bucket)
  const segments: Record<string, ParsedVehicle[]> = {};
  
  for (const vehicle of vehicles) {
    const yearBucket = Math.floor(vehicle.annee / 2) * 2; // 2-year buckets
    const key = `${vehicle.marque}|${vehicle.modele}|${yearBucket}`;
    
    if (!segments[key]) segments[key] = [];
    segments[key].push(vehicle);
  }
  
  // Calculate stats per segment
  const segmentStats: Record<string, { moyenne: number; median: number; count: number }> = {};
  
  for (const [key, segVehicles] of Object.entries(segments)) {
    const prices = segVehicles.map(v => v.prix).sort((a, b) => a - b);
    
    // Remove outliers (IQR method)
    if (prices.length >= 4) {
      const q1 = prices[Math.floor(prices.length * 0.25)];
      const q3 = prices[Math.floor(prices.length * 0.75)];
      const iqr = q3 - q1;
      const filtered = prices.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);
      
      const moyenne = filtered.reduce((a, b) => a + b, 0) / filtered.length;
      const mid = Math.floor(filtered.length / 2);
      const median = filtered.length % 2 ? filtered[mid] : (filtered[mid - 1] + filtered[mid]) / 2;
      
      segmentStats[key] = { moyenne, median, count: segVehicles.length };
    } else if (prices.length > 0) {
      const moyenne = prices.reduce((a, b) => a + b, 0) / prices.length;
      const mid = Math.floor(prices.length / 2);
      const median = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
      
      segmentStats[key] = { moyenne, median, count: segVehicles.length };
    }
  }
  
  // Calculate scores
  return vehicles.map(vehicle => {
    const yearBucket = Math.floor(vehicle.annee / 2) * 2;
    const key = `${vehicle.marque}|${vehicle.modele}|${yearBucket}`;
    const stats = segmentStats[key];
    
    if (!stats) {
      return {
        ...vehicle,
        prixMoyen: vehicle.prix,
        prixMedian: vehicle.prix,
        ecart: 0,
        ecartPourcent: 0,
        dealScore: 50,
        segmentKey: key,
      };
    }
    
    const ecart = vehicle.prix - stats.moyenne;
    const ecartPourcent = (ecart / stats.moyenne) * 100;
    
    // Deal score: 100 = great deal, 0 = overpriced
    // -30% = score 100, 0% = score 50, +30% = score 0
    const dealScore = Math.max(0, Math.min(100, 50 - (ecartPourcent * 1.67)));
    
    return {
      ...vehicle,
      prixMoyen: Math.round(stats.moyenne),
      prixMedian: Math.round(stats.median),
      ecart: Math.round(ecart),
      ecartPourcent: Math.round(ecartPourcent * 10) / 10,
      dealScore: Math.round(dealScore),
      segmentKey: key,
    };
  });
}

export function getTopOpportunities(vehicles: VehicleWithScore[], limit = 500): VehicleWithScore[] {
  return [...vehicles]
    .filter(v => v.dealScore >= 50) // Only good deals
    .sort((a, b) => b.dealScore - a.dealScore)
    .slice(0, limit);
}
