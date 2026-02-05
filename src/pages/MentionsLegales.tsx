import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/landing';

const MentionsLegales = () => {
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
        <h1 className="text-3xl font-bold text-foreground mb-8">Mentions Légales</h1>
        
        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Éditeur du site</h2>
            <p className="text-muted-foreground">
              La Truffe<br />
              [Adresse à compléter]<br />
              Email : contact@latruffe.fr<br />
              Téléphone : [À compléter]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Hébergement</h2>
            <p className="text-muted-foreground">
              Ce site est hébergé par :<br />
              [Nom de l'hébergeur]<br />
              [Adresse de l'hébergeur]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Propriété intellectuelle</h2>
            <p className="text-muted-foreground">
              L'ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, etc.) est la propriété exclusive de La Truffe, à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Protection des données personnelles</h2>
            <p className="text-muted-foreground">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression des données vous concernant. Pour exercer ce droit, contactez-nous à : contact@latruffe.fr
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">Cookies</h2>
            <p className="text-muted-foreground">
              Ce site utilise des cookies pour améliorer votre expérience de navigation. En continuant à naviguer sur ce site, vous acceptez l'utilisation de cookies conformément à notre politique de confidentialité.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MentionsLegales;
