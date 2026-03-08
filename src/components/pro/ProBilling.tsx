import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Crown, Zap, Shield } from 'lucide-react';

export function ProBilling() {
  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <Card className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/20 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Crown className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">La Truffe Pro</h3>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Actif</Badge>
              </div>
              <p className="text-sm text-slate-400">Prochain renouvellement le 8 avril 2026</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white font-mono">150 <span className="text-lg text-slate-400">€/mois</span></p>
          </div>
        </div>
      </Card>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Zap, title: 'Audits illimités', desc: 'Analysez autant de véhicules que nécessaire', color: 'text-amber-400' },
          { icon: Shield, title: 'Marque Blanche', desc: 'Rapports personnalisés à vos couleurs', color: 'text-emerald-400' },
          { icon: CreditCard, title: 'CRM intégré', desc: 'Gérez votre stock avec le Kanban Pro', color: 'text-blue-400' },
        ].map((feat) => (
          <Card key={feat.title} className="bg-slate-900 border-slate-800 rounded-2xl p-5">
            <feat.icon className={`w-8 h-8 ${feat.color} mb-3`} />
            <h4 className="font-semibold text-white text-sm">{feat.title}</h4>
            <p className="text-xs text-slate-400 mt-1">{feat.desc}</p>
          </Card>
        ))}
      </div>

      {/* Usage */}
      <Card className="bg-slate-900 border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4">Utilisation ce mois</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Audits réalisés', value: '47', max: '∞' },
            { label: 'Rapports PDF', value: '32', max: '∞' },
            { label: 'Véhicules dans le CRM', value: '18', max: '200' },
            { label: 'Rapports marque blanche', value: '12', max: '∞' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400 font-mono">{stat.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
              <p className="text-xs text-slate-600 mt-0.5">/ {stat.max}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex-1">
          <CreditCard className="w-4 h-4 mr-2" /> Gérer le moyen de paiement
        </Button>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white flex-1">
          Télécharger les factures
        </Button>
      </div>
    </div>
  );
}
