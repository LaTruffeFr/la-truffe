import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/landing';

const MentionsLegales = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center gap-4">
        <Link to="/"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" />Retour</Button></Link>
        <Link to="/" className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity">La Truffe</Link>
      </div>
    </header>

    <main className="flex-1 py-20 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-4xl font-black mb-8 text-slate-900">Mentions Légales</h1>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">1. Éditeur du site</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Le site <strong>latruffe.lovable.app</strong> (ci-après « La Truffe ») est édité par :<br />
          [NOM DE L'ENTREPRISE] — [FORME JURIDIQUE]<br />
          Capital social : [MONTANT] €<br />
          SIRET : [NUMÉRO SIRET]<br />
          Siège social : [ADRESSE COMPLÈTE]<br />
          Directeur de la publication : [NOM DU RESPONSABLE]<br />
          Contact : <a href="mailto:latruffe.consulting@gmail.com" className="text-indigo-600 hover:underline">latruffe.consulting@gmail.com</a>
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">2. Hébergement</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Le site est hébergé par :<br />
          <strong>Lovable / Supabase</strong><br />
          Adresse : 970 Toa Payoh North, #07-04, Singapore 318992 (Supabase Pte. Ltd.)<br />
          Les données sont stockées sur des serveurs sécurisés situés dans l'Union Européenne (AWS eu-west).
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">3. Propriété intellectuelle</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          L'ensemble du contenu du site La Truffe (textes, graphismes, images, logos, icônes, logiciels, algorithmes d'analyse avancés) est la propriété exclusive de l'éditeur ou de ses partenaires. Toute reproduction, représentation ou diffusion, même partielle, est interdite sans autorisation écrite préalable, conformément aux articles L.111-1 et suivants du Code de la Propriété Intellectuelle.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">4. Responsabilité</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Les informations fournies sur le site le sont à titre indicatif et ne sauraient engager la responsabilité de l'éditeur. Les rapports d'audit générés par Intelligence Artificielle constituent une aide à la décision et ne se substituent ni à un contrôle mécanique professionnel, ni à un essai physique du véhicule. L'éditeur ne pourra être tenu responsable des dommages directs ou indirects résultant de l'utilisation des informations fournies.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">5. Données personnelles</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          La collecte et le traitement des données personnelles sont détaillés dans notre <Link to="/confidentialite" className="text-indigo-600 hover:underline font-semibold">Politique de Confidentialité</Link>. Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Pour exercer vos droits, contactez-nous à : <a href="mailto:latruffe.consulting@gmail.com" className="text-indigo-600 hover:underline">latruffe.consulting@gmail.com</a>.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">6. Cookies</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Le site utilise des cookies strictement nécessaires à l'authentification et au bon fonctionnement du service. Aucun cookie publicitaire ou de traçage tiers n'est déposé. Pour en savoir plus, consultez notre <Link to="/confidentialite" className="text-indigo-600 hover:underline font-semibold">Politique de Confidentialité</Link>.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">7. Droit applicable</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Les présentes mentions légales sont soumises au droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux compétents seront ceux du ressort du siège social de l'éditeur.
        </p>

        <p className="text-slate-400 text-xs mt-12">Dernière mise à jour : Mars 2026</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default MentionsLegales;
