import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { smartParseOptions, getOptionColorClass, type SmartOption } from '@/lib/utils';

interface SmartOptionsDisplayProps {
  options: string[];
  rawDescription?: string;
}

export function SmartOptionsDisplay({ options, rawDescription }: SmartOptionsDisplayProps) {
  const [showRaw, setShowRaw] = useState(false);
  const categorized = smartParseOptions(options);
  
  // Ordre de catégories préféré
  const categoryOrder = ['PHARES', 'AUDIO', 'TECH', 'CONFORT', 'PERFORMANCE', 'SECURITE', 'CARROSSERIE', 'AUTRE'];
  const sortedCategories = categoryOrder.filter(cat => categorized[cat] && categorized[cat].length > 0);

  if (options.length === 0) return null;

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-md bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">🛠️ Équipements & Features</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="space-y-6">
            {sortedCategories.map((category) => {
              const items = categorized[category] || [];
              if (items.length === 0) return null;
              
              const categoryTitles: Record<string, string> = {
                PHARES: "💡 Phares & Éclairage",
                AUDIO: "🎵 Audio & Médias",
                TECH: "📱 Technologie",
                CONFORT: "☀️ Confort",
                PERFORMANCE: "🚀 Performance",
                SECURITE: "🛡️ Sécurité",
                CARROSSERIE: "🎨 Carrosserie",
                AUTRE: "📌 Autres Équipements",
              };

              return (
                <div key={category}>
                  <h4 className="text-sm font-bold text-slate-900 mb-3">{categoryTitles[category]}</h4>
                  <div className="flex flex-wrap gap-2">
                    {items.map((option: SmartOption, idx: number) => (
                      <Badge
                        key={idx}
                        className={`px-3 py-1.5 text-sm border font-medium shadow-sm ${getOptionColorClass(option.color)}`}
                      >
                        {option.icon} {option.label}
                      </Badge>
                    ))}
                  </div>
                  {category !== sortedCategories[sortedCategories.length - 1] && (
                    <Separator className="mt-6" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Bouton pour voir la description originale */}
          {rawDescription && (
            <div className="mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRaw(!showRaw)}
                className="w-full justify-center text-xs border-slate-300"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                {showRaw ? 'Masquer' : 'Voir'} la description originale
                {showRaw ? <ChevronUp className="w-4 h-4 ml-1.5" /> : <ChevronDown className="w-4 h-4 ml-1.5" />}
              </Button>

              {showRaw && (
                <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                    {rawDescription}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
