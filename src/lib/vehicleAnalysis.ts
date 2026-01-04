import { Vehicle, MarketStats, Carburant, Transmission, SegmentStats } from "@/types/vehicle";

// ============================================
// BRAND & MODEL EXTRACTION
// ============================================

const BRANDS = [
  "Audi", "BMW", "Mercedes", "Volkswagen", "Renault", "Peugeot", "Citroën", "Citroen",
  "Toyota", "Honda", "Ford", "Opel", "Fiat", "Seat", "Skoda", "Hyundai", "Kia",
  "Nissan", "Mazda", "Volvo", "Porsche", "Jaguar", "Land Rover", "Mini", "Tesla",
  "Dacia", "Suzuki", "Mitsubishi", "Lexus", "Alfa Romeo", "Jeep", "DS", "Cupra",
  "Chevrolet", "Dodge", "Chrysler", "Smart", "Lancia", "Maserati", "Ferrari",
  "Lamborghini", "Bentley", "Rolls-Royce", "Aston Martin", "McLaren", "Bugatti"
];

const MODEL_PATTERNS: Record<string, string[]> = {
  "Volkswagen": ["golf r", "golf gti", "golf", "polo gti", "polo", "passat", "tiguan r", "tiguan", "t-roc r", "t-roc", "arteon r", "arteon", "touran", "touareg", "id.3", "id.4", "id.5", "scirocco"],
  "Renault": ["megane rs", "clio rs", "clio", "megane", "scenic", "captur", "twingo", "kadjar", "arkana", "austral", "zoe", "talisman"],
  "Peugeot": ["208 gti", "308 gti", "208", "308", "408", "508", "2008", "3008", "5008", "e-208", "e-308", "e-2008", "rcz"],
  "Citroën": ["c3", "c4", "c5", "c3 aircross", "c5 aircross", "berlingo", "ami", "e-c4", "ds3", "ds4", "ds5"],
  "Ford": ["focus rs", "focus st", "fiesta st", "fiesta", "focus", "kuga", "puma", "mustang", "ranger", "mondeo"],
  "Opel": ["corsa opc", "astra opc", "corsa", "astra", "mokka", "crossland", "grandland", "insignia"],
  "Toyota": ["gr yaris", "gr86", "supra", "yaris", "corolla", "rav4", "aygo", "c-hr", "camry", "highlander", "prius"],
  "BMW": ["m2", "m3", "m4", "m5", "m6", "m8", "x3 m", "x4 m", "x5 m", "x6 m", "m135i", "m140i", "m235i", "m240i", "m340i", "m440i", "m550i", "serie 1", "serie 2", "serie 3", "serie 4", "serie 5", "serie 6", "serie 7", "serie 8", "x1", "x2", "x3", "x4", "x5", "x6", "x7", "i3", "i4", "i7", "ix", "z4"],
  "Mercedes": ["a35 amg", "a45 amg", "c43 amg", "c63 amg", "e43 amg", "e63 amg", "amg gt", "classe a", "classe b", "classe c", "classe e", "classe s", "gla", "glb", "glc", "gle", "gls", "eqc", "eqa", "eqb", "eqs", "cla", "cls"],
  "Audi": ["rs3", "rs4", "rs5", "rs6", "rs7", "rsq3", "rsq8", "s3", "s4", "s5", "s6", "s7", "sq5", "sq7", "sq8", "ttrs", "tt", "r8", "a1", "a3", "a4", "a5", "a6", "a7", "a8", "q2", "q3", "q4", "q5", "q7", "q8", "e-tron", "e-tron gt"],
  "Porsche": ["911", "718", "cayman", "boxster", "cayenne", "macan", "panamera", "taycan"],
  "Mini": ["cooper s", "john cooper works", "jcw", "cooper", "one", "countryman", "clubman"],
  "Alfa Romeo": ["giulia quadrifoglio", "stelvio quadrifoglio", "giulia", "stelvio", "giulietta", "4c"],
  "Cupra": ["formentor vz5", "formentor vz", "formentor", "leon", "ateca", "born"],
  "Seat": ["leon cupra", "ibiza cupra", "leon fr", "leon", "ibiza", "ateca", "arona", "tarraco"],
  "Skoda": ["octavia rs", "octavia vrs", "kodiaq rs", "superb", "octavia", "kodiaq", "karoq", "scala", "fabia"],
};

