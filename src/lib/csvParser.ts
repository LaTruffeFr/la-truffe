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
  description: string;
}

export interface AIAnalysis {
  options: string[];
  etat: string;
  pointsForts: string[];
  pointsFaibles: string[];
  resumeClient: string;
  bonusScore: number;
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
  aiAnalysis?: AIAnalysis;    // AI-generated analysis from description
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
  description: number;
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
  description: [/description/i, /detail/i, /détail/i, /annonce/i, /texte/i, /body/i, /contenu/i],
};

const BRANDS = [
  // Premium Allemand
  'Audi', 'BMW', 'Mercedes', 'Mercedes-Benz', 'Volkswagen', 'Porsche',
  // Français
  'Renault', 'Peugeot', 'Citroën', 'Citroen', 'DS', 'Alpine', 'Dacia',
  // Japonais
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Suzuki', 'Mitsubishi', 'Lexus', 'Infiniti', 'Subaru', 'Isuzu',
  // Coréen
  'Hyundai', 'Kia', 'Genesis', 'SsangYong',
  // Américain
  'Ford', 'Chevrolet', 'Dodge', 'Chrysler', 'Jeep', 'Cadillac', 'GMC', 'Tesla', 'Buick', 'Lincoln', 'RAM',
  // Italien
  'Fiat', 'Alfa Romeo', 'Lancia', 'Maserati', 'Ferrari', 'Lamborghini', 'Abarth',
  // Espagnol
  'Seat', 'Cupra',
  // Tchèque
  'Skoda',
  // Suédois
  'Volvo', 'Saab', 'Polestar',
  // Britannique
  'Jaguar', 'Land Rover', 'Range Rover', 'Mini', 'Bentley', 'Rolls-Royce', 'Aston Martin', 'McLaren', 'Lotus', 'MG',
  // Allemand compact
  'Opel', 'Smart',
  // Autre
  'Bugatti', 'Pagani', 'Koenigsegg', 'Rimac',
];

