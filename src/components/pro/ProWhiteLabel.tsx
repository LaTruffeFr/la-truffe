import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Palette, Building2, Phone, FileText, Eye } from 'lucide-react';

export function ProWhiteLabel() {
  const [garageName, setGarageName] = useState('Garage Prestige Auto');
  const [siret, setSiret] = useState('123 456 789 00012');
  const [phone, setPhone] = useState('01 23 45 67 89');
  const [color, setColor] = useState('#D97706');
  const [logoUrl, setLogoUrl] = useState('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Configuration */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Configuration Marque Blanche</h2>
          <p className="text-sm text-slate-400">Personnalisez vos rapports d'expertise avec votre identité.</p>
        </div>

        <Card className="bg-slate-900 border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-amber-500" /> Nom du Garage
            </Label>
            <Input
              value={garageName}
              onChange={(e) => setGarageName(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white h-12 focus:border-amber-500/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-amber-500" /> Numéro de SIRET
            </Label>
            <Input
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white h-12 focus:border-amber-500/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-amber-500" /> Téléphone public
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white h-12 focus:border-amber-500/50"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2 text-sm">
              <Upload className="w-4 h-4 text-amber-500" /> Logo du Garage
            </Label>
            <label className="flex items-center justify-center w-full h-32 bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-amber-500/50 transition-colors group">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-h-24 max-w-[200px] object-contain" />
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2 group-hover:text-amber-500 transition-colors" />
                  <p className="text-sm text-slate-500 group-hover:text-slate-300">Cliquez pour uploader</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2 text-sm">
              <Palette className="w-4 h-4 text-amber-500" /> Couleur principale
            </Label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-slate-700 cursor-pointer bg-transparent"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white font-mono h-12 focus:border-amber-500/50 flex-1"
                maxLength={7}
              />
              <div className="w-12 h-12 rounded-xl border border-slate-700" style={{ backgroundColor: color }} />
            </div>
          </div>

          <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold h-12 text-base">
            Enregistrer la configuration
          </Button>
        </Card>
      </div>

      {/* Live Preview */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-bold text-white">Aperçu en direct</h2>
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">Live</Badge>
        </div>

        <Card className="bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          {/* Simulated PDF Header */}
          <div className="p-6 border-b-4" style={{ borderColor: color }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo garage" className="h-12 max-w-[120px] object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: color }}>
                    {garageName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{garageName || 'Nom du Garage'}</h3>
                  <p className="text-xs text-slate-500">SIRET : {siret || '—'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">{phone || '—'}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Rapport d'expertise</p>
              </div>
            </div>
          </div>

          {/* Simulated PDF Body */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <h4 className="font-bold text-slate-900">BMW Série 3 320d — 2019</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Cote Estimée', value: '22 500 €' },
                { label: 'Kilométrage', value: '87 000 km' },
                { label: 'Score Confiance', value: '92/100' },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <p className="font-bold text-sm text-slate-900 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="h-2 bg-slate-100 rounded-full mt-4" />
            <div className="h-2 bg-slate-100 rounded-full w-3/4" />
            <div className="h-2 bg-slate-100 rounded-full w-1/2" />
          </div>

          {/* Simulated PDF Footer */}
          <div className="px-6 py-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400">
              Rapport généré par {garageName || 'votre garage'} — Propulsé par l'expertise automobile avancée
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
