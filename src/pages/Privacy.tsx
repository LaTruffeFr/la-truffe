import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/landing';

const Privacy = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center gap-4">
        <Link to="/"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" />Retour</Button></Link>
        <Link to="/" className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity">La Truffe</Link>
      </div>
    </header>

    <main className="flex-1 py-20 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-4xl font-black mb-8 text-slate-900">Politique de Confidentialité</h1>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">1. Responsable du traitement</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Le responsable du traitement des données personnelles est [NOM DE L'ENTREPRISE], dont le siège social est situé au [ADRESSE COMPLÈTE]. Contact : <a href="mailto:latruffe.consulting@gmail.com" className="text-indigo-600 hover:underline">latruffe.consulting@gmail.com</a>.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">2. Données collectées</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Dans le cadre de l'utilisation du service La Truffe, nous collectons les données suivantes :
        </p>
        <ul className="list-disc list-inside text-slate-600 leading-relaxed mb-4 space-y-1 pl-4">
          <li><strong>Adresse email</strong> — pour la création et la gestion de votre compte utilisateur.</li>
          <li><strong>Historique des rapports</strong> — pour vous permettre de retrouver vos audits depuis votre tableau de bord.</li>
          <li><strong>Données de navigation</strong> — cookies de session strictement nécessaires à l'authentification et au bon fonctionnement du service.</li>
        </ul>
        <p className="text-slate-600 leading-relaxed mb-4">
          <strong>Nous ne collectons aucune donnée sensible</strong> (origine ethnique, opinions politiques, données de santé, etc.).
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">3. Finalité du traitement</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Les données collectées sont utilisées exclusivement pour :
        </p>
        <ul className="list-disc list-inside text-slate-600 leading-relaxed mb-4 space-y-1 pl-4">
          <li>La fourniture et l'amélioration du service d'audit automobile.</li>
          <li>La gestion de votre compte et de vos crédits.</li>
          <li>L'envoi de notifications liées à votre utilisation du service (rapports prêts, etc.).</li>
          <li>Le respect de nos obligations légales et comptables.</li>
        </ul>
        <p className="text-slate-600 leading-relaxed mb-4">
          Vos données ne sont jamais vendues, louées ou cédées à des tiers à des fins commerciales ou publicitaires.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">4. Paiement et données bancaires</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Les paiements sont intégralement gérés par <strong>Stripe</strong>, prestataire de paiement certifié PCI DSS de niveau 1. La Truffe <strong>n'a jamais accès</strong> à vos numéros de carte bancaire. Aucune donnée de paiement n'est stockée sur nos serveurs. Pour en savoir plus, consultez la <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">politique de confidentialité de Stripe</a>.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">5. Cookies</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          La Truffe utilise uniquement des <strong>cookies strictement nécessaires</strong> au fonctionnement du service :
        </p>
        <ul className="list-disc list-inside text-slate-600 leading-relaxed mb-4 space-y-1 pl-4">
          <li><strong>Cookie de session</strong> — maintient votre authentification pendant votre visite.</li>
          <li><strong>Cookie de consentement</strong> — enregistre votre acceptation du bandeau cookies.</li>
        </ul>
        <p className="text-slate-600 leading-relaxed mb-4">
          Aucun cookie publicitaire, de traçage ou analytique tiers n'est déposé. Le site n'utilise pas Google Analytics ni aucun autre outil de tracking.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">6. Hébergement et sécurité des données</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Les données sont hébergées par Supabase (serveurs AWS situés dans l'Union Européenne, région eu-west). L'accès aux données est protégé par des politiques de sécurité au niveau des lignes (Row-Level Security) et le chiffrement des communications (TLS/SSL).
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">7. Durée de conservation</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Vos données personnelles sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données sont effacées dans un délai de 30 jours. Les données de facturation sont conservées pendant la durée légale de 10 ans conformément aux obligations comptables françaises.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">8. Vos droits (RGPD)</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants :
        </p>
        <ul className="list-disc list-inside text-slate-600 leading-relaxed mb-4 space-y-1 pl-4">
          <li><strong>Droit d'accès</strong> — obtenir une copie de vos données personnelles.</li>
          <li><strong>Droit de rectification</strong> — corriger vos données inexactes ou incomplètes.</li>
          <li><strong>Droit de suppression</strong> — demander l'effacement de vos données.</li>
          <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré.</li>
          <li><strong>Droit d'opposition</strong> — vous opposer au traitement de vos données.</li>
          <li><strong>Droit à la limitation</strong> — demander la limitation du traitement.</li>
        </ul>
        <p className="text-slate-600 leading-relaxed mb-4">
          Pour exercer vos droits, contactez-nous à : <a href="mailto:latruffe.consulting@gmail.com" className="text-indigo-600 hover:underline">latruffe.consulting@gmail.com</a>. Nous nous engageons à répondre dans un délai de 30 jours. Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">www.cnil.fr</a>).
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">9. Modifications</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Nous nous réservons le droit de modifier la présente politique à tout moment. En cas de modification substantielle, les utilisateurs seront informés par email ou par notification sur le site. La date de dernière mise à jour est indiquée ci-dessous.
        </p>

        <p className="text-slate-400 text-xs mt-12">Dernière mise à jour : Mars 2026</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
