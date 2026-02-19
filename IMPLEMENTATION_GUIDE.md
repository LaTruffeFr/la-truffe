# Les 5 Fonctionnalités Avancées - Guide de Déploiement

## 📋 Vue d'ensemble

Ce guide détaille les 5 fonctionnalités optionnelles premium implémentées pour le tableau de bord vendeur :

1. **📧 Notifications par email** - Alertes quand un acheteur intéressé contacte le vendeur
2. **📊 Statistiques de listing** - Suivi des vues, clics, contacts et conversion
3. **⭐ Promotion de listings** - Options pour mettre en avant des annonces (featured)
4. **📸 Galerie de photos multiples** - Upload et gestion d'une galerie complète
5. **📜 Audit trail** - Historique des modifications avec détails avant/après

---

## 🚀 Étapes de déploiement

### Phase 1: Déployer les migrations Supabase

Les migrations suivantes DOIVENT être appliquées dans cet ordre :

```bash
# 1. Ajouter la colonne user_id à la table cars
supabase/migrations/20260219_add_user_id_to_cars.sql

# 2. Créer la table notifications
supabase/migrations/20260219_create_notifications_table.sql

# 3. Créer la table listing_stats
supabase/migrations/20260219_create_listing_stats_table.sql

# 4. Créer les tables listing_photos
supabase/migrations/20260219_create_listing_photos_table.sql

# 5. Créer la table audit_log
supabase/migrations/20260219_create_listing_audit_log_table.sql

# 6. Ajouter les colonnes de promotion
supabase/migrations/20260219_add_promotion_columns.sql
```

**Commande de déploiement local:**
```bash
supabase db push
```

**Commande de déploiement production:**
```bash
supabase db push --linked
```

### Phase 2: Installer la fonction Supabase Edge

La fonction `contact-seller` gère les notifications quand un acheteur envoie un message :

```bash
supabase functions deploy contact-seller
```

Fichier: `supabase/functions/contact-seller/index.ts`

### Phase 3: Régénérer les types Supabase

Après le déploiement des migrations, régénérez les types TypeScript :

```bash
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Phase 4: Intégrer les composants

Les composants suivants sont maintenant disponibles :

```tsx
// Dans ClientDashboard.tsx - ajouter les imports et onglets

import { SellerNotifications } from '@/components/SellerNotifications';
import { ListingStatistics } from '@/components/ListingStatistics';
import { SellerListings } from '@/components/SellerListings'; // déjà existant
```

---

## 📦 Contenus créés

### Composants React (frontend)

**1. SellerNotifications.tsx** - Affiche les notifications de contact
- 📧 Email et téléphone du buyer
- 💬 Message d'intérêt
- ✅ Marquer comme lu
- 🗑️ Supprimer

**2. ListingStatistics.tsx** - Dashboard des performances
- 👁️ Nombre de vues
- 🔗 Clics
- 📞 Contacts reçus
- ❤️ Favoris
- 📊 Taux de conversion

**3. ListingAuditTrail.tsx** - Historique des modifications
- Détails avant/après
- Horodatage précis
- Filtrage par action
- Recherche visuelle

**4. ListingPhotoGallery.tsx** - Gestion des photos
- Upload multiple
- Galerie responsive
- Photo principale
- Ordre personnalisé

**5. SellerListings.tsx** (amélioré)
- Onglet "Détails" (existant)
- Onglet "Photos" (nouveau)
- Onglet "Historique" (nouveau)

### Fonction Supabase

**contact-seller/index.ts** - Traite les demandes de contact
- Crée entrée de notification
- Met à jour les stats
- Prêt pour envoi d'email

### Migrations SQL

6 fichiers de migration créant:
- Colonnes user_id sur cars
- Table notifications (listings × sellers × buyers)
- Table listing_stats (vues, clics, contacts)
- Table listing_photos (galerie)
- Table listing_audit_log (audit trail)
- Colonnes is_featured, promotion_type sur cars

---

## 🔧 Configuration requise

### Variables d'environnement (`.env.local`)

```env
# Existant
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Nouveau pour email (SendGrid/Resend)
SUPABASE_SENDGRID_API_KEY=...  # Si utilisant SendGrid
# Ou
SUPABASE_RESEND_API_KEY=...    # Si utilisant Resend
```

### Permissions Supabase Storage

La bucket `user-car-photos` doit supporter:
- ✅ Upload public (authentifié)
- ✅ Lecture publique (annonces publiques)

---

## 💡 Workflow utilisateur final

### Pour les vendeurs:

```
1. Créer annonce → SellCar.tsx
2. Voir tableau de bord → ClientDashboard.tsx
3. Cliquer sur "Mes annonces"
4. Cliquer "Modifier" sur une annonce
5. Choisir onglet:
   - "Détails" : Modifier titre, prix, description
   - "Photos" : Upload et gérer galerie
   - "Historique" : Voir all changes
