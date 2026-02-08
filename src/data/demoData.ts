import { VehicleWithScore } from "@/lib/csvParser";

// --- FONCTION DE SÉCURITÉ (OBLIGATOIRE) ---
// Elle empêche l'écran blanc en remplissant les données manquantes
const completeVehicle = (v: any): VehicleWithScore => ({
  ...v,
  localisation: v.localisation || "France",
  puissance: v.puissance || 400,
  clusterId: `DEMO_${v.marque}_${v.modele}`,
  clusterSize: v.clusterSize || 25,
  coteCluster: v.prix + (v.ecartEuros || 0),
  isPremium: true,
  hasEnoughData: true,
  prixMoyen: v.prix + (v.ecartEuros || 0),
  prixMedian: v.prix + (v.ecartEuros || 0),
  ecart: -(v.ecartEuros || 0),
  segmentKey: `DEMO_${v.marque}`,
  dealScore: Math.abs(v.dealScore || 50),
});

export interface DemoReport {
  id: string;
  created_at: string;
  updated_at: string;
  marque: string;
  modele: string;
  annee_min: number;
  annee_max: number;
  status: 'pending' | 'in_progress' | 'completed';
  prix_moyen: number;
  decote_par_10k: number;
  opportunites_count: number;
  admin_notes: string;
  expert_opinion?: string;
  negotiation_arguments?: string;
  vehicles_data: VehicleWithScore[];
}

