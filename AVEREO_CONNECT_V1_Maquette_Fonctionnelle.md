# AVEREO CONNECT - Maquette Fonctionnelle V1

Version: 0.1  
Date: 2026-03-06  
Base: Cahier des charges V1

## 1. Objectif V1 (MVP P0)

Livrer une plateforme utilisable en production pour:
- Creer un dossier de bien immobilier
- Chiffrer des travaux en temps reel avec un moteur versionne
- Exporter un PDF presentable
- Partager de maniere securisee
- Administrer le catalogue metier (tarifs/regles) sans redeploiement

## 2. Perimetre V1

Inclus:
- Authentification et gestion des roles (`Owner`, `Editor`, `Viewer`, `Admin`)
- Abonnement Stripe (`Free` / `Pro`) avec controle de droits par webhooks serveur
- Gestion biens / dossiers / pieces / photos / notes
- Moteur de chiffrage (HT/TTC, TVA 10/20, encadrement, arrondis, minimums)
- Export PDF synthese
- Partage securise (invitation + lien temporaire)
- Admin web catalogue (CRUD + publication de version)

Hors V1 (phase suivante):
- Offline-first complet
- Synchronisation avec resolution de conflits
- Push notifications
- Integrations CRM/Qonto avancees

## 3. Progression de delivery (12 semaines)

### S1-S2 - Cadrage final et socle
- Validation UX (parcours principal, particulier, admin)
- Validation schema de donnees et conventions API
- Setup environnements dev/staging/prod
- Definition des tests golden pour moteur
- Backlog P0 fige

Livrables:
- Maquettes valides
- OpenAPI v1 initial
- Plan de tests et jeux de donnees de reference

### S3-S4 - Comptes, biens, dossiers
- Auth (email/password + reset)
- RBAC serveur
- CRUD biens et dossiers
- Gestion pieces (surfaces/dimensions)
- Upload documents/photos (bucket securise)

Livrables:
- Tunnel "creer dossier" jusqu'au chiffrage pret
- Journaux d'audit de base

### S5-S6 - Moteur de chiffrage v1
- Service de calcul versionne (catalog_version impose)
- Regles TVA, encadrement, arrondis, minimums
- Selection de lignes actives pour export
- Tests unitaires + golden tests (30 a 50 scenarios)

Livrables:
- API calcul stable
- Coverage moteur >= 95%

### S7-S8 - PDF, partage, abonnements
- Generation PDF (template pro AVEREO)
- Partage securise par lien temporaire et invitation
- Integration Stripe Checkout + webhooks
- Controle d'acces selon plan

Livrables:
- Funnel P0 complet end-to-end
- Parcours partage operationnel

### S9-S10 - Admin catalogue
- CRUD metiers/familles/taches
- Import CSV/Excel avec validation
- Publication/depreciation d'une version catalogue
- Historisation et audit des modifications

Livrables:
- Back-office autonome pour AVEREO

### S11-S12 - Stabilisation et recette
- Corrections anomalies
- Performance et accessibilite AA minimum
- UAT (recette metier)
- Preparation release stores + runbook exploitation

Livrables:
- 0 bug critique P0
- Go/NoGo de lancement

## 4. Premier apercu produit (ecrans V1)

### 4.1 Mobile/Web App - Parcours principal

#### Ecran A - Connexion / Creation de compte
But:
- Entrer rapidement dans le produit

Elements:
- Email, mot de passe, lien "mot de passe oublie"
- Consentement RGPD
- CTA principal: "Commencer"

Regles:
- Verification email obligatoire
- Message d'erreur actionnable (jamais technique)

#### Ecran B - Dashboard biens
But:
- Voir le portefeuille et creer un nouveau dossier

Elements:
- Barre de recherche
- Cartes bien: adresse, statut, nb dossiers, derniere activite
- CTA: "Nouveau bien", "Nouveau dossier"

Regles:
- Tri par activite recente par defaut
- Etats vides pedagogiques

#### Ecran C - Creation dossier (Stepper)
But:
- Guider sans surcharge

