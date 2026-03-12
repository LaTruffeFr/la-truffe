import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Armchair, Smartphone, Sparkles, Package, Check } from 'lucide-react';

interface SmartOptionsDisplayProps {
  options: string[];
}

interface Category {
  key: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  badgeClass: string;
  accentBorder: string;
  keywords: string[];
}

const CATEGORIES: Category[] = [
  {
    key: 'security',
    label: 'Sécurité & Conduite',
    icon: <ShieldCheck className="w-5 h-5" />,
    colorClass: 'text-rose-600 dark:text-rose-400',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    accentBorder: 'border-t-rose-500',
    keywords: ['abs', 'esp', 'radar', 'recul', 'caméra', 'camera', 'franchissement', 'angle mort', 'régulateur', 'regulateur', 'limitateur', 'airbag', 'freinage', 'urgence', 'isofix', 'led', 'xénon', 'xenon', 'phare', 'antibrouillard', 'feux'],
  },
  {
    key: 'comfort',
    label: 'Confort & Intérieur',
    icon: <Armchair className="w-5 h-5" />,
    colorClass: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    accentBorder: 'border-t-blue-500',
    keywords: ['clim', 'cuir', 'alcantara', 'chauffant', 'massant', 'électrique', 'electrique', 'volant', 'accoudoir', 'tapis', 'rétro', 'retro', 'luminosité', 'pluie', 'keyless', 'sans clé', 'sans cle', 'démarrage', 'demarrage', 'coffre', 'siège', 'siege', 'banquette'],
  },
  {
    key: 'tech',
    label: 'Multimédia & Tech',
    icon: <Smartphone className="w-5 h-5" />,
    colorClass: 'text-violet-600 dark:text-violet-400',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    accentBorder: 'border-t-violet-500',
    keywords: ['gps', 'navigation', 'bluetooth', 'carplay', 'android', 'usb', 'tactile', 'son', 'bose', 'harman', 'focal', 'radio', 'écran', 'ecran', 'virtual cockpit', 'affichage tête haute', 'head up', 'hifi', 'hi-fi', 'dab'],
  },
  {
    key: 'exterior',
    label: 'Esthétique & Extérieur',
    icon: <Sparkles className="w-5 h-5" />,
    colorClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    accentBorder: 'border-t-amber-500',
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

  const allCategories: Category[] = [
    ...CATEGORIES,
    {
      key: 'other',
      label: 'Autres',
      icon: <Package className="w-5 h-5" />,
      colorClass: 'text-muted-foreground',
      badgeClass: 'bg-muted text-muted-foreground',
      accentBorder: 'border-t-border',
      keywords: [],
    },
  ];

  const visibleCategories = allCategories.filter(cat => categorized[cat.key]?.length > 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleCategories.map(cat => (
        <Card
          key={cat.key}
          className={`rounded-2xl border border-border bg-card shadow-sm overflow-hidden border-t-[3px] ${cat.accentBorder}`}
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center gap-3 border-b border-border">
            <div className={`${cat.colorClass}`}>{cat.icon}</div>
            <h4 className="text-sm font-black text-foreground tracking-tight">{cat.label}</h4>
            <Badge variant="secondary" className="ml-auto text-[10px] font-bold px-2 py-0.5">
              {categorized[cat.key].length}
            </Badge>
          </div>

          {/* Items */}
          <div className="p-4 space-y-1.5">
            {categorized[cat.key].map((opt, i) => (
              <div key={i} className="flex items-start gap-2.5 py-1.5 px-1">
                <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/80 font-medium leading-snug first-letter:uppercase">{opt}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