export function extractBrand(titre: string): string {
  const titleLower = titre.toLowerCase();
  
  for (const [brand, models] of Object.entries(MODEL_PATTERNS)) {
    for (const model of models) {
      if (titleLower.includes(model)) {
        return brand;
      }
    }
  }
  
  for (const brand of BRANDS) {
    if (titleLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return "Autre";
}

export function extractModel(titre: string, marque: string): string {
  const titleLower = titre.toLowerCase();
  
  const brandModels = MODEL_PATTERNS[marque];
  if (brandModels) {
    for (const model of brandModels) {
      if (titleLower.includes(model)) {
        return model.toUpperCase();
      }
    }
  }
  
  let model = titre.replace(new RegExp(marque, 'gi'), '').trim();
  const words = model.split(/\s+/).filter(w => w.length > 1);
  return words.slice(0, 2).join(' ') || 'Inconnu';
}

// ============================================
// FUEL, TRANSMISSION & POWER EXTRACTION
// ============================================

export function extractCarburant(text: string): Carburant {
  const lower = text.toLowerCase();
  
  if (lower.includes('électrique') || lower.includes('electrique') || lower.includes('electric')) {
    return 'electrique';
  }
  if (lower.includes('hybride') || lower.includes('hybrid')) {
    return 'hybride';
  }
  if (lower.includes('diesel') || lower.includes('hdi') || lower.includes('tdi') || lower.includes('dci') || lower.includes('bluehdi') || lower.includes('cdti')) {
    return 'diesel';
  }
  if (lower.includes('essence') || lower.includes('tsi') || lower.includes('tfsi') || lower.includes('tce') || lower.includes('puretech') || lower.includes('ecoboost')) {
    return 'essence';
  }
  if (lower.includes('gpl') || lower.includes('gnv')) {
    return 'gpl';
  }
  return 'autre';
}

export function extractTransmission(text: string): Transmission {
  const lower = text.toLowerCase();
  
  if (lower.includes('automatique') || lower.includes('auto') || lower.includes('bva') || lower.includes('dsg') || lower.includes('s tronic') || lower.includes('tiptronic') || lower.includes('cvt') || lower.includes('edc') || lower.includes('eat')) {
    return 'automatique';
  }
  if (lower.includes('manuelle') || lower.includes('manuel') || lower.includes('bvm')) {
    return 'manuelle';
  }
  return 'autre';
}

// Extract power in CV/HP from title
export function extractPuissance(text: string): number {
  const lower = text.toLowerCase();
  
  // Match patterns like "150ch", "150 ch", "150cv", "150 cv", "150hp"
  const patterns = [
    /(\d{2,3})\s*(?:ch|cv|hp|bhp)/i,
    /(\d{2,3})\s*chevaux/i,
    // Match engine sizes that imply power: 1.6, 2.0, etc.
  ];
  
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  // Estimate from engine displacement if available
  const displacementMatch = lower.match(/(\d)[.,](\d)\s*(?:l|hdi|tdi|tsi|tfsi|tce|dci)/i);
  if (displacementMatch) {
    const liters = parseFloat(`${displacementMatch[1]}.${displacementMatch[2]}`);
    // Rough estimation: 1.0L ≈ 75cv, 1.5L ≈ 110cv, 2.0L ≈ 150cv
    return Math.round(liters * 75);
  }
  
  return 0; // Unknown
}

// Categorize power into buckets for segmentation
export function getPowerBucket(puissance: number): string {
  if (puissance === 0) return 'unknown';
  if (puissance < 100) return 'eco';      // < 100 CV
  if (puissance < 150) return 'standard'; // 100-149 CV
  if (puissance < 200) return 'sport';    // 150-199 CV
  return 'performance';                    // 200+ CV
}

// ============================================
// CSV PARSING
// ============================================

function parseLeBonCoinCSV(csvText: string): Vehicle[] {
  const vehicles: Vehicle[] = [];
  const lines = csvText.split('\n').filter(l => l.trim());
  
  if (lines.length < 2) return vehicles;
  
  // Parse header to find column indices
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
  
  console.log('CSV Headers:', headers);
  
  // Find column indices dynamically
  const findCol = (patterns: string[]): number => {
    return headers.findIndex(h => patterns.some(p => h.includes(p)));
  };
  
  // Map common column names
  const colIndices = {
    titre: Math.max(0, findCol(['titre', 'title', 'text', 'sr-only', 'annonce'])),
    lien: findCol(['href', 'link', 'url', 'lien']),
    image: findCol(['src', 'image', 'img', 'photo']),
    prix: findCol(['prix', 'price', '€']),
    annee: findCol(['année', 'annee', 'year', 'date']),
    km: findCol(['km', 'kilom', 'mileage']),
  };
  
  console.log('Column indices:', colIndices);
  
  // Parse each data row
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 3) continue;
    
    // Debug: log first record
    if (i === 1) {
      console.log('First row fields:', fields.slice(0, 10));
    }
    
    // Extract data - search through all fields if indices not found
    let titre = '';
    let lien = '';
    let image = '';
    let prix = 0;
    let annee = 0;
    let kilometrage = 0;
    
    // Title: first non-empty text field or specific column
    if (colIndices.titre >= 0 && fields[colIndices.titre]) {
      titre = fields[colIndices.titre];
    } else {
      titre = fields.find(f => f.length > 10 && !f.startsWith('http') && !f.includes('€')) || '';
    }
    
    // Link: find URL
    if (colIndices.lien >= 0 && fields[colIndices.lien]?.startsWith('http')) {
      lien = fields[colIndices.lien];
    } else {
      lien = fields.find(f => f.startsWith('http') && f.includes('leboncoin')) || 
             fields.find(f => f.startsWith('http')) || '';
    }
    
    // Image: find image URL
    if (colIndices.image >= 0 && fields[colIndices.image]?.startsWith('http')) {
      image = fields[colIndices.image];
    } else {
      image = fields.find(f => f.startsWith('http') && (f.includes('.jpg') || f.includes('.png') || f.includes('.webp') || f.includes('img'))) || '';
    }
    
    // Price: find € pattern or numeric value in expected range
    for (const field of fields) {
      const extractedPrice = extractPrice(field);
      if (extractedPrice > 0 && extractedPrice >= 500 && extractedPrice <= 500000) {
        prix = extractedPrice;
        break;
      }
    }
    
    // Year: find 4-digit year in 1990-2026 range
    for (const field of fields) {
      const yearMatch = field.match(/\b(19[89]\d|20[0-2]\d)\b/);
      if (yearMatch) {
        const y = parseInt(yearMatch[1]);
        if (y >= 1990 && y <= 2026) {
          annee = y;
          break;
        }
      }
    }
    
    // Kilometrage: find "XXX km" pattern
    for (const field of fields) {
      const km = extractKilometrage(field);
      if (km > 0 && km <= 500000) {
        kilometrage = km;
        break;
      }
    }
    
    // Skip invalid records
    if (!titre || titre.length < 3 || prix <= 0) {
      continue;
    }
    
    const marque = extractBrand(titre);
    const fullText = fields.join(' ');
    
    const vehicle: Vehicle = {
      id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      titre,
      prix,
      annee: annee || new Date().getFullYear(),
      kilometrage,
      lien: lien || '#',
      image,
      marque,
      modele: extractModel(titre, marque),
      carburant: extractCarburant(fullText),
      transmission: extractTransmission(fullText),
      puissance: extractPuissance(fullText),
    };
    
    console.log('Parsed vehicle:', { titre: vehicle.titre.slice(0, 30), prix: vehicle.prix, annee: vehicle.annee, km: vehicle.kilometrage });
    
    vehicles.push(vehicle);
  }
  
  return vehicles;
}