6. Voir "Notifications" pour les demandes de contact
7. Voir "Statistiques" pour les performances
```

### Pour les acheteurs:

```
1. Voir listing → Marketplace/ListingDetails
2. Cliquer "Contacter le vendeur"
3. Remplir formulaire → Appel API contact-seller
4. Notification envoyée au vendeur
5. Vendeur répond directement (email/téléphone)
```

---

## 🔒 Sécurité (RLS Policies)

Toutes les tables ont Row-Level Security activé:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| **notifications** | seller_user_id = auth.uid() | system | owner | owner |
| **listing_stats** | PUBLIC (transparence) | system | system | ✗ |
| **listing_photos** | PUBLIC | owner | owner | owner |
| **listing_audit_log** | owner \| admin | system | ✗ | ✗ |
| **cars** (existing) | auth.uid() = user_id \| public | auth | owner | owner |

---

## 📊 Architecture de données

```
cars
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users) ← NOUVEAU
├── title, description, price, mileage, year
├── is_featured (boolean)
├── featured_until (timestamp)
├── image_url (legacy, single photo)
└── created_at, updated_at

notifications
├── id (UUID, PK)
├── listing_id (UUID, FK → cars)
├── seller_user_id (UUID, FK → auth.users)
├── buyer_email, buyer_name, buyer_phone
├── message, is_read
└── created_at

listing_stats
├── id (UUID, PK)
├── listing_id (UUID, FK → cars, UNIQUE)
├── view_count, click_count, contact_count, favorite_count
├── days_active, last_viewed_at
└── created_at, updated_at

listing_photos
├── id (UUID, PK)
├── listing_id (UUID, FK → cars)
├── photo_url (Supabase Storage path)
├── display_order, is_primary
├── uploaded_by (UUID, FK → auth.users)
└── created_at

listing_audit_log
├── id (UUID, PK)
├── listing_id (UUID, FK → cars)
├── modified_by (UUID, FK → auth.users)
├── action ('created'|'updated'|'promoted'|'deleted')
├── previous_values (JSONB)
├── new_values (JSONB)
├── change_description (text)
└── created_at

listing_promotions
├── id (UUID, PK)
├── listing_id (UUID, FK → cars)
├── promotion_type ('featured'|'premium'|'boost')
├── starts_at, ends_at
├── cost_amount, cost_currency
└── payment_status ('pending'|'paid'|'refunded')
```

---

## 🎯 Points clés d'intégration

### 1. Appel contact-seller lors de la soumission du formulaire

Dans `ListingDetails.tsx` ou composant de contact:

```tsx
const handleContactSeller = async (formData) => {
  const { error } = await supabase.functions.invoke('contact-seller', {
    body: {
      listing_id: listingId,
      seller_user_id: listing.user_id, // ← Important!
      buyer_email: formData.email,
      buyer_name: formData.name,
      buyer_phone: formData.phone,
      message: formData.message,
    },
  });
};
```

### 2. Incrémenter les stats au chargement

Dans `ReportView.tsx` ou page de détail:

```tsx
useEffect(() => {
  // Incrémenter view_count
  supabase
    .from('listing_stats')
    .update({ 
      view_count: supabase.rpc('increment_view_count', { listing_id: id })
    })
    .eq('listing_id', id)
    .select();
}, [id]);
```

### 3. Afficher les tabs dans ClientDashboard

```tsx
{activeTab === 'statistics' && <ListingStatistics userId={user.id} />}
{activeTab === 'notifications' && <SellerNotifications userId={user.id} />}
{activeTab === 'listings' && <SellerListings userId={user.id} />}
```

---

## ⚠️ Notes importantes

1. **user_id missing**: La colonne `user_id` doit être remplie rétroactivement pour les listings existants via:
   ```sql
   UPDATE cars SET user_id = NULL WHERE user_id IS NULL;
   ```
   (Les RLS empêchera l'accès si user_id est NULL)

2. **SendGrid/Resend**: Le code email dans `contact-seller/index.ts` est  placeholder. Intégrer votre service d'email:
   ```tsx
   // Remplacer le console.log par:
   const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}` },
     body: JSON.stringify({ ... })
   });
   ```

3. **Regenerate types**: Après chaque migration, exécuter:
   ```bash
   supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```

4. **Storage bucket**: Vérifier que `user-car-photos` existe dans Supabase Storage

---

## ✅ Checklist de déploiement

- [ ] Sauvegarder la base de données actuelle
- [ ] Exécuter toutes les 6 migrations Supabase
- [ ] Régénérer les types TypeScript
- [ ] Déployer la fonction `contact-seller`
- [ ] Configurer les variables d'environnement (email)
- [ ] Tester la création de listing
- [ ] Tester l'upload de photos
- [ ] Tester les notifications
- [ ] Vérifier les stats en temps réel
- [ ] Tester l'historique de modifications

---

## 📞 Support

Chaque composant contient des logs console pour le debugging.

Fichiers clés:
- `src/components/SellerNotifications.tsx` (ligne 53+)
- `src/components/ListingStatistics.tsx` (ligne 55+)
- `src/components/ListingPhotoGallery.tsx` (ligne 34+)
- `supabase/functions/contact-seller/index.ts`