// Données mises à jour le 08/02/2026 depuis LeBonCoin
export const demoReports: Record<string, DemoReport> = {
  "demo-1": {
    id: "demo-1",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    marque: "Audi",
    modele: "RS3 Sportback (8V1 / 8V2)",
    annee_min: 2015,
    annee_max: 2020,
    status: "completed",
    prix_moyen: 48500,
    decote_par_10k: 1100,
    opportunites_count: 12,
    admin_notes: "Marché très actif sur la RS3. Les modèles 2017-2019 (8V2) représentent le meilleur rapport qualité/prix. Attention aux imports allemands mal équipés.",
    expert_opinion: `"Le Chant du Cygne à 5 Cylindres."

L'Audi RS3 est une légende pour une seule raison : son moteur 5 cylindres 2.5L. C'est le bruit d'une demi-Lamborghini Huracan. Mais attention, toutes les RS3 ne se valent pas.

**La Phase 1 (8V1 - 2015/2016 - 367ch)** : C'est l'entrée de gamme. Bloc moteur en fonte (lourd), elle a tendance à "sous-virer" (tirer tout droit) dans les virages serrés. C'est du solide, mais la boîte peut être capricieuse.

**La Phase 2 (8V2 - 2017/2020 - 400ch)** : Le Graal. Nouveau bloc en aluminium (DAZA), plus léger (-26kg), plus puissant, et surtout beaucoup plus dynamique. C'est celle qu'il faut acheter pour la collection.

**Le Piège (2019+)** : Attention aux modèles après mi-2018 équipés du FAP (Filtre à Particules). Le moteur passe du code DAZA au code DNWA. Le bruit est étouffé, la voiture perd de son âme. Une "Sans FAP" de 2017 vaut plus cher qu'une "FAP" de 2020.

**Verdict** : Visez une Phase 2 (2017-2018) moteur DAZA. C'est la cote la plus stable. Si vous prenez une Phase 1, le prix doit être "plancher" (<35k€) pour compenser la technologie vieillissante.`,
    negotiation_arguments: `1. **L'Argument "Maladie" : Les Disques de Frein Voilés (1 500 € - 2 000 €)**

C'est LA maladie chronique des RS3 8V. Les disques avant d'origine (en forme de vague) ne supportent pas la chauffe et se voilent très vite.

*L'Attaque :* Lors de l'essai, freine fort à 110-130 km/h. Si le volant tremble, même un tout petit peu, les disques sont morts.

*La Phrase :* "Le volant vibre au freinage. C'est la maladie des disques 'Wave'. Audi ne prend plus ça en charge. Il faut passer sur un kit Brembo ou Girodisc pour régler le problème. Ça me coûte 2000€ de billets dès demain."

2. **L'Argument "Maintenance" : La Pompe Haldex (500 €)**

Le système Quattro (Haldex) nécessite une vidange tous les 3 ans / 45 000 km. Mais le piège, c'est que Audi ne nettoie pas le tamis (filtre) lors de la vidange standard. Résultat : la pompe s'encrasse et le 4x4 tombe en panne (tu te retrouves en traction avant).

*L'Attaque :* Regarde la facture de la dernière vidange Haldex. Si la mention "Nettoyage tamis/crépine" n'y est pas...

*La Phrase :* "La vidange Haldex a été faite, mais pas le nettoyage de la crépine. Sur ces modèles, ça ne sert à rien sans nettoyer le filtre. La pompe force peut-être déjà. Je prends un risque sur le pont arrière."

3. **L'Argument "Nuance" : Le FAP (Phase 2 uniquement) ou Le Transfert (Phase 1)**

*Cas Phase 2 (2019+) :* "C'est un modèle FAP (DNWA). Désolé mais sur le marché passion, elle vaut 3000€ de moins qu'une DAZA de 2018 car elle ne fait pas le 'vrai' bruit du 5 cylindres. Je ne pourrai pas la revendre aussi bien."

*Cas Phase 1 (2015-16) :* "Avez-vous changé le renvoi d'angle (Boîte de transfert) ? C'est le point faible des 367ch. Si ça siffle ou qu'il y a du jeu, la facture est salée."`,
    vehicles_data: [
      { 
        id: "rs3-01", 
        titre: "AUDI RS3 SPORTBACK 2.5 TFSI 367 ch Quattro S tronic 7", 
        prix: 30990, 
        kilometrage: 130000, 
        annee: 2016, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/f8/35/61/f83561cd02e0534b40cd4a91e5cac28b8e996c7c.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3131227968", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 92, 
        ecartEuros: 6500, 
        ecartPourcent: 17, 
        localisation: "Camps-la-Source 83170" 
      },
      { 
        id: "rs3-02", 
        titre: "AUDI RS3 SPORTBACK 2.5 TFSI 367 Quattro S tronic 7", 
        prix: 31990, 
        kilometrage: 116000, 
        annee: 2016, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/33/eb/b8/33ebb8ba46c45f57396dca85a7d367a8381455ea.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3078603281", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 90, 
        ecartEuros: 5500, 
        ecartPourcent: 15, 
        localisation: "Saint-Laurent-Blangy 62223" 
      },
      { 
        id: "rs3-03", 
        titre: "AUDI RS3 Sportback 2.5 TFSI 400ch quattro S tronic 7 Matrix LED", 
        prix: 56490, 
        kilometrage: 74000, 
        annee: 2018, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/16/73/e3/1673e3c897d373f308493220597c6ce664ee45e2.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3140423176", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 45, 
        ecartEuros: -3000, 
        ecartPourcent: -6, 
        localisation: "Petit-Bourg 97170" 
      },
      { 
        id: "rs3-04", 
        titre: "Audi RS3 Sportback 2.5 TFSI 367 Quattro S tronic 7 Suivi Audi", 
        prix: 38990, 
        kilometrage: 95000, 
        annee: 2017, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/eb/ca/42/ebca423c5ac8e9b4f2beaccad6f1563dd3f2e3d0.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3096007719", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 85, 
        ecartEuros: 4200, 
        ecartPourcent: 10, 
        localisation: "Toulouse 31000" 
      },
      { 
        id: "rs3-05", 
        titre: "AUDI RS3 8V SportBack Quattro 2.5 TFSI 367Cv S-TRONIC", 
        prix: 34990, 
        kilometrage: 108000, 
        annee: 2017, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/gh/51/83/gh5183487d256445d71c3404e7b6ee8a8586ea9f.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3133352603", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 88, 
        ecartEuros: 5000, 
        ecartPourcent: 12, 
        localisation: "Lyon 69000" 
      },
      { 
        id: "rs3-06", 
        titre: "Audi RS3 2.5 TFSI 400ch quattro S tronic 7", 
        prix: 45990, 
        kilometrage: 67000, 
        annee: 2019, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/cc/ba/7b/ccba7b2141e4ef94d15e7976f202b810d2b56148.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3113978290", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 78, 
        ecartEuros: 2500, 
        ecartPourcent: 5, 
        localisation: "Paris 75000" 
      },
      { 
        id: "rs3-07", 
        titre: "AUDI RS3 SPORTBACK 400CH QUATTRO S TRONIC 7", 
        prix: 42990, 
        kilometrage: 85000, 
        annee: 2019, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/f7/e2/6a/f7e26a5746dd1805c503019ab34f1517f530d859.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3141698245", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 82, 
        ecartEuros: 3500, 
        ecartPourcent: 7, 
        localisation: "Pontault-Combault 77340" 
      },
      { 
        id: "rs3-08", 
        titre: "Audi RS3 Sportback Quattro 2.5 TFSI 400 S-Tronic", 
        prix: 48900, 
        kilometrage: 55000, 
        annee: 2019, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/81/fa/dd/81fadd0b636d933cb498b531acd61f03418c3e55.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3110618115", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 72, 
        ecartEuros: 1200, 
        ecartPourcent: 2, 
        localisation: "Marseille 13000" 
      },
      { 
        id: "rs3-09", 
        titre: "AUDI RS3 SPORTBACK 2.5 TFSI 400 QUATTRO FULL OPTIONS", 
        prix: 35980, 
        kilometrage: 97400, 
        annee: 2019, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/fa/9a/b6/fa9ab6c49048ac038120d639810320ce08408c9f.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3072580943", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 98, 
        ecartEuros: 8500, 
        ecartPourcent: 19, 
        localisation: "Strasbourg 67000" 
      },
      { 
        id: "rs3-10", 
        titre: "Audi RS3 (3e Generation) Sportback 400ch", 
        prix: 63990, 
        kilometrage: 44000, 
        annee: 2022, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/6a/7d/78/6a7d787dd2c594d1b648b504a26999caebbbf184.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3098586072", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 55, 
        ecartEuros: 500, 
        ecartPourcent: 1, 
        localisation: "Bordeaux 33000" 
      },
      { 
        id: "rs3-11", 
        titre: "AUDI RS3 Sportback 400ch Matrix LED Pack RS", 
        prix: 78990, 
        kilometrage: 20448, 
        annee: 2022, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/59/ef/a7/59efa7a25e1ec1404183d9bf879a8f9c0c09253f.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3080630248", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 25, 
        ecartEuros: -8000, 
        ecartPourcent: -11, 
        localisation: "Lille 59000" 
      },
      { 
        id: "rs3-12", 
        titre: "Audi RS3 SPORTBACK 2.5 TFSI Quattro", 
        prix: 44990, 
        kilometrage: 98500, 
        annee: 2017, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/84/20/a7/8420a78bb9009514434088a7734cfb33594eb1ab.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3074378767", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 65, 
        ecartEuros: 1500, 
        ecartPourcent: 3, 
        localisation: "Toulouse 31000" 
      },
      { 
        id: "rs3-13", 
        titre: "AUDI RS3 SPORTBACK Toit ouvrant Bang & Olufsen", 
        prix: 47980, 
        kilometrage: 70500, 
        annee: 2019, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/bb/34/c0/bb34c0dabceb712fd9300159a4c525c1dafbeb4b.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3111325561", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 70, 
        ecartEuros: 1800, 
        ecartPourcent: 4, 
        localisation: "Montpellier 34000" 
      },
      { 
        id: "rs3-14", 
        titre: "Audi RS3 full options Virtual Cockpit", 
        prix: 41900, 
        kilometrage: 107000, 
        annee: 2019, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/a5/f1/d2/a5f1d2c52e1c92e7b4123412160024e58f9682ca.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3122770235", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 85, 
        ecartEuros: 4000, 
        ecartPourcent: 9, 
        localisation: "Rennes 35000" 
      },
      { 
        id: "rs3-15", 
        titre: "AUDI RS3 Quattro S-Tronic 7 400ch", 
        prix: 42990, 
        kilometrage: 70000, 
        annee: 2019, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/81/ad/44/81ad4495e3b13809108998ce30886aa6db12e33f.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3098266285", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 80, 
        ecartEuros: 3200, 
        ecartPourcent: 7, 
        localisation: "Reims 51100" 
      },
      { 
        id: "rs3-16", 
        titre: "Audi RS3 SPORTBACK 400ch Quattro", 
        prix: 39990, 
        kilometrage: 110000, 
        annee: 2020, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/70/a9/f8/70a9f8e7397f20b68b86b4b24d9c7a4065c5bd51.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3084216747", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 92, 
        ecartEuros: 5500, 
        ecartPourcent: 12, 
        localisation: "Dijon 21000" 
      },
      { 
        id: "rs3-17", 
        titre: "AUDI RS3 SPORTBACK 400ch S-Tronic", 
        prix: 42990, 
        kilometrage: 74000, 
        annee: 2019, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/09/ad/a7/09ada7f813a2edd2e9b1a1d832c5418c957bfb69.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3110113221", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 82, 
        ecartEuros: 3500, 
        ecartPourcent: 8, 
        localisation: "Angers 49000" 
      },
      { 
        id: "rs3-18", 
        titre: "AUDI RS3 SportBack 400ch Quattro 7", 
        prix: 49999, 
        kilometrage: 85000, 
        annee: 2018, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/b2/06/23/b20623075c2a30ab558b91fa9e1d8f5dbadf730f.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3115496031", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 58, 
        ecartEuros: 800, 
        ecartPourcent: 2, 
        localisation: "Grenoble 38000" 
      },
      { 
        id: "rs3-19", 
        titre: "AUDI RS3 SPORTBACK 2.5 TFSI 400", 
        prix: 54990, 
        kilometrage: 38500, 
        annee: 2019, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/53/d1/73/53d173e4563dd175fc52f2de1c05ab3c06186cce.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3122772400", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 50, 
        ecartEuros: -500, 
        ecartPourcent: -1, 
        localisation: "Annecy 74000" 
      },
      { 
        id: "rs3-20", 
        titre: "Audi RS3 Berline 400ch Quattro", 
        prix: 73500, 
        kilometrage: 11033, 
        annee: 2023, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/e2/86/06/e2860669e629edf2634ae471d13a398ae7ff172f.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3122803733", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 35, 
        ecartEuros: -3500, 
        ecartPourcent: -5, 
        localisation: "Metz 57000" 
      },
      { 
        id: "rs3-21", 
        titre: "AUDI RS3 SPORTBACK 8Y 400ch", 
        prix: 59990, 
        kilometrage: 68000, 
        annee: 2022, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/2f/5c/27/2f5c2760d39312690e754db9e64147687fcf303b.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3042265133", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 68, 
        ecartEuros: 2000, 
        ecartPourcent: 3, 
        localisation: "Caen 14000" 
      },
      { 
        id: "rs3-22", 
        titre: "Audi RS3 Sportback 400ch Gris Nardo", 
        prix: 46000, 
        kilometrage: 73000, 
        annee: 2019, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/11/9e/aa/119eaa41dd2238ecba81a024de75ae73a572249f.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3122704033", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 75, 
        ecartEuros: 2200, 
        ecartPourcent: 5, 
        localisation: "Nancy 54000" 
      },
      { 
        id: "rs3-23", 
        titre: "Audi RS3 sportback 2.5 TFSI Quattro", 
        prix: 61990, 
        kilometrage: 63500, 
        annee: 2022, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/5c/45/5c/5c455c4b8ad2f641412fae9b42070ef832427b9d.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3116235603", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 60, 
        ecartEuros: 1000, 
        ecartPourcent: 2, 
        localisation: "Clermont-Ferrand 63000" 
      },
      { 
        id: "rs3-24", 
        titre: "Audi RS3 sporback 367ch Quattro", 
        prix: 45990, 
        kilometrage: 88000, 
        annee: 2017, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/f0/64/9e/f0649e7dcb7a542b1a144821e39787f98cc1834c.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3122675625", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 72, 
        ecartEuros: 1800, 
        ecartPourcent: 4, 
        localisation: "Brest 29200" 
      },
      { 
        id: "rs3-25", 
        titre: "Audi RS3 Sportback 400ch S-Tronic", 
        prix: 44900, 
        kilometrage: 83000, 
        annee: 2018, 
        image: "https://img.leboncoin.fr/api/v1/lbcpb1/images/9c/c5/6c/9cc56cbeaecf1a75ed8e8011ac068cd70a0070d7.jpg?rule=ad-image", 
        lien: "https://www.leboncoin.fr/ad/voitures/3122660028", 
        marque: "Audi", 
        modele: "RS3", 
        carburant: "Essence", 
        transmission: "Automatique", 
        dealScore: 78, 
        ecartEuros: 2500, 
        ecartPourcent: 5, 
        localisation: "Limoges 87000" 
      }
    ].map(completeVehicle)
  }
};

// Helper function to get demo report by ID
export function getDemoReport(id: string): DemoReport | null {
  return demoReports[id] || null;
}

// Check if an ID is a demo report
export function isDemoReport(id: string): boolean {
  return id.startsWith('demo-');
}