function extractPrice(priceStr: string): number {
  const match = priceStr.match(/(\d[\d\s]*\d|\d+)\s*€/);
  if (match) {
    return parseInt(match[1].replace(/\s/g, '')) || 0;
  }
  const cleaned = priceStr.replace(/[^\d]/g, '');
  const num = parseInt(cleaned);
  if (num >= 500 && num <= 500000) {
    return num;
  }
  return 0;
}

function extractYear(str: string): number {
  const match = str.match(/20[0-2]\d|19[89]\d/);
  return match ? parseInt(match[0]) : 0;
}

function extractKilometrage(kmStr: string): number {
  // Clean up the string first - remove extra spaces, normalize
  const cleaned = kmStr.replace(/\s+/g, ' ').trim();
  
  // Match patterns like "201 480 km", "201480km", "201.480 km"
  const match = cleaned.match(/(\d[\d\s.,]*)\s*km/i);
  if (match) {
    // Remove all spaces, dots, and commas from the number
    const numStr = match[1].replace(/[\s.,]/g, '');
    const km = parseInt(numStr) || 0;
    
    // Sanity check: no car should have more than 1,000,000 km
    // If the value is unrealistic, it's likely a parsing error
    if (km > 1000000) {
      console.warn(`Unrealistic km value detected: ${km}, from "${kmStr}"`);
      // Try to extract a reasonable number (first 6 digits max)
      const reasonableKm = parseInt(numStr.slice(0, 6));
      return reasonableKm > 1000000 ? 0 : reasonableKm;
    }
    return km;
  }
  
  // Try to extract just a number if no "km" suffix
  const numOnly = cleaned.replace(/[^\d]/g, '');
  if (numOnly) {
    const km = parseInt(numOnly);
    // Only accept if it looks like a reasonable km value
    if (km >= 1000 && km <= 500000) {
      return km;
    }
  }
  
  return 0;
}

