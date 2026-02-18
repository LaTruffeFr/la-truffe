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
  tags?: string[];            // Expert analysis tags
  fiabilite?: number;         // Reliability score 1-10
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
  lien: [/link/i, /url/i, /href/i, /lien/i, /web_scraper_start_url/i],
  localisation: [/location/i, /city/i, /ville/i, /localisation/i, /region/i, /département/i],
  description: [/description/i, /detail/i, /détail/i, /annonce/i, /texte/i, /body/i, /contenu/i, /^infos?$/i],
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

  // Extract year: multiple formats
  // Format 1: Année: "2018" or Année: 2018
  // Format 2: LeBonCoin scrape - "Année modèle2017" (no separator)
  const yearMatch = text.match(/ann[ée]e\s*(?:mod[èe]le)?\s*[:=]?\s*"?(\d{4})"?/i);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    if (year >= 1980 && year <= 2026) result.annee = year;
  }
  // Format 3: "Date de première mise en circulation07/2017"
  if (!result.annee) {
    const circMatch = text.match(/mise\s*en\s*circulation\s*[:=]?\s*"?\d{0,2}\/?(\d{4})"?/i);
    if (circMatch) {
      const year = parseInt(circMatch[1], 10);
      if (year >= 1980 && year <= 2026) result.annee = year;
    }
  }

  // Extract mileage: multiple formats
  // Format 1: Kilométrage: "54000 km"
  // Format 2: LeBonCoin scrape - "Kilométrage84014 km" (no separator)
  const kmMatch = text.match(/kilom[ée]trage\s*[:=]?\s*"?([0-9\s.]+)\s*km"?/i);
  if (kmMatch) {
    const kmDigits = kmMatch[1].replace(/[^0-9]/g, '');
    const km = parseInt(kmDigits, 10);
    if (km >= 0 && km <= 500000) result.kilometrage = km;
  }

  // Extract fuel: multiple formats
  // Format 1: Carburant: "Essence"
  // Format 2: "ÉnergieEssence" (LeBonCoin scrape, no separator)
  const fuelMatch = text.match(/(?:carburant|[ée]nergie)\s*[:=]?\s*"?([A-Za-zÀ-ÿ]+)"?/i);
  if (fuelMatch) {
    const fuel = fuelMatch[1].trim().toLowerCase();
    if (/essence/i.test(fuel)) result.carburant = 'essence';
    else if (/diesel/i.test(fuel)) result.carburant = 'diesel';
    else if (/[ée]lectrique/i.test(fuel)) result.carburant = 'electrique';
    else if (/hybride/i.test(fuel)) result.carburant = 'hybride';
    else if (/gpl|gnv/i.test(fuel)) result.carburant = 'gpl';
  }

  // Extract transmission: multiple formats
  // Format 1: Boîte de vitesse: "Automatique"
  // Format 2: "Boîte de vitesseAutomatique" (no separator)
  const transMatch = text.match(/bo[îi]te\s*(?:de\s*vitesse)?\s*[:=]?\s*"?([A-Za-zÀ-ÿ]+)"?/i);
  if (transMatch) {
    const trans = transMatch[1].trim().toLowerCase();
    if (/automatique|auto/i.test(trans)) result.transmission = 'automatique';
    else if (/manu/i.test(trans)) result.transmission = 'manuelle';
  }

  // Extract puissance DIN from "Puissance DIN400 Ch" format
  const powerMatch = text.match(/puissance\s*(?:din)?\s*[:=]?\s*"?(\d{2,4})\s*(?:ch|cv|hp)/i);
  if (powerMatch) {
    // Store in result for later use (not part of CombinedData but useful)
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
    if (/ann[ée]e.*kilom[ée]trage/i.test(field) || /kilom[ée]trage.*ann[ée]e/i.test(field) || /[ée]nergie.*bo[îi]te/i.test(field) || /marque.*mod[èe]le.*ann[ée]e/i.test(field)) {
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
  if (prix <= 0) {
    // Try to extract price from title or description via regex
    const priceRegex = /([0-9\s]+)\s*€/;
    for (const field of row) {
      const match = field.match(priceRegex);
      if (match) {
        const digits = match[1].replace(/[^0-9]/g, '');
        const extracted = parseInt(digits, 10);
        if (extracted >= 500 && extracted <= 2000000) { prix = extracted; break; }
      }
    }
    // If still no price, default to 0 instead of rejecting
    if (prix <= 0) prix = 0;
  }
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
// LEBONCOIN JSON PARSER
// ============================================

interface LBCAdAttribute {
  key: string;
  value: string;
  value_label?: string;
}

interface LBCAd {
  list_id: number;
  subject: string;
  body?: string;
  url: string;
  price?: number[];
  price_cents?: number;
  images?: {
    urls?: string[];
    thumb_url?: string;
  };
  attributes?: LBCAdAttribute[];
  location?: {
    city_label?: string;
    city?: string;
    department_name?: string;
    region_name?: string;
  };
}

function getAttr(attrs: LBCAdAttribute[] | undefined, key: string): string {
  if (!attrs) return '';
  const attr = attrs.find(a => a.key === key);
  return attr?.value_label || attr?.value || '';
}

function parseLeBonCoinJSON(jsonText: string): ParsedVehicle[] | null {
  try {
    const data = JSON.parse(jsonText);
    // Detect LeBonCoin API format: must have "ads" array
    const ads: LBCAd[] = data.ads || data;
    if (!Array.isArray(ads) || ads.length === 0) return null;
    // Verify first item looks like an LBC ad
    if (!ads[0].list_id && !ads[0].subject) return null;

    console.log(`Detected LeBonCoin JSON format with ${ads.length} ads`);

    const vehicles: ParsedVehicle[] = [];

    for (let i = 0; i < ads.length; i++) {
      const ad = ads[i];
      if (!ad.subject) continue;

      const attrs = ad.attributes;
      const titre = ad.subject || '';

      // Price: from price array (euros) or price_cents
      let prix = 0;
      if (ad.price && ad.price.length > 0) {
        prix = ad.price[0];
      } else if (ad.price_cents) {
        prix = Math.round(ad.price_cents / 100);
      }
      if (prix <= 0) continue;

      // Year from regdate attribute
      const regdate = getAttr(attrs, 'regdate');
      let annee = 0;
      const yearMatch = regdate.match(/\b(19[89]\d|20[0-2]\d)\b/);
      if (yearMatch) annee = parseInt(yearMatch[1]);

      // Mileage
      const mileageStr = getAttr(attrs, 'mileage');
      const kilometrage = parseInt(mileageStr.replace(/[^0-9]/g, '')) || 0;

      // Brand & model from attributes or title
      let marque = getAttr(attrs, 'u_car_brand') || getAttr(attrs, 'brand');
      let modele = getAttr(attrs, 'u_car_model');
      // Clean model value like "BMW_M4" → "M4"
      if (modele.includes('_')) {
        const parts = modele.split('_');
        modele = parts.slice(1).join(' ');
      }
      if (!marque) marque = extractBrand(titre);
      if (!modele || modele === 'Autres' || modele === 'model_all') {
        modele = extractModel(titre, marque);
      }

      // Fuel
      const fuelLabel = getAttr(attrs, 'fuel').toLowerCase();
      let carburant = 'autre';
      if (/essence/i.test(fuelLabel)) carburant = 'essence';
      else if (/diesel/i.test(fuelLabel)) carburant = 'diesel';
      else if (/[ée]lectrique/i.test(fuelLabel)) carburant = 'electrique';
      else if (/hybride/i.test(fuelLabel)) carburant = 'hybride';
      else carburant = extractCarburant(titre);

      // Transmission
      const gearboxLabel = getAttr(attrs, 'gearbox').toLowerCase();
      let transmission = 'autre';
      if (/automatique|auto/i.test(gearboxLabel)) transmission = 'automatique';
      else if (/manu/i.test(gearboxLabel)) transmission = 'manuelle';
      else transmission = extractTransmission(titre);

      // Power DIN
      const powerDin = parseInt(getAttr(attrs, 'horse_power_din')) || cleanPuissance(titre);

      // Image
      const image = ad.images?.urls?.[0] || ad.images?.thumb_url || '';

      // Location
      const loc = ad.location;
      const localisation = loc?.city_label || loc?.city || 
        [loc?.department_name, loc?.region_name].filter(Boolean).join(', ') || '';

      // Description (body)
      const description = (ad.body || '').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();

      vehicles.push({
        id: `v-${ad.list_id || Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        titre: titre.slice(0, 200),
        marque: marque || 'Autre',
        modele: modele || 'Inconnu',
        prix,
        kilometrage,
        annee: annee || new Date().getFullYear(),
        carburant,
        transmission,
        puissance: powerDin,
        image,
        lien: ad.url || '#',
        localisation,
        description: description.slice(0, 2000),
      });
    }

    console.log(`Parsed ${vehicles.length} vehicles from LeBonCoin JSON`);
    return vehicles;
  } catch (e) {
    // Not valid JSON or not LBC format
    return null;
  }
}

// ============================================
// BROKEN CSV PRE-PROCESSOR
// ============================================

/**
 * Detects and fixes CSVs where titles/descriptions contain commas
 * but were not properly quoted, resulting in too many columns per row.
 * 
 * Pattern: external_id, title..., PRICE, YEAR, MILEAGE, image_url, listing_url, description...
 */
function preprocessBrokenCSV(rawText: string): string {
  const lines = rawText.split('\n').filter(l => l.trim());
  if (lines.length < 2) return rawText;

  const header = lines[0].trim();
  // Check if this looks like the broken format (header has expected columns)
  const headerLower = header.toLowerCase();
  const hasExpectedHeaders = 
    headerLower.includes('title') && 
    headerLower.includes('price') && 
    headerLower.includes('description');
  
  if (!hasExpectedHeaders) return rawText;

  // Check if data rows have way too many columns (sign of broken quoting)
  const firstDataLine = lines[1];
  const roughColCount = firstDataLine.split(',').length;
  if (roughColCount < 15) return rawText; // Properly formatted, no fix needed

  console.log('Detected broken CSV format, preprocessing...');

  const fixedLines = ['external_id,title,price,year,mileage,image_url,url,description'];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // Strategy: find the two URLs (image + listing) as anchors
      const imgUrlMatch = line.match(/(https?:\/\/img\.[^\s,]+)/);
      const listingUrlMatch = line.match(/(https?:\/\/www\.leboncoin\.fr\/[^\s,]+)/);
      
      if (!imgUrlMatch || !listingUrlMatch) {
        // Fallback: try generic URL detection
        const urls = line.match(/(https?:\/\/[^\s,]+)/g) || [];
        if (urls.length < 2) continue;
      }

      const imgUrl = imgUrlMatch?.[1] || '';
      const listingUrl = listingUrlMatch?.[1] || '';

      // Split the line around the image URL
      const imgIdx = line.indexOf(imgUrl);
      const listingIdx = line.indexOf(listingUrl);

      // Part before image URL: contains external_id, title, price, year, mileage
      const beforeUrls = line.substring(0, imgIdx).replace(/,\s*$/, '');
      // Part after listing URL: contains description
      const afterListingUrl = line.substring(listingIdx + listingUrl.length).replace(/^,\s*/, '');

      // Clean description: remove wrapping quotes and join
      const description = afterListingUrl
        .replace(/^"/, '').replace(/"$/, '')
        .replace(/""/g, '"')
        .split(',')
        .map(s => s.trim().replace(/^"/, '').replace(/"$/, ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      // From beforeUrls, extract external_id, title, price, year, mileage
      // Work backwards: the last 3 numbers before the URL are mileage, year, price (in reverse)
      const parts = beforeUrls.split(',').map(s => s.trim().replace(/^"/, '').replace(/"$/, ''));
      
      // Find numbers working backwards
      let mileage = '', year = '', price = '';
      let titleEndIdx = parts.length;

      // Scan backwards for 3 consecutive number-like values
      for (let j = parts.length - 1; j >= 2; j--) {
        const v1 = parts[j]?.replace(/[^0-9]/g, '');
        const v2 = parts[j - 1]?.replace(/[^0-9]/g, '');
        const v3 = parts[j - 2]?.replace(/[^0-9]/g, '');

        const n1 = parseInt(v1);
        const n2 = parseInt(v2);
        const n3 = parseInt(v3);

        // Pattern: price (>500), year (2000-2026), mileage (>0)
        if (n3 >= 500 && n2 >= 2000 && n2 <= 2026 && n1 >= 0) {
          price = v3;
          year = v2;
          mileage = v1;
          titleEndIdx = j - 2;
          break;
        }
      }

      if (!price || !year) continue;

      // External ID is the first part (may be merged with title start)
      let externalId = '';
      let titleParts: string[] = [];

      // First part often starts with the external_id number
      const firstPart = parts[0];
      const idMatch = firstPart.match(/^(\d{8,12})/);
      if (idMatch) {
        externalId = idMatch[1];
        const remainder = firstPart.substring(idMatch[1].length).trim();
        if (remainder) titleParts.push(remainder);
        titleParts.push(...parts.slice(1, titleEndIdx));
      } else {
        externalId = firstPart;
        titleParts = parts.slice(1, titleEndIdx);
      }

      const title = titleParts
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Escape for CSV
      const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
      fixedLines.push(`${externalId},${esc(title)},${price},${year},${mileage},${esc(imgUrl)},${esc(listingUrl)},${esc(description)}`);

    } catch (e) {
      console.warn('Failed to preprocess line', i, e);
    }
  }

  console.log(`Preprocessed ${fixedLines.length - 1} rows from broken CSV`);
  return fixedLines.join('\n');
}

// ============================================
// FLATTENED LBC JSON-AS-CSV PARSER
// ============================================

/**
 * Parses CSV where columns are flattened JSON paths from LeBonCoin API export.
 * Headers like: list_id, subject, body, price/0, url, images/urls/0,
 * attributes/0/key, attributes/0/value, etc.
 */
function parseFlattenedLBCCsv(headers: string[], rows: string[][]): ParsedVehicle[] | null {
  // Detect this format by checking for characteristic flattened headers
  const hasListId = headers.includes('list_id');
  const hasSubject = headers.includes('subject');
  const hasPriceSlash = headers.includes('price/0') || headers.includes('price_cents');
  if (!hasListId || !hasSubject || !hasPriceSlash) return null;

  console.log('Detected flattened LBC JSON-as-CSV format');

  const colIdx = (name: string) => headers.indexOf(name);
  const listIdIdx = colIdx('list_id');
  const subjectIdx = colIdx('subject');
  const bodyIdx = colIdx('body');
  const urlIdx = colIdx('url');
  const priceIdx = colIdx('price/0') !== -1 ? colIdx('price/0') : colIdx('price_cents');
  const isPriceCents = colIdx('price/0') === -1;
  const imageIdx = colIdx('images/urls/0') !== -1 ? colIdx('images/urls/0') : colIdx('images/thumb_url');
  const brandIdx = colIdx('brand');
  const cityIdx = colIdx('location/city_label');

  // Find attribute columns: build a map of attribute index → { keyCol, valueCol }
  const attrPairs: { keyIdx: number; valIdx: number }[] = [];
  for (let i = 0; i < headers.length; i++) {
    const m = headers[i].match(/^attributes\/(\d+)\/key$/);
    if (m) {
      const valCol = headers.indexOf(`attributes/${m[1]}/value`);
      if (valCol !== -1) attrPairs.push({ keyIdx: i, valIdx: valCol });
    }
  }

  const vehicles: ParsedVehicle[] = [];

  for (const row of rows) {
    if (row.length < 10) continue;

    const get = (idx: number) => (idx >= 0 && idx < row.length ? (row[idx] || '').trim() : '');

    let price = 0;
    const rawPrice = get(priceIdx);
    if (rawPrice) {
      price = parseInt(rawPrice.replace(/[^\d]/g, ''), 10) || 0;
      if (isPriceCents && price > 0) price = Math.round(price / 100);
    }
    if (price <= 0) continue;

    // Extract attributes
    const attrs: Record<string, string> = {};
    for (const { keyIdx, valIdx } of attrPairs) {
      const key = get(keyIdx);
      const val = get(valIdx);
      if (key && val) attrs[key] = val;
    }

    const year = parseInt(attrs['regdate'] || '', 10) || 0;
    const mileage = parseInt((attrs['mileage'] || '').replace(/[^\d]/g, ''), 10) || 0;
    if (!year && !mileage) continue;

    const fuelMap: Record<string, string> = { '1': 'essence', '2': 'diesel', '3': 'gpl', '4': 'electrique', '5': 'hybride' };
    const gearboxMap: Record<string, string> = { '1': 'manuelle', '2': 'automatique' };

    vehicles.push({
      id: get(listIdIdx) || `flat-${vehicles.length}`,
      titre: get(subjectIdx),
      marque: get(brandIdx) || '',
      modele: '',
      prix: price,
      kilometrage: mileage,
      annee: year,
      carburant: fuelMap[attrs['fuel']] || attrs['fuel'] || '',
      transmission: gearboxMap[attrs['gearbox']] || attrs['gearbox'] || '',
      puissance: parseInt(attrs['horse_power_din'] || '', 10) || 0,
      image: get(imageIdx),
      lien: get(urlIdx),
      localisation: get(cityIdx),
      description: get(bodyIdx),
    });
  }

  console.log(`Parsed ${vehicles.length} vehicles from flattened LBC CSV`);
  return vehicles.length > 0 ? vehicles : null;
}

// ============================================
// WEBSCRAPER.IO CSV PARSER
// ============================================

/**
 * Parses CSV exported from WebScraper.io for LeBonCoin.
 * Headers: web_scraper_order, web_scraper_start_url, pagination, annonces, image, titre, info, description, prix
 * The `info` column is a concatenated string of key-value pairs from LeBonCoin listing details.
 */
function parseWebScraperCsv(headers: string[], rows: string[][]): ParsedVehicle[] | null {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());

  // Detect format: must have "titre" (or "annonces") AND "info" columns
  const hasInfo = lowerHeaders.includes('info') || lowerHeaders.includes('infos');
  const hasTitre = lowerHeaders.includes('titre');
  const hasAnnonces = lowerHeaders.includes('annonces');
  const hasWebScraper = lowerHeaders.some(h => h.includes('web_scraper'));

  if (!hasInfo || (!hasTitre && !hasAnnonces)) return null;

  console.log('Detected WebScraper.io CSV format');

  const idx = (name: string) => {
    const i = lowerHeaders.indexOf(name);
    if (i >= 0) return i;
    return -1;
  };
  const titreIdx = idx('titre');
  const infoIdx = lowerHeaders.includes('info') ? idx('info') : idx('infos');
  const descIdx = idx('description');
  const prixIdx = idx('prix');
  const imageIdx = idx('image');
  const annoncesIdx = idx('annonces');
  // Also check for web_scraper_start_url as listing URL
  const wsUrlIdx = lowerHeaders.indexOf('web_scraper_start_url');

  const vehicles: ParsedVehicle[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 4) continue;

    const get = (colIdx: number) => (colIdx >= 0 && colIdx < row.length ? (row[colIdx] || '').trim() : '');

    const titre = get(titreIdx);
    const info = get(infoIdx);
    const description = get(descIdx);
    const rawPrix = get(prixIdx);
    const image = get(imageIdx);
    const lien = get(annoncesIdx) || get(wsUrlIdx);

    // Parse price: "48 500 €" or "47 990 €"
    let prix = 0;
    if (rawPrix) {
      const digits = rawPrix.replace(/[^0-9]/g, '');
      prix = parseInt(digits, 10) || 0;
      if (prix < 500 || prix > 2000000) prix = 0;
    }
    // If no prix column, try extracting from titre or description
    if (prix <= 0) {
      const priceRegex = /([0-9\s]+)\s*€/;
      for (const text of [titre, info, description]) {
        const match = text.match(priceRegex);
        if (match) {
          const digits = match[1].replace(/[^0-9]/g, '');
          const extracted = parseInt(digits, 10);
          if (extracted >= 500 && extracted <= 2000000) { prix = extracted; break; }
        }
      }
    }
    // Default to 0 if no price found — don't reject the row

    // Parse the concatenated `info` field for structured data
    const parsed = parseWebScraperInfoField(info);

    // Extract brand/model from info or title
    let marque = parsed.marque || extractBrand(titre);
    let modele = parsed.modele || extractModel(titre, marque);

    // Year, km, fuel, transmission from info field
    const annee = parsed.annee || cleanYear(titre) || new Date().getFullYear();
    const kilometrage = parsed.kilometrage || 0;
    const carburant = parsed.carburant || extractCarburant(titre + ' ' + info);
    const transmission = parsed.transmission || extractTransmission(titre + ' ' + info);
    const puissance = parsed.puissance || cleanPuissance(titre + ' ' + info);

    if (!titre && marque === 'Autre') continue;

    vehicles.push({
      id: `ws-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      titre: (titre || `${marque} ${modele}`).slice(0, 200),
      marque,
      modele: modele || 'Inconnu',
      prix,
      kilometrage,
      annee,
      carburant,
      transmission,
      puissance,
      image: image || '',
      lien: lien || '#',
      localisation: parsed.localisation || '',
      description: (description || '').slice(0, 2000),
    });
  }

  console.log(`Parsed ${vehicles.length} vehicles from WebScraper CSV`);
  return vehicles.length > 0 ? vehicles : null;
}

/**
 * Parse the concatenated `info` field from WebScraper LeBonCoin scrape.
 * Example: "Les informations clésMarqueBMWModèleM4Année modèle2014Kilométrage88638 kmÉnergieEssenceBoîte de vitesseAutomatique..."
 */
function parseWebScraperInfoField(info: string): {
  marque: string;
  modele: string;
  annee: number;
  kilometrage: number;
  carburant: string;
  transmission: string;
  puissance: number;
  localisation: string;
} {
  const result = { marque: '', modele: '', annee: 0, kilometrage: 0, carburant: 'autre', transmission: 'autre', puissance: 0, localisation: '' };
  if (!info) return result;

  // Extract Marque
  const marqueMatch = info.match(/Marque\s*([A-Za-zÀ-ÿ\s-]+?)(?=Modèle|Année|$)/i);
  if (marqueMatch) result.marque = marqueMatch[1].trim();

  // Extract Modèle
  const modeleMatch = info.match(/Modèle\s*([A-Za-zÀ-ÿ0-9\s-]+?)(?=Année|Kilom|Énergie|Version|$)/i);
  if (modeleMatch) result.modele = modeleMatch[1].trim();

  // Extract Année modèle
  const anneeMatch = info.match(/Année\s*(?:modèle)?\s*(\d{4})/i);
  if (anneeMatch) {
    const y = parseInt(anneeMatch[1], 10);
    if (y >= 1980 && y <= 2026) result.annee = y;
  }

  // Extract Kilométrage: "88638 km" or "88 638 km"
  const kmMatch = info.match(/Kilom[ée]trage\s*([0-9\s]+)\s*km/i);
  if (kmMatch) {
    const km = parseInt(kmMatch[1].replace(/\s/g, ''), 10);
    if (km >= 0 && km <= 500000) result.kilometrage = km;
  }

  // Extract Énergie/Carburant
  const fuelMatch = info.match(/[ÉE]nergie\s*([A-Za-zÀ-ÿ]+)/i);
  if (fuelMatch) {
    const fuel = fuelMatch[1].toLowerCase();
    if (/essence/i.test(fuel)) result.carburant = 'essence';
    else if (/diesel/i.test(fuel)) result.carburant = 'diesel';
    else if (/[ée]lectrique/i.test(fuel)) result.carburant = 'electrique';
    else if (/hybride/i.test(fuel)) result.carburant = 'hybride';
  }

  // Extract Boîte de vitesse
  const transMatch = info.match(/Bo[îi]te\s*de\s*vitesse\s*([A-Za-zÀ-ÿ]+)/i);
  if (transMatch) {
    const trans = transMatch[1].toLowerCase();
    if (/automatique|auto/i.test(trans)) result.transmission = 'automatique';
    else if (/manu/i.test(trans)) result.transmission = 'manuelle';
  }

  // Extract Puissance DIN
  const puissanceMatch = info.match(/Puissance\s*DIN\s*(\d+)\s*Ch/i);
  if (puissanceMatch) {
    const p = parseInt(puissanceMatch[1], 10);
    if (p >= 50 && p <= 2000) result.puissance = p;
  }

  // Extract Puissance fiscale as fallback
  if (result.puissance === 0) {
    const cvMatch = info.match(/Puissance\s*fiscale\s*(\d+)\s*Cv/i);
    if (cvMatch) {
      result.puissance = parseInt(cvMatch[1], 10) || 0;
    }
  }

  return result;
}

// ============================================
// MANGLED JSON-AS-CSV RECONSTRUCTOR
// ============================================
// MAIN PARSER
// ============================================

/**
 * Detects and reconstructs JSON that was mangled by being saved/exported as CSV.
 * The JSON commas were treated as CSV delimiters, splitting the data into cells.
 * Strategy: Papa.parse to properly unescape doubled quotes, then rejoin cells with commas.
 */
function reconstructJSONFromCSV(rawText: string): string | null {
  const trimmed = rawText.trim();
  // Must contain doubled-quote patterns and LBC-specific keys
  if (!trimmed.includes('""') || (!trimmed.includes('list_id') && !trimmed.includes('ads'))) {
    return null;
  }

  console.log('Attempting to reconstruct JSON from mangled CSV...');

  try {
    // Papa.parse handles CSV unescaping (doubled quotes → single quotes)
    const parsed = Papa.parse(trimmed, { skipEmptyLines: true });
    if (!parsed.data || (parsed.data as string[][]).length === 0) return null;

    // Join each row's cells back with commas, then join rows with newlines
    const lines = (parsed.data as string[][]).map(row => row.join(','));
    const reconstructed = lines.join('\n');

    // Verify it's valid JSON
    JSON.parse(reconstructed);
    console.log('Successfully reconstructed JSON from mangled CSV');
    return reconstructed;
  } catch {
    return null;
  }
}

// ============================================

export function parseCSVFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ParsedVehicle[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let rawText = e.target?.result as string;
        if (!rawText) {
          reject(new Error('Impossible de lire le fichier'));
          return;
        }

        onProgress?.(5);

        // Try LeBonCoin JSON format first (pure JSON file)
        const trimmed = rawText.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          const jsonVehicles = parseLeBonCoinJSON(trimmed);
          if (jsonVehicles && jsonVehicles.length > 0) {
            onProgress?.(100);
            resolve(jsonVehicles);
            return;
          }
        }

        // Try reconstructing JSON from mangled CSV (JSON saved as CSV)
        const reconstructed = reconstructJSONFromCSV(rawText);
        if (reconstructed) {
          const jsonVehicles = parseLeBonCoinJSON(reconstructed);
          if (jsonVehicles && jsonVehicles.length > 0) {
            onProgress?.(100);
            resolve(jsonVehicles);
            return;
          }
        }

        onProgress?.(10);

        // Try flattened LBC JSON-as-CSV (columns are flattened JSON paths)
        {
          const quickParse = Papa.parse(rawText, { preview: 2, skipEmptyLines: true });
          if (quickParse.data && (quickParse.data as string[][]).length >= 2) {
            const flatHeaders = (quickParse.data as string[][])[0].map(h => String(h || '').trim());
            if (flatHeaders.includes('list_id') && flatHeaders.includes('subject')) {
              const fullParse = Papa.parse(rawText, { skipEmptyLines: true });
              const allRows = (fullParse.data as string[][]);
              const flatVehicles = parseFlattenedLBCCsv(allRows[0].map(h => String(h || '').trim()), allRows.slice(1));
              if (flatVehicles && flatVehicles.length > 0) {
                onProgress?.(100);
                resolve(flatVehicles);
                return;
              }
            }
          }
        }

        // Try WebScraper.io CSV format (async chunked)
        {
          const quickParse2 = Papa.parse(rawText, { preview: 2, skipEmptyLines: true });
          if (quickParse2.data && (quickParse2.data as string[][]).length >= 2) {
            const wsHeaders = (quickParse2.data as string[][])[0].map(h => String(h || '').trim());
            const lowerWsHeaders = wsHeaders.map(h => h.toLowerCase());
            if ((lowerWsHeaders.includes('info') || lowerWsHeaders.includes('infos')) && (lowerWsHeaders.includes('titre') || lowerWsHeaders.includes('annonces'))) {
              onProgress?.(15);
              const fullParse2 = Papa.parse(rawText, { skipEmptyLines: true });
              const allRows2 = (fullParse2.data as string[][]);
              const headers2 = allRows2[0].map(h => String(h || '').trim());
              const dataRows = allRows2.slice(1);
              
              // Process WebScraper rows in chunks to avoid UI freeze
              const totalRows = dataRows.length;
              const CHUNK_SIZE = 200;
              const vehicles: ParsedVehicle[] = [];
              let currentIdx = 0;

              function processWsChunk() {
                const end = Math.min(currentIdx + CHUNK_SIZE, totalRows);
                const chunkResult = parseWebScraperCsv(headers2, dataRows.slice(currentIdx, end));
                if (chunkResult) vehicles.push(...chunkResult);
                currentIdx = end;
                const progress = 15 + Math.round((currentIdx / totalRows) * 85);
                onProgress?.(Math.min(progress, 99));

                if (currentIdx < totalRows) {
                  setTimeout(processWsChunk, 0);
                } else {
                  console.log(`Parsed ${vehicles.length} vehicles from WebScraper CSV (${totalRows} rows)`);
                  onProgress?.(100);
                  if (vehicles.length > 0) {
                    resolve(vehicles);
                  } else {
                    // Fall through to generic CSV parsing
                    parseGenericCSV();
                  }
                }
              }

              processWsChunk();
              return;
            }
          }
        }

        function parseGenericCSV() {
          // Preprocess broken CSVs (LeBonCoin export format)
          rawText = preprocessBrokenCSV(rawText);
          onProgress?.(15);

          Papa.parse(rawText, {
            complete: (results) => {
              try {
                const data = results.data as string[][];
                if (data.length < 2) {
                  reject(new Error('CSV vide ou invalide'));
                  return;
                }
                
                const headers = data[0].map(h => String(h || ''));
                let mapping = detectColumns(headers);
                const sampleRows = data.slice(1, 51).map(r => r.map(cell => String(cell || '')));
                mapping = refineMapping(headers, sampleRows, mapping);

                console.log('Detected columns:', mapping);
                console.log('Headers:', headers.slice(0, 10));
                
                const totalRows = data.length - 1;
                const CHUNK_SIZE = 500;
                const vehicles: ParsedVehicle[] = [];
                let currentIndex = 1;

                function processChunk() {
                  const end = Math.min(currentIndex + CHUNK_SIZE, data.length);
                  for (let i = currentIndex; i < end; i++) {
                    const row = data[i].map(cell => String(cell || ''));
                    if (row.length < 3) continue;
                    const vehicle = parseRow(row, mapping, i);
                    if (vehicle) vehicles.push(vehicle);
                  }
                  currentIndex = end;
                  const progress = 15 + Math.round(((currentIndex - 1) / totalRows) * 85);
                  onProgress?.(Math.min(progress, 99));

                  if (currentIndex < data.length) {
                    setTimeout(processChunk, 0);
                  } else {
                    console.log(`Parsed ${vehicles.length} vehicles from ${totalRows} rows`);
                    onProgress?.(100);
                    resolve(vehicles);
                  }
                }

                processChunk();
              } catch (error) {
                reject(error);
              }
            },
            error: (error: any) => reject(error),
            skipEmptyLines: true,
          });
        }

        parseGenericCSV();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsText(file);
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