// Comprehensive model patterns for accurate extraction
const MODEL_PATTERNS: Record<string, string[]> = {
  'Audi': [
    'rs q8', 'rsq8', 'rs q3', 'rsq3', 'rs7', 'rs6', 'rs5', 'rs4', 'rs3', 'rs e-tron gt',
    'sq8', 'sq7', 'sq5', 'sq3', 's8', 's7', 's6', 's5', 's4', 's3', 's1',
    'tt rs', 'ttrs', 'tts', 'tt', 'r8',
    'a8', 'a7', 'a6', 'a5', 'a4', 'a3', 'a2', 'a1',
    'q8', 'q7', 'q5', 'q4', 'q3', 'q2', 'e-tron gt', 'e-tron',
  ],
  'BMW': [
    'm8', 'm7', 'm6', 'm5', 'm4', 'm3', 'm2', 'x6 m', 'x5 m', 'x4 m', 'x3 m',
    'm135i', 'm140i', 'm235i', 'm240i', 'm340i', 'm440i', 'm550i',
    'serie 1', 'série 1', 'serie 2', 'série 2', 'serie 3', 'série 3', 'serie 4', 'série 4',
    'serie 5', 'série 5', 'serie 6', 'série 6', 'serie 7', 'série 7', 'serie 8', 'série 8',
    'x7', 'x6', 'x5', 'x4', 'x3', 'x2', 'x1', 'ix', 'i7', 'i5', 'i4', 'i3', 'i8', 'z4',
  ],
  'Mercedes': [
    'amg gt', 'a 45 amg', 'a45 amg', 'a 35 amg', 'a35 amg', 'c 63 amg', 'c63 amg', 'e 63 amg', 'e63 amg',
    'classe a', 'classe b', 'classe c', 'classe e', 'classe s', 'classe g',
    'cla', 'cls', 'gla', 'glb', 'glc', 'gle', 'gls',
    'eqs', 'eqe', 'eqc', 'eqa', 'eqb', 'sl', 'slc', 'maybach',
  ],
  'Volkswagen': [
    'golf r', 'golf gti', 'golf gte', 'golf gtd', 'golf', 'polo gti', 'polo',
    'arteon r', 'arteon', 'passat', 't-roc r', 't-roc', 't-cross', 'tiguan r', 'tiguan',
    'touareg', 'touran', 'id.7', 'id.5', 'id.4', 'id.3', 'id.buzz', 'up gti', 'up', 'scirocco',
  ],
  'Renault': [
    'megane rs', 'clio rs', 'megane e-tech', 'megane', 'clio', 'captur', 'scenic',
    'twingo', 'kadjar', 'koleos', 'austral', 'arkana', 'zoe', 'talisman', 'espace',
  ],
  'Peugeot': [
    '208 gti', '308 gti', 'e-208', 'e-308', '208', '308', '408', '508',
    'e-2008', '2008', '3008', '5008', 'rcz', '108', '107',
  ],
  'Citroën': [
    'c3 aircross', 'c5 aircross', 'c4 cactus', 'c3', 'c4', 'c5 x', 'c5', 'c1', 'ami', 'berlingo',
  ],
  'DS': ['ds 9', 'ds9', 'ds 7', 'ds7', 'ds 4', 'ds4', 'ds 3', 'ds3'],
  'Toyota': [
    'gr supra', 'supra', 'gr yaris', 'gr86', 'yaris cross', 'yaris', 'corolla cross', 'corolla',
    'c-hr', 'rav4', 'highlander', 'land cruiser', 'prius', 'camry', 'aygo', 'bz4x',
  ],
  'Honda': ['civic type r', 'civic', 'hr-v', 'cr-v', 'zr-v', 'jazz', 'accord', 'e', 'nsx'],
  'Nissan': [
    'gt-r', 'gtr', '370z', '350z', 'qashqai', 'juke', 'x-trail', 'leaf', 'ariya', 'micra',
  ],
  'Porsche': [
    '911 gt3 rs', '911 gt3', '911 turbo s', '911 turbo', '911', '718 cayman', '718 boxster', '718',
    'cayenne', 'macan', 'panamera', 'taycan', 'cayman', 'boxster',
  ],
  'Ford': [
    'focus rs', 'focus st', 'fiesta st', 'focus', 'fiesta', 'puma', 'kuga',
    'mustang mach-e', 'mustang', 'explorer', 'mondeo', 'ranger',
  ],
  'Opel': ['corsa-e', 'corsa opc', 'corsa', 'astra opc', 'astra', 'mokka', 'crossland', 'grandland', 'insignia'],
  'Fiat': ['500e', '500x', '500l', '500', 'panda', 'tipo', '600e'],
  'Seat': ['leon cupra', 'leon fr', 'leon', 'ibiza', 'ateca', 'arona', 'tarraco'],
  'Cupra': ['formentor vz5', 'formentor vz', 'formentor', 'leon', 'ateca', 'born', 'tavascan'],
  'Skoda': ['octavia rs', 'octavia vrs', 'octavia', 'superb', 'kodiaq rs', 'kodiaq', 'karoq', 'scala', 'fabia', 'enyaq'],
  'Hyundai': ['i30 n', 'i20 n', 'kona n', 'i30', 'i20', 'i10', 'kona', 'tucson', 'santa fe', 'ioniq 6', 'ioniq 5'],
  'Kia': ['stinger', 'proceed', 'ceed', 'sportage', 'sorento', 'niro', 'ev6', 'ev9', 'picanto', 'rio'],
  'Volvo': ['xc90', 'xc60', 'xc40', 'v90', 'v60', 'v40', 's90', 's60', 'c40', 'ex30', 'ex90'],
  'Mini': ['john cooper works', 'jcw', 'cooper s', 'cooper', 'one', 'countryman', 'clubman'],
  'Alfa Romeo': ['giulia quadrifoglio', 'stelvio quadrifoglio', 'giulia', 'stelvio', 'giulietta', '4c', 'tonale'],
  'Jaguar': ['f-type', 'xe', 'xf', 'xj', 'e-pace', 'f-pace', 'i-pace'],
  'Land Rover': ['range rover sport', 'range rover velar', 'range rover evoque', 'range rover', 'discovery sport', 'discovery', 'defender'],
  'Jeep': ['grand cherokee', 'wrangler', 'compass', 'renegade', 'gladiator', 'avenger'],
  'Tesla': ['model s', 'model 3', 'model x', 'model y'],
  'Dacia': ['duster', 'sandero stepway', 'sandero', 'jogger', 'spring', 'logan'],
  'Maserati': ['mc20', 'ghibli', 'quattroporte', 'levante', 'granturismo', 'grecale'],
  'Ferrari': ['sf90', 'f8 tributo', 'f8', 'roma', 'portofino', '296 gtb', '296', '812', 'purosangue', '488', '458'],
  'Lamborghini': ['revuelto', 'urus', 'huracan', 'aventador'],
  'Lexus': ['lc', 'ls', 'es', 'is', 'nx', 'rx', 'ux', 'rz'],
  'Mazda': ['mx-5', 'mazda3', 'mazda2', 'mazda6', 'cx-60', 'cx-5', 'cx-30', 'cx-3'],
  'Suzuki': ['swift sport', 'swift', 'vitara', 's-cross', 'jimny', 'ignis'],
  'Mitsubishi': ['outlander phev', 'outlander', 'eclipse cross', 'asx', 'l200'],
  'Smart': ['fortwo', 'forfour', '#1', '#3'],
  'Genesis': ['g80', 'g70', 'g90', 'gv80', 'gv70', 'gv60'],
  'Aston Martin': ['dbs', 'db11', 'db12', 'vantage', 'dbx'],
  'McLaren': ['720s', '765lt', '750s', 'gt', 'artura', '570s', '600lt'],
  'Bentley': ['continental gt', 'flying spur', 'bentayga'],
  'Subaru': ['wrx sti', 'wrx', 'brz', 'impreza', 'outback', 'forester', 'xv'],
  'Alpine': ['a110 s', 'a110 r', 'a110 gt', 'a110'],
  'MG': ['mg4', 'zs', 'hs', 'mg5', 'cyberster'],
  'Polestar': ['polestar 1', 'polestar 2', 'polestar 3', 'polestar 4'],
  'Abarth': ['595', '695', '500e'],
};

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
  
  // First check model patterns (more specific)
  for (const [brand, models] of Object.entries(MODEL_PATTERNS)) {
    for (const model of models) {
      if (lower.includes(model.toLowerCase())) {
        return brand;
      }
    }
  }
  
  // Then check brand names
  for (const brand of BRANDS) {
    if (lower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return 'Autre';
}

function extractModel(text: string, brand: string): string {
  if (brand === 'Autre') return 'Inconnu';
  
  const lower = text.toLowerCase();
  
  // First try to match known model patterns for this brand
  const brandModels = MODEL_PATTERNS[brand];
  if (brandModels) {
    for (const model of brandModels) {
      if (lower.includes(model.toLowerCase())) {
        return model.toUpperCase();
      }
    }
  }
  
  // Fallback: Remove brand from title and get remaining words
  const withoutBrand = text.replace(new RegExp(brand, 'gi'), '').trim();
  
  // Common patterns to extract model
  const patterns = [
    // Model like "A3", "X5", "C220", "E350"
    /\b([A-Z]{1,2}\s?\d{1,3}[A-Za-z]?)\b/i,
    // Model like "Golf", "Clio", "308"
    /\b(\d{3})\b/,
    // First meaningful word after brand removal
  ];
  
  for (const pattern of patterns) {
    const match = withoutBrand.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }
  
  // Last resort: first 2 words
  const words = withoutBrand.split(/\s+/).filter(w => w.length > 1 && !/^\d+$/.test(w) && !/^(ch|cv|km|€)$/i.test(w));
  
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
  
  // Extract description
  let description = '';
  if (mapping.description !== undefined) {
    description = row[mapping.description]?.trim() || '';
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
    description,
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
// PRICING ENGINE V3 - ADVANCED SEGMENTATION
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

// Equipment/options keywords for +5% bonus
const EQUIPMENT_KEYWORDS = [
  'toit ouvrant', 'toit panoramique', 'cuir', 'full', 'gps', 'navigation',
  'carplay', 'android auto', 'camera', 'caméra', '360', 'led', 'matrix',
  'acc', 'régulateur adaptatif', 'park assist', 'keyless', 'main libre',
  'sièges chauffants', 'sièges ventilés', 'attelage', 'jantes 19', 'jantes 20',
  'sound system', 'harman', 'bose', 'b&o', 'bang', 'burmester', 'meridian',
];

// Transmission premium
const TRANSMISSION_PREMIUM: Record<string, number> = {
  'automatique': 1.04,  // +4% for automatic
  'manuelle': 1.0,
  'autre': 1.0,
};

// Power category multipliers
const POWER_MULTIPLIERS: Record<string, number> = {
  'eco': 0.95,          // <100cv: -5%
  'standard': 1.0,      // 100-150cv: baseline
  'sport': 1.06,        // 150-250cv: +6%
  'performance': 1.12,  // >250cv: +12%
};

function getPowerCategory(puissance: number): string {
  if (puissance <= 0) return 'standard';
  if (puissance < 100) return 'eco';
  if (puissance < 150) return 'standard';
  if (puissance < 250) return 'sport';
  return 'performance';
}

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
 * Create broader cluster (year ±1) for fallback
 */
function createBroadClusterFingerprint(vehicle: ParsedVehicle): string {
  const marque = normalizeForFingerprint(vehicle.marque);
  const modele = normalizeForFingerprint(vehicle.modele);
  const yearBucket = Math.floor(vehicle.annee / 2) * 2; // Group by 2-year buckets
  const carburant = normalizeCarburant(vehicle.carburant);
  
  return `${marque}_${modele}_${yearBucket}_${carburant}_BROAD`;
}

/**
 * Detect if vehicle has premium finish based on title
 */
function detectPremiumVersion(titre: string): boolean {
  const lower = titre.toLowerCase();
  return PREMIUM_KEYWORDS.some(keyword => lower.includes(keyword));
}

/**
 * Detect equipment level (bonus options) based on title
 */
function detectEquipmentLevel(titre: string): number {
  const lower = titre.toLowerCase();
  let count = 0;
  for (const keyword of EQUIPMENT_KEYWORDS) {
    if (lower.includes(keyword)) count++;
  }
  // Max 3 equipment bonuses
  return Math.min(count, 3);
}

/**
 * Calculate cluster statistics with IQR outlier removal + weighted median
 */
function calculateClusterStats(vehicles: Array<{ prix: number; kilometrage: number }>): {
  moyenne: number;
  median: number;
  kmMoyen: number;
  prixParKm: number;
} | null {
  if (vehicles.length === 0) return null;
  
  const prices = vehicles.map(v => v.prix);
  const sorted = [...prices].sort((a, b) => a - b);
  
  // IQR outlier removal for 4+ samples
  let filteredVehicles = vehicles;
  if (sorted.length >= 4) {
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    filteredVehicles = vehicles.filter(v => v.prix >= lowerBound && v.prix <= upperBound);
  }
  
  if (filteredVehicles.length === 0) filteredVehicles = vehicles;
  
  const filteredPrices = filteredVehicles.map(v => v.prix).sort((a, b) => a - b);
  const filteredKms = filteredVehicles.map(v => v.kilometrage);
  
  const moyenne = filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length;
  const mid = Math.floor(filteredPrices.length / 2);
  const median = filteredPrices.length % 2 
    ? filteredPrices[mid] 
    : (filteredPrices[mid - 1] + filteredPrices[mid]) / 2;
  
  const kmMoyen = filteredKms.reduce((a, b) => a + b, 0) / filteredKms.length;
  
  // Calculate €/km using linear regression
  let prixParKm = 0;
  if (filteredVehicles.length >= 3) {
    const n = filteredVehicles.length;
    let sumKm = 0, sumPrix = 0, sumKmPrix = 0, sumKm2 = 0;
    
    for (const v of filteredVehicles) {
      sumKm += v.kilometrage;
      sumPrix += v.prix;
      sumKmPrix += v.kilometrage * v.prix;
      sumKm2 += v.kilometrage * v.kilometrage;
    }
    
    const denominator = n * sumKm2 - sumKm * sumKm;
    if (denominator !== 0) {
      prixParKm = Math.abs((n * sumKmPrix - sumKm * sumPrix) / denominator);
    }
  }
  
  // Fallback: use 2.5% per 10k km of average price
  if (prixParKm === 0 || !isFinite(prixParKm) || prixParKm > 1) {
    prixParKm = (moyenne * 0.025) / 10000;
  }
  
  return { moyenne, median, kmMoyen, prixParKm };
}

/**
 * Main pricing engine V3 with advanced multi-factor analysis
 */
export function calculateDealScores(
  vehicles: ParsedVehicle[],
  forcedMarque?: string,
  forcedModele?: string
): VehicleWithScore[] {
  // Apply forced brand/model if provided
  const processedVehicles = vehicles.map(v => ({
    ...v,
    marque: forcedMarque || v.marque,
    modele: forcedModele || v.modele,
  }));
  
  // STEP 1: Create exact clusters
  const exactClusters: Record<string, ParsedVehicle[]> = {};
  const broadClusters: Record<string, ParsedVehicle[]> = {};
  
  for (const vehicle of processedVehicles) {
    const exactId = createClusterFingerprint(vehicle);
    const broadId = createBroadClusterFingerprint(vehicle);
    
    if (!exactClusters[exactId]) exactClusters[exactId] = [];
    exactClusters[exactId].push(vehicle);
    
    if (!broadClusters[broadId]) broadClusters[broadId] = [];
    broadClusters[broadId].push(vehicle);
  }
  
  console.log(`Created ${Object.keys(exactClusters).length} exact clusters, ${Object.keys(broadClusters).length} broad clusters from ${vehicles.length} vehicles`);
  
  // STEP 2: Calculate stats per cluster
  type ClusterStat = {
    moyenne: number;
    median: number;
    kmMoyen: number;
    prixParKm: number;
    count: number;
  };
  
  const exactStats: Record<string, ClusterStat> = {};
  const broadStats: Record<string, ClusterStat> = {};
  
  for (const [clusterId, clusterVehicles] of Object.entries(exactClusters)) {
    const stats = calculateClusterStats(clusterVehicles.map(v => ({ prix: v.prix, kilometrage: v.kilometrage })));
    if (stats) {
      exactStats[clusterId] = { ...stats, count: clusterVehicles.length };
    }
  }
  
  for (const [clusterId, clusterVehicles] of Object.entries(broadClusters)) {
    const stats = calculateClusterStats(clusterVehicles.map(v => ({ prix: v.prix, kilometrage: v.kilometrage })));
    if (stats) {
      broadStats[clusterId] = { ...stats, count: clusterVehicles.length };
    }
  }
  
  // Log cluster distribution
  const validExact = Object.values(exactStats).filter(s => s.count >= 3).length;
  const validBroad = Object.values(broadStats).filter(s => s.count >= 3).length;
  console.log(`${validExact} exact clusters with 3+ vehicles, ${validBroad} broad clusters with 3+ vehicles`);
  
  // STEP 3: Calculate advanced scores for each vehicle
  return processedVehicles.map(vehicle => {
    const exactId = createClusterFingerprint(vehicle);
    const broadId = createBroadClusterFingerprint(vehicle);
    
    // Try exact stats first, fallback to broad
    let stats = exactStats[exactId];
    let usedBroad = false;
    
    if (!stats || stats.count < 3) {
      stats = broadStats[broadId];
      usedBroad = true;
    }
    
    const isPremium = detectPremiumVersion(vehicle.titre);
    const equipmentLevel = detectEquipmentLevel(vehicle.titre);
    const hasEnoughData = stats ? stats.count >= 3 : false;
    
    // No stats = no comparison possible
    if (!stats) {
      return {
        ...vehicle,
        clusterId: exactId,
        clusterSize: 1,
        coteCluster: vehicle.prix,
        ecartEuros: 0,
        ecartPourcent: 0,
        dealScore: 50,
        isPremium,
        hasEnoughData: false,
        prixMoyen: vehicle.prix,
        prixMedian: vehicle.prix,
        ecart: 0,
        segmentKey: exactId,
      };
    }
    
    // ADVANCED COTE CALCULATION
    let coteCluster = stats.median; // Start with median (more robust)
    
    // 1. Adjust for km difference from cluster average
    const kmDiff = vehicle.kilometrage - stats.kmMoyen;
    const kmAdjustment = kmDiff * stats.prixParKm;
    coteCluster -= kmAdjustment;
    
    // 2. Apply premium bonus (+10% for premium versions)
    if (isPremium) {
      coteCluster *= 1.10;
    }
    
    // 3. Apply equipment bonus (+2% per notable equipment, max 6%)
    if (equipmentLevel > 0) {
      coteCluster *= (1 + equipmentLevel * 0.02);
    }
    
    // 4. Apply transmission premium (if not already in exact cluster)
    if (usedBroad && vehicle.transmission !== 'autre') {
      const transPremium = TRANSMISSION_PREMIUM[vehicle.transmission] || 1.0;
      coteCluster *= transPremium;
    }
    
    // 5. Apply power category adjustment (if not already in exact cluster)
    if (usedBroad && vehicle.puissance > 0) {
      const powerCat = getPowerCategory(vehicle.puissance);
      const powerMult = POWER_MULTIPLIERS[powerCat] || 1.0;
      coteCluster *= powerMult;
    }
    
    // Ensure minimum reasonable price
    coteCluster = Math.max(1000, coteCluster);
    
    // Calculate écart (positive = good deal, negative = overpriced)
    const ecartEuros = coteCluster - vehicle.prix;
    const ecartPourcent = (ecartEuros / coteCluster) * 100;
    
    // Deal score with confidence weighting
    let dealScore: number;
    if (!hasEnoughData) {
      dealScore = 50;
    } else {
      // Base score from écart
      const baseScore = 50 + (ecartPourcent * 1.67);
      
      // Confidence penalty for broad clusters
      const confidenceMultiplier = usedBroad ? 0.85 : 1.0;
      
      // Bonus for larger clusters (more reliable)
      const sizeBonus = Math.min(10, stats.count);
      
      dealScore = Math.max(0, Math.min(100, baseScore * confidenceMultiplier + sizeBonus * 0.5));
    }
    
    return {
      ...vehicle,
      clusterId: exactId,
      clusterSize: stats.count,
      coteCluster: Math.round(coteCluster),
      ecartEuros: Math.round(ecartEuros),
      ecartPourcent: Math.round(ecartPourcent * 10) / 10,
      dealScore: Math.round(dealScore),
      isPremium,
      hasEnoughData,
      prixMoyen: Math.round(stats.moyenne),
      prixMedian: Math.round(stats.median),
      ecart: Math.round(-ecartEuros),
      segmentKey: usedBroad ? broadId : exactId,
    };
  });
}

export function getTopOpportunities(vehicles: VehicleWithScore[], limit = 500): VehicleWithScore[] {
  return [...vehicles]
    .filter(v => v.hasEnoughData && v.dealScore >= 55) // Slightly higher threshold
    .sort((a, b) => b.dealScore - a.dealScore)
    .slice(0, limit);
}