function parseStandardCSV(csvText: string): Vehicle[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const vehicles: Vehicle[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() || '';
    });
    
    const titre = row['titre'] || row['title'] || '';
    const marque = extractBrand(titre);
    const fullText = Object.values(row).join(' ');
    
    const vehicle: Vehicle = {
      id: `v-${i}-${Date.now()}`,
      titre,
      prix: parseSimplePrice(row['prix'] || row['price'] || '0'),
      annee: parseInt(row['année'] || row['annee'] || row['year'] || '0'),
      kilometrage: extractKilometrage(row['kilométrage'] || row['kilometrage'] || row['km'] || '0'),
      lien: row['lien'] || row['link'] || row['url'] || '#',
      image: row['image'] || row['img'] || row['photo'] || '',
      marque,
      modele: extractModel(titre, marque),
      carburant: extractCarburant(fullText),
      transmission: extractTransmission(fullText),
      puissance: extractPuissance(fullText),
    };
    
    if (vehicle.prix > 0 && vehicle.titre) {
      vehicles.push(vehicle);
    }
  }
  
  return vehicles;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

function parseSimplePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export function parseCSV(csvText: string): Vehicle[] {
  const firstLine = csvText.split('\n')[0] || '';
  
  if (firstLine.includes('absolute href') || firstLine.includes('sr-only') || firstLine.includes('text-body')) {
    console.log('Detected LeBonCoin CSV format');
    return parseLeBonCoinCSV(csvText);
  }
  
  console.log('Using standard CSV format');
  return parseStandardCSV(csvText);
}

// ============================================
// MARKET ANALYSIS ENGINE - ADVANCED
// ============================================

// Depreciation rates per 10,000 km by fuel type
const KM_DEPRECIATION_RATES: Record<Carburant, number> = {
  'essence': 0.015,
  'diesel': 0.012,
  'electrique': 0.010,
  'hybride': 0.012,
  'gpl': 0.018,
  'autre': 0.015,
};

