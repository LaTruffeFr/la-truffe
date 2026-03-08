import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/landing';

const CGV = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center gap-4">
        <Link to="/"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" />Retour</Button></Link>
        <Link to="/" className="font-bold text-xl md:text-2xl tracking-tight text-slate-900 hover:opacity-80 transition-opacity">La Truffe</Link>
      </div>
    </header>

    <main className="flex-1 py-20 px-4">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-4xl font-black mb-8 text-slate-900">Conditions Générales de Vente et d'Utilisation</h1>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">Article 1 — Objet</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Les présentes Conditions Générales de Vente et d'Utilisation (ci-après « CGV/CGU ») régissent l'accès et l'utilisation du service La Truffe, une plateforme d'analyse et d'aide à la décision pour l'achat de véhicules d'occasion, exploitée par [NOM DE L'ENTREPRISE] (ci-après « l'Éditeur »).
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">Article 2 — Description du service</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          La Truffe propose un service d'audit automatisé par algorithme d'expertise propriétaire. L'utilisateur soumet le lien d'une annonce automobile en ligne. Le système analyse les données disponibles (prix, kilométrage, options, historique annoncé) et génère un rapport d'expertise comprenant : une estimation de valeur, un score de confiance, un devis prévisionnel d'entretien, des arguments de négociation et un avis d'expert.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          <strong>Important :</strong> La Truffe est un outil d'aide à la décision. Les rapports sont générés à partir des données déclarées par le vendeur et des modèles d'Intelligence Artificielle. Ils ne remplacent en aucun cas un contrôle technique professionnel, un essai physique du véhicule ou l'avis d'un mécanicien certifié. L'Éditeur ne saurait être tenu responsable en cas de panne mécanique, vice caché ou tout autre défaut survenant après l'achat du véhicule.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">Article 3 — Système de crédits</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Le service fonctionne par un système de crédits prépayés. Chaque audit consomme un (1) crédit. Les crédits sont achetés à l'unité ou par pack via un paiement sécurisé. Les crédits achetés sont valables sans limitation de durée et ne sont ni échangeables ni remboursables, sauf dispositions contraires prévues par la loi.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">Article 4 — Prix et paiement</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Les prix sont indiqués en euros TTC sur la page de tarification. Le paiement est effectué en ligne par carte bancaire via la plateforme sécurisée <strong>Stripe</strong>. L'Éditeur se réserve le droit de modifier ses tarifs à tout moment ; les crédits déjà achetés restent acquis aux conditions initiales.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">Article 5 — Droit de rétractation</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Conformément à l'article <strong>L.221-28, 13°</strong> du Code de la Consommation, le droit de rétractation de 14 jours <strong>ne peut être exercé</strong> pour les contenus numériques fournis sur un support immatériel dont l'exécution a commencé avec l'accord du consommateur. En conséquence, dès qu'un crédit est consommé pour générer un rapport d'audit, le service est considéré comme pleinement exécuté et aucun remboursement ne pourra être demandé pour ce crédit.
        </p>
        <p className="text-slate-600 leading-relaxed mb-4">
          Les crédits non consommés peuvent faire l'objet d'une demande de remboursement dans un délai de 14 jours suivant leur achat, en contactant le service client.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">Article 6 — Limitation de responsabilité</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          L'Éditeur s'engage à fournir un service de qualité mais ne garantit pas l'exhaustivité ni l'exactitude des informations contenues dans les rapports, ceux-ci étant basés sur des données déclaratives et des modèles algorithmiques. La responsabilité de l'Éditeur est limitée au montant du crédit consommé pour le rapport concerné. En aucun cas l'Éditeur ne pourra être tenu responsable de dommages indirects, pertes financières, pertes de chance ou préjudices consécutifs à une décision d'achat.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">Article 7 — Compte utilisateur</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          L'accès au service nécessite la création d'un compte avec une adresse email valide. L'utilisateur est responsable de la confidentialité de ses identifiants. Toute utilisation frauduleuse du compte doit être signalée immédiatement. L'Éditeur se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGV/CGU.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">Article 8 — Propriété intellectuelle</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Les rapports générés sont destinés à un usage strictement personnel. Toute reproduction, revente ou diffusion commerciale des rapports sans l'accord écrit de l'Éditeur est interdite. Les algorithmes, le design et le contenu du site sont protégés par le droit de la propriété intellectuelle.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">Article 9 — Données personnelles</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Le traitement des données personnelles est détaillé dans notre <Link to="/confidentialite" className="text-indigo-600 hover:underline font-semibold">Politique de Confidentialité</Link>.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-indigo-900">Article 10 — Droit applicable et litiges</h2>
        <p className="text-slate-600 leading-relaxed mb-4">
          Les présentes CGV/CGU sont soumises au droit français. En cas de litige, une tentative de résolution amiable sera privilégiée. Conformément aux articles L.611-1 et suivants du Code de la Consommation, le consommateur peut recourir gratuitement au service de médiation de la consommation. À défaut, les tribunaux compétents seront ceux du ressort du siège social de l'Éditeur.
        </p>

        <p className="text-slate-400 text-xs mt-12">Dernière mise à jour : Mars 2026</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default CGV;
