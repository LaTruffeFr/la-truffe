import { TrendingUp, Target, Zap, Shield, Upload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  const features = [
    {
      icon: TrendingUp,
      title: "Analyse de Marché",
      description: "Calcul automatique des prix moyens par segment",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Target,
      title: "Détection d'Opportunités",
      description: "Identification des véhicules sous-cotés",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Zap,
      title: "Visualisation Sniper",
      description: "Graphique interactif Prix vs Kilométrage",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: Shield,
      title: "Score de Confiance",
      description: "Évaluez la fiabilité de chaque opportunité",
      color: "text-chart-neutral",
      bgColor: "bg-chart-neutral/10",
    },
  ];

  return (
    <div className="space-y-8 py-8">
      {/* Hero Section */}
      <div className="text-center py-12 space-y-6 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary">
          <Zap className="w-4 h-4" />
          Prêt pour l'analyse
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold">
          <span className="text-gradient-gold">Bienvenue sur La Truffe</span>
        </h2>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Votre outil intelligent de détection d'opportunités automobiles. 
          Uploadez votre fichier CSV d'annonces pour lancer l'analyse de marché.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" />
            <Button variant="gold" size="xl" className="gap-2">
              <Upload className="w-5 h-5" />
              Importer un CSV
              <ArrowRight className="w-5 h-5" />
            </Button>
          </label>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="glass-card p-6 text-center animate-fade-in hover:scale-[1.02] transition-transform duration-300 group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <feature.icon className={`w-7 h-7 ${feature.color}`} />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* CSV Format Guide */}
      <div className="glass-card p-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-muted">
            <Shield className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Format CSV attendu</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Compatible avec l'export LeBonCoin et format standard
            </p>
            <div className="bg-background rounded-lg p-4 font-mono text-sm overflow-x-auto border border-border">
              <div className="text-muted-foreground">
                Titre,Prix,Année,Kilométrage,Lien,Image
              </div>
              <div className="text-foreground mt-2">
                Peugeot 308 1.6 HDI,12500,2019,85000,https://...,https://...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
