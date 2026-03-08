import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ShieldCheck, Armchair, Smartphone, Sparkles, Package, Check } from 'lucide-react';

interface SmartOptionsDisplayProps {
  options: string[];
}

interface Category {
  key: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  keywords: string[];
}

const CATEGORIES: Category[] = [
  {
    key: 'security',
    label: 'Sécurité & Conduite',
    icon: <ShieldCheck className="w-5 h-5" />,
    colorClass: 'text-rose-600 dark:text-rose-400',
    bgClass: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30',
    keywords: ['abs', 'esp', 'radar', 'recul', 'caméra', 'camera', 'franchissement', 'angle mort', 'régulateur', 'regulateur', 'limitateur', 'airbag', 'freinage', 'urgence', 'isofix', 'led', 'xénon', 'xenon', 'phare', 'antibrouillard', 'feux'],
  },
  {
    key: 'comfort',
    label: 'Confort & Intérieur',
    icon: <Armchair className="w-5 h-5" />,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/30',
    keywords: ['clim', 'cuir', 'alcantara', 'chauffant', 'massant', 'électrique', 'electrique', 'volant', 'accoudoir', 'tapis', 'rétro', 'retro', 'luminosité', 'pluie', 'keyless', 'sans clé', 'sans cle', 'démarrage', 'demarrage', 'coffre', 'siège', 'siege', 'banquette'],
  },
  {
    key: 'tech',
    label: 'Multimédia & Tech',
    icon: <Smartphone className="w-5 h-5" />,
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/30',
    keywords: ['gps', 'navigation', 'bluetooth', 'carplay', 'android', 'usb', 'tactile', 'son', 'bose', 'harman', 'focal', 'radio', 'écran', 'ecran', 'virtual cockpit', 'affichage tête haute', 'head up', 'hifi', 'hi-fi', 'dab'],
  },
  {
    key: 'exterior',
    label: 'Esthétique & Extérieur',
    icon: <Sparkles className="w-5 h-5" />,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30',
    keywords: ['jante', 'alliage', 'alu', 'toit', 'panoramique', 'ouvrant', 'peinture', 'métallisée', 'metallisee', 'vitres surteintées', 'surteintees', 'becquet', 'pack sport', 'barres de toit', 'rétroviseur rabattable', 'chrome'],
  },
];

function categorizeOptions(options: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {
    security: [],
    comfort: [],
    tech: [],
    exterior: [],
    other: [],
  };

  for (const opt of options) {
    const lower = opt.toLowerCase();
    let matched = false;
    for (const cat of CATEGORIES) {
      if (cat.keywords.some(kw => lower.includes(kw))) {
        result[cat.key].push(opt);
        matched = true;
        break;
      }
    }
    if (!matched) result.other.push(opt);
  }

  return result;
}

export function SmartOptionsDisplay({ options }: SmartOptionsDisplayProps) {
  const categorized = useMemo(() => categorizeOptions(options), [options]);

  if (!options || options.length === 0) return null;

  const allCategories = [
    ...CATEGORIES,
    {
      key: 'other',
      label: 'Autres',
      icon: <Package className="w-5 h-5" />,
      colorClass: 'text-muted-foreground',
      bgClass: 'bg-muted border-border',
      keywords: [],
    },
  ];

  const visibleCategories = allCategories.filter(cat => categorized[cat.key]?.length > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {visibleCategories.map(cat => (
        <Card key={cat.key} className={`rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border ${cat.bgClass}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={cat.colorClass}>{cat.icon}</div>
            <h4 className="text-base md:text-lg font-black text-foreground">{cat.label}</h4>
            <span className="ml-auto text-xs font-bold text-muted-foreground bg-background/60 rounded-full px-2 py-0.5">
              {categorized[cat.key].length}
            </span>
          </div>
          <ul className="space-y-2">
            {categorized[cat.key].map((opt, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-muted-foreground first-letter:uppercase leading-snug">{opt}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
