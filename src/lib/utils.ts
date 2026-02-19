import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalise un texte : convertit en minuscules sauf la première lettre de chaque phrase
 * Exemple: "VÉHICULE AUDI RS3 AVEC 160 000 KM. EXCELLENT ÉTAT" → "Véhicule audi rs3 avec 160 000 km. Excellent état"
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  
  // Convertir tout en minuscules d'abord
  let normalized = text.toLowerCase();
  
  // Mettre en majuscule la première lettre après un point ou au début
  normalized = normalized.replace(/(^\w|\.\s*\w)/g, (match) => match.toUpperCase());
  
  return normalized;
}

/**
 * Intelligence parsing d'options automobile
 * Détecte les mots-clés et les réorganise en sections logiques
 */
export interface SmartOption {
  icon: string;
  label: string;
  category: "PHARES" | "AUDIO" | "TECH" | "CONFORT" | "PERFORMANCE" | "SECURITE" | "CARROSSERIE" | "AUTRE";
  color: "blue" | "green" | "purple" | "amber" | "red" | "slate";
}

const SMART_OPTIONS_DB: Record<string, SmartOption> = {
  // PHARES & ÉCLAIRAGE
  "matrix": { icon: "💡", label: "Phares Matrix LED", category: "PHARES", color: "blue" },
  "led": { icon: "💡", label: "LED", category: "PHARES", color: "blue" },
  "xenon": { icon: "✨", label: "Phares Xénon", category: "PHARES", color: "blue" },
  "oled": { icon: "💡", label: "Feux OLED", category: "PHARES", color: "blue" },
  
  // AUDIO & MÉDIAS
  "bang": { icon: "🎵", label: "Bang & Olufsen", category: "AUDIO", color: "purple" },
  "olufsen": { icon: "🎵", label: "Bang & Olufsen", category: "AUDIO", color: "purple" },
  "harman": { icon: "🎵", label: "Harman Kardon", category: "AUDIO", color: "purple" },
  "dynaudio": { icon: "🎵", label: "Dynaudio", category: "AUDIO", color: "purple" },
  "bose": { icon: "🎵", label: "Bose", category: "AUDIO", color: "purple" },
  
  // TECHNOLOGIE
  "carplay": { icon: "📱", label: "Apple CarPlay", category: "TECH", color: "slate" },
  "android": { icon: "📱", label: "Android Auto", category: "TECH", color: "slate" },
  "kokpit": { icon: "🖥️", label: "Virtual Cockpit", category: "TECH", color: "slate" },
  "cockpit": { icon: "🖥️", label: "Digital Cockpit", category: "TECH", color: "slate" },
  "hud": { icon: "👁️", label: "Affichage Tête Haute (HUD)", category: "TECH", color: "slate" },
  
  // CONFORT
  "toit ouvrant": { icon: "☀️", label: "Toit Ouvrant", category: "CONFORT", color: "amber" },
  "toit pano": { icon: "☀️", label: "Toit Panoramique", category: "CONFORT", color: "amber" },
  "cuir": { icon: "🪑", label: "Intérieur Cuir", category: "CONFORT", color: "amber" },
  "alcantara": { icon: "🪑", label: "Alcantara", category: "CONFORT", color: "amber" },
  "climatisation": { icon: "❄️", label: "Climatisation Trizone", category: "CONFORT", color: "amber" },
  "massant": { icon: "💆", label: "Sièges Massants", category: "CONFORT", color: "amber" },
  
  // PERFORMANCE
  "turbo": { icon: "🚀", label: "Turbocompressé", category: "PERFORMANCE", color: "red" },
  "stage": { icon: "⚡", label: "Reprogrammation", category: "PERFORMANCE", color: "red" },
  "echappement sport": { icon: "💨", label: "Échappement Sport", category: "PERFORMANCE", color: "red" },
  "forgé": { icon: "🛡️", label: "Moteur Forgé", category: "PERFORMANCE", color: "red" },
  
  // SÉCURITÉ
  "blind": { icon: "🛡️", label: "Vitres Blindées", category: "SECURITE", color: "green" },
  "accident": { icon: "⚠️", label: "Historique Curatela", category: "SECURITE", color: "green" },
  
  // CARROSSERIE
  "ceramique": { icon: "✨", label: "Revêtement Céramique", category: "CARROSSERIE", color: "blue" },
  "ppf": { icon: "✨", label: "Protection Carrosserie (PPF)", category: "CARROSSERIE", color: "blue" },
  "covering": { icon: "🎨", label: "Covering/Wrap", category: "CARROSSERIE", color: "blue" },
};

export function smartParseOptions(options: string[]): Record<string, SmartOption[]> {
  const categorized: Record<string, SmartOption[]> = {};
  
  if (!options || options.length === 0) return categorized;
  
  options.forEach((option) => {
    const lowercased = option.toLowerCase();
    let matched = false;
    
    // Chercher dans la DB
    for (const [key, smartOption] of Object.entries(SMART_OPTIONS_DB)) {
      if (lowercased.includes(key)) {
        const category = smartOption.category;
        if (!categorized[category]) categorized[category] = [];
        
        // Éviter les doublons
        if (!categorized[category].some(opt => opt.label === smartOption.label)) {
          categorized[category].push(smartOption);
        }
        matched = true;
        break;
      }
    }
    
    // Si pas de match, ajouter comme AUTRE
    if (!matched) {
      if (!categorized["AUTRE"]) categorized["AUTRE"] = [];
      categorized["AUTRE"].push({
        icon: "📌",
        label: option,
        category: "AUTRE",
        color: "slate"
      });
    }
  });
  
  return categorized;
}

export function getOptionColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return colorMap[color] || colorMap.slate;
}
