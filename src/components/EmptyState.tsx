import { TrendingUp, Target, Zap, Shield } from "lucide-react";

export function EmptyState() {
  const features = [
    {
      icon: TrendingUp,
      title: "Analyse de Marché",
      description: "Calcul automatique des prix moyens par segment",
    },
    {
      icon: Target,
      title: "Détection d'Opportunités",
      description: "Identification des véhicules sous-cotés",
    },
    {
      icon: Zap,
      title: "Visualisation Sniper",
      description: "Graphique interactif Prix vs Kilométrage",
    },
    {
      icon: Shield,
      title: "Filtres Avancés",
      description: "Affinez votre recherche par marque, prix, km",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gradient-gold mb-4">
          Bienvenue sur La Truffe
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Votre outil de détection d'opportunités automobiles. Uploadez votre fichier CSV 
          d'annonces pour lancer l'analyse de marché.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, index) => (
          <div
            key={feature.title}
            className="glass-card p-6 text-center animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
              <feature.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 max-w-2xl mx-auto">
        <h3 className="font-semibold text-foreground mb-3">Format CSV attendu</h3>
        <div className="bg-background rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <div className="text-muted-foreground">
            Titre,Prix,Année,Kilométrage,Lien,Image
          </div>
          <div className="text-foreground mt-1">
            Peugeot 308 1.6 HDI,12500,2019,85000,https://...,https://...
          </div>
        </div>
      </div>
    </div>
  );
}
