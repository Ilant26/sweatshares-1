# Système de Réponses aux Annonces - Documentation

## Vue d'ensemble

Ce système permet aux utilisateurs de répondre aux annonces avec trois types de réponses :
- **Candidatures** : Pour postuler à des opportunités
- **Offres** : Pour faire des propositions financières
- **Partenariats** : Pour proposer des collaborations

## Architecture

### Base de Données

#### Tables Principales

1. **`listing_responses`** - Réponses aux annonces
   - `id`, `listing_id`, `responder_id`
   - `status` (pending/accepted/rejected/completed/cancelled)
   - `type` (application/offer/partnership)
   - `message`, `proposed_amount`, `currency`, `terms`
   - `attachments`, `created_at`, `updated_at`

2. **`transactions`** - Gestion des paiements
   - `id`, `response_id`, `amount`, `currency`
   - `status` (pending/paid/released/refunded/disputed)
   - `stripe_payment_intent_id`, `stripe_transfer_id`
   - `platform_fee`, `created_at`, `updated_at`

3. **`response_messages`** - Messages de négociation
   - `id`, `response_id`, `sender_id`
   - `message`, `attachments`, `created_at`

### Services

#### `ResponseService` (`lib/responses.ts`)
- Gestion CRUD des réponses
- Récupération des réponses par utilisateur/annonce
- Mise à jour des statuts
- Statistiques

#### `PaymentService` (`lib/payments.ts`)
- Intégration Stripe
- Création de Payment Intents
- Gestion des transferts
- Calcul des frais de plateforme (5%)

### Composants UI

#### `ResponseForm` (`components/response-form.tsx`)
- Formulaire unifié pour tous les types de réponses
- Upload de fichiers
- Validation des données

#### `ResponseButton` (`components/response-button.tsx`)
- Bouton intelligent qui s'adapte au contexte
- Vérification si l'utilisateur a déjà répondu
- Modal avec formulaire

## Flux Utilisateur

### 1. Répondre à une Annonce

1. L'utilisateur clique sur "Répondre" sur une annonce
2. Le système vérifie s'il a déjà répondu
3. Si non, ouvre le formulaire de réponse
4. L'utilisateur choisit le type de réponse
5. Remplit le formulaire (message, montant si offre, etc.)
6. Soumet la réponse
7. Notification de succès

### 2. Gestion des Réponses (Propriétaire d'Annonce)

1. Accès via "Mes Réponses" dans la sidebar
2. Vue des réponses reçues avec statuts
3. Possibilité d'accepter/rejeter
4. Si acceptation avec montant → création de transaction Stripe
5. Paiement sécurisé avec escrow

### 3. Négociation et Messagerie

1. Chat intégré pour chaque réponse
2. Partage de fichiers
3. Historique des échanges
4. Notifications en temps réel

## Intégration Stripe

### Configuration

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Flux de Paiement

1. **Acceptation d'une offre** → Création Payment Intent
2. **Paiement** → Montant mis en attente (escrow)
3. **Livraison** → Libération vers le vendeur
4. **Commission** → 5% automatiquement prélevés

### Sécurité

- RLS (Row Level Security) activé sur toutes les tables
- Vérification des permissions utilisateur
- Validation côté serveur et client

## Pages et Routes

### Nouvelles Pages

- `/dashboard/my-responses` - Gestion des réponses
- `/dashboard/responses/[id]` - Détail d'une réponse (à implémenter)

### Modifications Existantes

- `/dashboard/listings/[id]` - Ajout du bouton de réponse
- Sidebar - Ajout du lien "Mes Réponses"

## Variables d'Environnement

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase (déjà configuré)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Prochaines Étapes

### Phase 2 - Fonctionnalités Avancées

1. **Page de détail des réponses**
   - Vue complète d'une réponse
   - Interface de messagerie
   - Gestion des fichiers

2. **Système de notifications**
   - Notifications en temps réel
   - Emails pour les mises à jour importantes

3. **Gestion des disputes**
   - Interface de résolution
   - Remboursements automatiques

4. **Analytics et rapports**
   - Statistiques des réponses
   - Revenus de la plateforme

### Phase 3 - Optimisations

1. **Performance**
   - Pagination des réponses
   - Optimisation des requêtes
   - Cache intelligent

2. **UX/UI**
   - Animations fluides
   - Responsive design amélioré
   - Accessibilité

## Tests

### Tests Manuels

1. **Création de réponse**
   - Tous les types de réponses
   - Validation des champs
   - Upload de fichiers

2. **Gestion des réponses**
   - Acceptation/rejet
   - Paiements
   - Messagerie

3. **Sécurité**
   - Permissions utilisateur
   - RLS policies
   - Validation des données

## Déploiement

### Migration de Base de Données

```bash
# Appliquer la migration
supabase db push

# Vérifier les tables
supabase db diff
```

### Variables d'Environnement

Assurez-vous que toutes les variables d'environnement sont configurées en production.

### Monitoring

- Surveiller les erreurs Stripe
- Logs des transactions
- Performance des requêtes

## Support

Pour toute question ou problème :
1. Vérifier les logs Supabase
2. Contrôler les erreurs Stripe
3. Tester les permissions RLS
4. Valider les variables d'environnement 