// Age depreciation curve (percentage of value lost per year)
const AGE_DEPRECIATION: Record<number, number> = {
  0: 0,      // New
  1: 0.20,   // -20% year 1
  2: 0.12,   // -12% year 2
  3: 0.10,   // -10% year 3
  4: 0.08,   // -8% year 4
  5: 0.07,   // -7% year 5+
};

// Transmission premium/discount
const TRANSMISSION_ADJUSTMENT: Record<Transmission, number> = {
  'automatique': 1.05,  // +5% for automatic
  'manuelle': 1.0,
  'autre': 1.0,
};

// Power category adjustments
const POWER_ADJUSTMENT: Record<string, number> = {
  'eco': 0.92,          // -8% for low power
  'standard': 1.0,       // Base
  'sport': 1.08,         // +8% for sport
  'performance': 1.15,   // +15% for performance
  'unknown': 1.0,
};

// Create refined segment key
function createSegmentKey(vehicle: Vehicle, level: 'precise' | 'standard' | 'broad'): string {
  const powerBucket = getPowerBucket(vehicle.puissance || 0);
  
  switch (level) {
    case 'precise':
      // Most precise: Marque|Modèle|Année|Carburant|Puissance
      return `${vehicle.marque}|${vehicle.modele}|${vehicle.annee}|${vehicle.carburant || 'autre'}|${powerBucket}`;
    case 'standard':
      // Standard: Marque|Modèle|Année±1|Carburant
      const yearBucket = vehicle.annee;
      return `${vehicle.marque}|${vehicle.modele}|${yearBucket}|${vehicle.carburant || 'autre'}`;
    case 'broad':
      // Broad: Marque|Modèle|Année±2|AllFuels
      const yearBucket2 = Math.floor(vehicle.annee / 2) * 2;
      return `${vehicle.marque}|${vehicle.modele}|${yearBucket2}|all`;
  }
}