Etapes:
1. Bien et contexte
2. Pieces et dimensions
3. Photos et notes
4. Chiffrage
5. Synthese

Regles:
- Sauvegarde auto a chaque etape
- Retour possible sans perte

#### Ecran D - Chiffrage live
But:
- Produire un devis fiable en quelques minutes

Elements:
- Liste metiers/familles/taches
- Quantites assistees (surface, perimetre, murs/plafond)
- Panneau synthese instantane: HT, TVA, TTC, encadrement
- Toggle "inclure/exclure ligne"

Regles:
- Recalcul < 100 ms cible
- Valeurs invalides bloquees avec message clair
- Chaque devis reference `catalog_version`

#### Ecran E - Synthese et export
But:
- Finaliser et partager le resultat

Elements:
- Sous-totaux par metier
- Total general HT/TTC
- CTA: "Exporter PDF", "Partager", "Inviter"

Regles:
- PDF contient uniquement les lignes activees
- Historique d'exports conserve

#### Ecran F - Partage securise
But:
- Donner acces de facon controlee

Elements:
- Invitation par email (role `Viewer` / `Editor`)
- Lien temporaire avec expiration
- Liste des acces actifs + bouton "Revoquer"

Regles:
- Journal de consultation
- Revocation immediate cote serveur

### 4.2 Admin web AVEREO

#### Ecran G - Catalogue metier
But:
- Modifier les regles sans passer par l'equipe dev

Elements:
- Tableau metiers/familles/taches
- Prix `eco/std/premium`
- Unites, TVA, regles (encadrement, minimums, arrondis)
- CTA: "Importer", "Publier version"

Regles:
- Validation stricte avant publication
- Version active unique

#### Ecran H - Historique et audit
But:
- Tracabilite et support

Elements:
- Qui a modifie quoi et quand
- Filtre par objet/date/admin
- Statut de publication version

Regles:
- Journal immuable
- Export CSV des logs

## 5. Architecture cible V1 (pratique)

Front:
- Mobile: Expo React Native (iOS/Android)
- Web admin: React/Next.js

Back:
- BaaS (auth, postgres, storage, RLS)
- API dediee (NestJS) pour:
  - calcul officiel
  - Stripe webhooks et droits
  - partage securise
  - integration email
  - audit et logs metier

Principe:
- Les operations sensibles passent par l'API dediee, pas directement par la base.

## 6. Donnees minimales a modeliser

Entites:
- `users`, `roles`, `subscriptions`
- `properties`, `projects`, `rooms`
- `documents`, `photos`, `shares`, `invites`
- `catalog_versions`, `catalog_tasks`, `pricing_rules`
- `quotes`, `quote_lines`, `exports_pdf`
- `audit_logs`

Contrainte critique:
- `quote.catalog_version` obligatoire et immuable apres validation du devis.

## 7. Criteres d'acceptation MVP (Go/NoGo)

1. Un utilisateur cree un bien, un dossier, des pieces et obtient un chiffrage valide.
2. Le total HT/TTC est stable et reproductible avec la meme `catalog_version`.
3. Le PDF est genere en moins de 10s sur un dossier standard.
4. Le partage par invitation et lien temporaire fonctionne avec revocation immediate.
5. L'admin publie une nouvelle version catalogue sans redeploiement.
6. Aucun bug critique bloqueur sur le tunnel P0.

## 8. Risques V1 et parades

Risque:
- Regles de calcul ambigues
Parade:
- Table de verite + golden tests signes metier

Risque:
- Derive perimetre sur admin catalogue
Parade:
- Prioriser edition simple + import controle en V1

Risque:
- Instabilite webhooks Stripe
Parade:
- Idempotence + files de reprise + alerting

Risque:
- PDF heterogene selon cas
Parade:
- Templates figes + jeux de recette reels

## 9. Demarrage immediat (prochaine semaine)

1. Valider cette V1 fonctionnelle (perimetre et ecrans)
2. Figer 10 scenarios metier de reference pour le moteur
3. Trancher stack exacte (`Supabase + NestJS + Expo + Next.js`)
4. Lancer Sprint 1 avec backlog detaille en user stories testables
