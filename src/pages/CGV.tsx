import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/landing';

const CGV = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <Link to="/" className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity">
            La Truffe
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground mb-8">Conditions Générales de Vente</h1>
        
        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Article 1 - Objet</h2>
            <p className="text-muted-foreground">
              Les présentes Conditions Générales de Vente (CGV) régissent les ventes de services d'audit de prix automobile proposés par La Truffe via son site internet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Article 2 - Prix</h2>
            <p className="text-muted-foreground">
              Les prix de nos services sont indiqués en euros toutes taxes comprises (TTC). La Truffe se réserve le droit de modifier ses prix à tout moment, étant entendu que le prix figurant au moment de la commande sera le seul applicable à l'acheteur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Article 3 - Commande</h2>
            <p className="text-muted-foreground">
              La validation de la commande par le client implique l'acceptation pleine et entière des présentes CGV. Le client reconnaît avoir pris connaissance des caractéristiques du service avant de passer commande.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Article 4 - Paiement</h2>
            <p className="text-muted-foreground">
              Le paiement s'effectue en ligne par carte bancaire via notre partenaire de paiement sécurisé Stripe. Le paiement est exigible immédiatement à la commande.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Article 5 - Livraison</h2>
            <p className="text-muted-foreground">
              Les rapports d'audit sont délivrés par voie électronique dans un délai maximum de 24 heures après validation de la commande. Le client est notifié par email dès que son rapport est disponible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Article 6 - Droit de rétractation</h2>
            <p className="text-muted-foreground">
              Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contrats de fourniture de contenu numérique non fourni sur un support matériel dont l'exécution a commencé après accord préalable exprès du consommateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Article 7 - Responsabilité</h2>
            <p className="text-muted-foreground">
              Les informations fournies dans les rapports d'audit sont données à titre indicatif et ne constituent pas une garantie de prix. La Truffe ne pourra être tenue responsable des décisions d'achat prises sur la base de ces informations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Article 8 - Litiges</h2>
            <p className="text-muted-foreground">
              Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire. À défaut, les tribunaux français seront seuls compétents.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CGV;