// Remove outliers using IQR method
function removeOutliers(vehicles: Vehicle[]): Vehicle[] {
  if (vehicles.length < 4) return vehicles;
  
  const prices = vehicles.map(v => v.prix).sort((a, b) => a - b);
  const q1Index = Math.floor(prices.length * 0.25);
  const q3Index = Math.floor(prices.length * 0.75);
  const q1 = prices[q1Index];
  const q3 = prices[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return vehicles.filter(v => v.prix >= lowerBound && v.prix <= upperBound);
}

// Calculate segment statistics with outlier removal
function calculateSegmentStats(vehicles: Vehicle[]): SegmentStats {
  // Remove outliers first
  const cleanedVehicles = removeOutliers(vehicles);
  if (cleanedVehicles.length === 0) return calculateSegmentStats(vehicles.slice(0, 3));
  
  const prices = cleanedVehicles.map(v => v.prix).sort((a, b) => a - b);
  const kms = cleanedVehicles.map(v => v.kilometrage);
  const ages = cleanedVehicles.map(v => new Date().getFullYear() - v.annee);
  
  // Median price (more robust than mean)
  const mid = Math.floor(prices.length / 2);
  const prixMedian = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
  
  // Averages
  const prixMoyen = prices.reduce((a, b) => a + b, 0) / prices.length;
  const kmMoyen = kms.reduce((a, b) => a + b, 0) / kms.length;
  const ageMoyen = ages.reduce((a, b) => a + b, 0) / ages.length;
  
  // Calculate price per km depreciation using regression
  let prixParKm = 0;
  if (cleanedVehicles.length >= 5) {
    const n = cleanedVehicles.length;
    const sumKm = kms.reduce((a, b) => a + b, 0);
    const sumPrix = prices.reduce((a, b) => a + b, 0);
    const sumKmPrix = cleanedVehicles.reduce((sum, v) => sum + v.kilometrage * v.prix, 0);
    const sumKm2 = kms.reduce((sum, km) => sum + km * km, 0);
    
    const denominator = n * sumKm2 - sumKm * sumKm;
    if (denominator !== 0) {
      prixParKm = Math.abs((n * sumKmPrix - sumKm * sumPrix) / denominator);
    }
  }
  
  // Fallback: estimate from depreciation rate
  if (prixParKm === 0 || !isFinite(prixParKm) || prixParKm > 1) {
    const avgCarburant = cleanedVehicles[0]?.carburant || 'essence';
    const rate = KM_DEPRECIATION_RATES[avgCarburant];
    prixParKm = (prixMoyen * rate) / 10000;
  }
  
  return {
    key: '',
    count: cleanedVehicles.length,
    prixMedian: Math.round(prixMedian),
    prixMoyen: Math.round(prixMoyen),
    kmMoyen: Math.round(kmMoyen),
    prixParKm: Math.round(prixParKm * 100) / 100,
  };
}

// Calculate age depreciation factor
function getAgeDepreciation(age: number): number {
  let totalDepreciation = 1;
  for (let year = 1; year <= Math.min(age, 10); year++) {
    const yearRate = AGE_DEPRECIATION[Math.min(year, 5)];
    totalDepreciation *= (1 - yearRate);
  }
  return totalDepreciation;
}

// Multi-factor confidence score
function calculateConfidenceScore(
  segmentSize: number,
  usedFallback: boolean,
  hasTransmission: boolean,
  hasPower: boolean,
  hasCarburant: boolean
): number {
  let score = 0;
  
  // Segment size (0-40 points)
  score += Math.min(40, segmentSize * 4);
  
  // Data quality (0-60 points)
  if (!usedFallback) score += 20;
  if (hasCarburant) score += 15;
  if (hasTransmission) score += 15;
  if (hasPower) score += 10;
  
  return Math.min(100, score);
}

// Main analysis function with advanced pricing model
export function analyzeMarket(vehicles: Vehicle[]): Vehicle[] {
  if (vehicles.length === 0) return [];
  
  const currentYear = new Date().getFullYear();
  
  // Step 1: Group by multiple segment levels
  const preciseSegments: Record<string, Vehicle[]> = {};
  const standardSegments: Record<string, Vehicle[]> = {};
  const broadSegments: Record<string, Vehicle[]> = {};
  
  vehicles.forEach(v => {
    const preciseKey = createSegmentKey(v, 'precise');
    const standardKey = createSegmentKey(v, 'standard');
    const broadKey = createSegmentKey(v, 'broad');
    
    if (!preciseSegments[preciseKey]) preciseSegments[preciseKey] = [];
    preciseSegments[preciseKey].push(v);
    
    if (!standardSegments[standardKey]) standardSegments[standardKey] = [];
    standardSegments[standardKey].push(v);
    
    if (!broadSegments[broadKey]) broadSegments[broadKey] = [];
    broadSegments[broadKey].push(v);
  });
  
  // Step 2: Calculate stats for each segment level
  const preciseStats: Record<string, SegmentStats> = {};
  const standardStats: Record<string, SegmentStats> = {};
  const broadStats: Record<string, SegmentStats> = {};
  
  Object.entries(preciseSegments).forEach(([key, segVehicles]) => {
    if (segVehicles.length >= 3) {
      preciseStats[key] = { ...calculateSegmentStats(segVehicles), key };
    }
  });
  
  Object.entries(standardSegments).forEach(([key, segVehicles]) => {
    if (segVehicles.length >= 3) {
      standardStats[key] = { ...calculateSegmentStats(segVehicles), key };
    }
  });
  
  Object.entries(broadSegments).forEach(([key, segVehicles]) => {
    if (segVehicles.length >= 3) {
      broadStats[key] = { ...calculateSegmentStats(segVehicles), key };
    }
  });
  
  // Step 3: Analyze each vehicle
  const analyzedVehicles = vehicles.map(v => {
    const preciseKey = createSegmentKey(v, 'precise');
    const standardKey = createSegmentKey(v, 'standard');
    const broadKey = createSegmentKey(v, 'broad');
    
    // Get best available stats (cascade from precise to broad)
    let stats = preciseStats[preciseKey];
    let usedFallback = false;
    let segmentLevel = 'precise';
    
    if (!stats || stats.count < 3) {
      stats = standardStats[standardKey];
      segmentLevel = 'standard';
    }
    
    if (!stats || stats.count < 3) {
      stats = broadStats[broadKey];
      usedFallback = true;
      segmentLevel = 'broad';
    }
    
    if (!stats) {
      return {
        ...v,
        segment: broadKey,
        prixMoyen: v.prix,
        prixAjuste: v.prix,
        gainPotentiel: 0,
        scoreConfiance: 0,
        ecartKm: 0,
      };
    }
    
    // Calculate km difference
    const ecartKm = v.kilometrage - stats.kmMoyen;
    
    // Base adjusted price from segment median
    let prixAjuste = stats.prixMedian;
    
    // Adjust for km difference
    prixAjuste -= ecartKm * stats.prixParKm;
    
    // Adjust for transmission premium
    if (v.transmission && v.transmission !== 'autre') {
      const transAdj = TRANSMISSION_ADJUSTMENT[v.transmission];
      // If segment includes mixed transmissions, apply adjustment
      if (segmentLevel !== 'precise') {
        prixAjuste *= transAdj;
      }
    }
    
    // Adjust for power if not in precise segment
    if (v.puissance && segmentLevel !== 'precise') {
      const powerBucket = getPowerBucket(v.puissance);
      const powerAdj = POWER_ADJUSTMENT[powerBucket];
      prixAjuste *= powerAdj;
    }
    
    // Ensure price is reasonable
    prixAjuste = Math.max(1000, Math.round(prixAjuste));
    
    // Calculate gain potential
    const gainPotentiel = Math.round(prixAjuste - v.prix);
    
    // Calculate confidence score
    const scoreConfiance = calculateConfidenceScore(
      stats.count,
      usedFallback,
      v.transmission !== 'autre',
      (v.puissance || 0) > 0,
      v.carburant !== 'autre'
    );
    
    return {
      ...v,
      segment: segmentLevel === 'precise' ? preciseKey : segmentLevel === 'standard' ? standardKey : broadKey,
      prixMoyen: stats.prixMedian,
      prixAjuste,
      gainPotentiel,
      scoreConfiance,
      ecartKm: Math.round(ecartKm),
    };
  });
  
  // Step 4: Sort by gain potential (best deals first), weighted by confidence
  return analyzedVehicles.sort((a, b) => {
    const scoreA = (a.gainPotentiel || 0) * (0.5 + (a.scoreConfiance || 0) / 200);
    const scoreB = (b.gainPotentiel || 0) * (0.5 + (b.scoreConfiance || 0) / 200);
    return scoreB - scoreA;
  });
}

// ============================================
// STATISTICS
// ============================================

export function calculateStats(vehicles: Vehicle[]): MarketStats {
  const opportunities = vehicles.filter(v => (v.gainPotentiel || 0) > 1000);
  const totalGains = opportunities.reduce((sum, v) => sum + (v.gainPotentiel || 0), 0);
  const budgetOpportunities = opportunities.reduce((sum, v) => sum + v.prix, 0);
  
  // Find best deal (highest gain with good confidence)
  const meilleureAffaire = opportunities
    .filter(v => (v.scoreConfiance || 0) >= 30)
    .sort((a, b) => {
      const scoreA = (a.gainPotentiel || 0) * (a.scoreConfiance || 0);
      const scoreB = (b.gainPotentiel || 0) * (b.scoreConfiance || 0);
      return scoreB - scoreA;
    })[0];
  
  return {
    totalVehicules: vehicles.length,
    opportunitesDetectees: opportunities.length,
    margeMoyenne: opportunities.length > 0 ? Math.round(totalGains / opportunities.length) : 0,
    budgetTotal: budgetOpportunities,
    meilleureAffaire,
  };
}

export function getUniqueBrands(vehicles: Vehicle[]): string[] {
  const brands = new Set(vehicles.map(v => v.marque));
  return Array.from(brands).sort();
}

export function getUniqueCarburants(vehicles: Vehicle[]): Carburant[] {
  const carburants = new Set(vehicles.map(v => v.carburant).filter(Boolean) as Carburant[]);
  return Array.from(carburants);
}
