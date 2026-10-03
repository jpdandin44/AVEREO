---
project: avereo-app-passeport-immo
document_type: phase-audit
title: Phase 0 — reprise et état des lieux
status: active
version: git
created: 2026-10-03
updated: 2026-10-03
owner: jpdandin
tags: [passeport-immo, audit, local]
---

# Phase 0 — reprise et état des lieux

## Périmètre et autorisation

Base : `origin/main` observée à `f4695d662546fe7277bf3a50c8c975ce97e8b9a0`. Clone visé : `jpdandin44/AVEREO`. Copie isolée, branche de phase locale. Le chantier Collector est préservé.
La demande explicite « Phase 0 puis prototype local dans cette session » autorise la reprise locale après audit. Les phases et approbations restent inchangées dans le moteur ; aucune publication autorisée.

## Contrôles de départ

- Remote attendu confirmé ; moteur Projet `workflows/start-review.mjs:1` et `api/revue-locale.md:1` présents.
- Import `.codex-imports/passeport-immo/` ignoré par Git ; cinq fichiers du modèle du site présents.
- Bloc §3 de la synthèse et texte du prototype identiques à la source (1230 lignes), BOM et fins de ligne neutralisés. La synthèse n’a pas de clôture de bloc ; extraction jusqu’à EOF.
- Sous-projet absent au démarrage, puis créé ; modèle Recherche, sas partagé, préparateur et documentation o2switch présents.
- Ports proposés : application 5175, revue 5193. Disponibilité vérifiée lors du démarrage concerné.
- Socle racine incomplet : éléments manquants créés sous forme d’index ; instructions existantes inchangées.

## Matrice de parité complète du prototype

Les preuves historiques sont relatives à la racine du monorepo. Les preuves locales sont relatives au sous-projet. « Identique » décrit la logique observée ; la recette humaine reste distincte.

| ID | Écran | Fonction | Preuve prototype | Preuve Passeport Immo | Test | Statut |
|---|---|---|---|---|---|---|
| P01 | Connexion | Connexion fictive admin/pro | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:142` | `frontend/src/App.jsx:128` | R02 : Se connecter, compte Admin Démo | identique |
| P02 | Navigation | Accueil, admin, déconnexion | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:281` | `frontend/src/App.jsx:267` | R02 : Boutons et retour tableau des biens | écart autorisé (a/b) |
| P03 | Abonnement | Activation Pro simulée et contrôle plan | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:300` | `frontend/src/App.jsx:286` | R12 : Route subscribe ; non accessible depuis session pro par défaut | identique |
| P04 | Biens | Liste et consultation | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:1107` | `frontend/src/App.jsx:1022` | R03 : Deux biens, ouvrir chaque fiche | identique |
| P05 | Biens | Création, composition initiale | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:177` | `frontend/src/App.jsx:163` | R04 : Créer maison et appartement fictifs | identique |
| P06 | Biens | Édition, conservation dossier | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:189` | `frontend/src/App.jsx:175` | R04 : Modifier surface et composition | identique |
| P07 | Biens | Suppression confirmée et annulation | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:196` | `frontend/src/App.jsx:182` | R04 : Annuler puis confirmer un bien fictif | identique |
| P08 | Biens | Validation adresse/surface | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:1020` | `frontend/src/App.jsx:935` | R04 : Champs requis et surface > 0 | identique |
| P09 | Biens | Composition chambres/sdb/séjour/cuisine/garage | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:991` | `frontend/src/App.jsx:906` | R04 : Valeurs entières >=0 ; séjour saisi non affiché dans résumé | identique |
| P10 | Pièces | Ajouter nom et surface > 0 | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:690` | `frontend/src/App.jsx:676` | R05 : Pièce avec surface ; aucun écran multi-dossiers | identique |
| P11 | Pièces | Édition des interventions | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:465` | `frontend/src/App.jsx:451` | R06 : Fenêtre par pièce | identique |
| P12 | Interventions | Filtre métier et recherche | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:473` | `frontend/src/App.jsx:459` | R06 : Filtrer puis rechercher | identique |
| P13 | Interventions | Sélection/désélection | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:490` | `frontend/src/App.jsx:476` | R06 : Une quantité initiale de 1 | identique |
| P14 | Interventions | Quantités unitaires | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:499` | `frontend/src/App.jsx:485` | R06 : Entier > 0 ; champ seulement pour unité | identique |
| P15 | Interventions | Validation des choix | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:506` | `frontend/src/App.jsx:492` | R06 : Fermer et conserver après validation | identique |
| P16 | Calcul | Trois gammes, libellés | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:716` | `frontend/src/lib/chiffrage.js:2` | T01 : Maison : 1800 / 2400 / 3000 ; appartement : 1320 / 1980 / 2640 | identique (extraction c) |
| P17 | Calcul | m² : prix × surface de pièce | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:735` | `frontend/src/lib/chiffrage.js:2` | T02 : Quantité de sélection ignorée pour m² | identique (extraction c) |
| P18 | Calcul | unité : prix × quantité | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:735` | `frontend/src/lib/chiffrage.js:2` | T02 : Quantité entière dans UI | identique (extraction c) |
| P19 | Calcul | forfait : prix une fois | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:735` | `frontend/src/lib/chiffrage.js:2` | T02 : Surface et quantité ignorées | identique (extraction c) |
| P20 | Calcul | Unités h/ml inconnues : zéro | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:735` | `frontend/src/lib/chiffrage.js:2` | T02 : Ne pas inventer une règle pour h ou ml | identique (extraction c) |
| P21 | Calcul | Tarif absent et pièces sans intervention | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:725` | `frontend/src/lib/chiffrage.js:2` | T02 : Ignorer tarif absent ; pièce à zéro | identique (extraction c) |
| P22 | Calcul | Sous-totaux et arrondis | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:742` | `frontend/src/lib/chiffrage.js:2` | T02 : toFixed(2), somme brute avant arrondi | identique (extraction c) |
| P23 | PDF | Totaux trois gammes et détail standard | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:753` | `frontend/src/lib/chiffrage.js:39` | T03 : Même coût par unité ; détail standard quel que soit l’écran | identique (extraction c) |
| P24 | PDF | Groupement par nom de pièce | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:789` | `frontend/src/lib/chiffrage.js:39` | T03 : Deux noms identiques groupent les lignes ensemble ; anomalie conservée | identique (extraction c) |
| P25 | PDF | Gabarit, composition et pièces jointes | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:573` | `frontend/src/App.jsx:559` | R08 : Images incluses ; autres fichiers sans aperçu | écart autorisé (a/b) |
| P26 | PDF | Capture, pagination et téléchargement | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:804` | `frontend/src/App.jsx:706` | T05/R08 : A4, dernier pixel, deux/trois pages ; nom dérivé de l’adresse | écart autorisé (d) |
| P27 | Partage | Web Share ou copie URL | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:851` | `frontend/src/App.jsx:766` | R09 : URL seulement ; pas de dossier distant ni lien expirant | identique |
| P28 | Documents | Ajout FileReader / base64 | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:699` | `frontend/src/App.jsx:685` | R07 : Image ou PDF fictif | identique |
| P29 | Documents | Affichage nom/vignette et suppression | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:914` | `frontend/src/App.jsx:829` | R07 : Liste et suppression immédiate | identique |
| P30 | Tarifs | Éditer nom/unité/prix | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:320` | `frontend/src/App.jsx:306` | R10 : Trois prix modifiables ; pas de version serveur | identique |
| P31 | Tarifs | Ajouter et supprimer une ligne | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:324` | `frontend/src/App.jsx:310` | R10 : Nouvelle intervention initialement à zéro | identique |
| P32 | Tarifs | Sauvegarder et quitter | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:334` | `frontend/src/App.jsx:320` | R10 : Catalogue stocké et retour biens | identique |
| P33 | CSV | Chargement fichier et parse | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:340` | `frontend/src/App.jsx:326` | R11 : PapaParse, header, skipEmptyLines | identique |
| P34 | CSV | Six en-têtes obligatoires | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:362` | `frontend/src/App.jsx:348` | R11 : Insensibles à casse/espaces ; refuser colonnes manquantes | identique |
| P35 | CSV | Prix décimaux et lignes invalides | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:390` | `frontend/src/App.jsx:376` | R11 : Virgule décimale ; ignorer lignes invalides | identique |
| P36 | CSV | Normalisation unités et métiers/id | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:403` | `frontend/src/App.jsx:389` | R11 : h/linéaire importés comme unité selon le code | identique |
| P37 | CSV | Remplacer grille et bilan import | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:420` | `frontend/src/App.jsx:406` | R11 : Nouvelles lignes remplacent grille locale non sauvegardée | identique |
| P38 | Persistance | Hydratation et fusion tarifs | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:124` | `frontend/src/App.jsx:110` | R13 : Tarifs intégrés réapparaissent après rechargement ; session non persistée | identique |
| P39 | Persistance | Biens/pièces/interventions/documents/tarifs | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:151` | `frontend/src/App.jsx:137` | R13 : Chaque mutation persistée ; nouvelle namespace après reprise | écart autorisé (a/b) |
| P40 | Chargement | Bibliothèques et chargement initial | `architecture-v1/avereo-app-connect/frontend/src/App.jsx:1205` | `frontend/src/main.jsx:3`, `frontend/src/App.jsx:1121` | R01 : CDN historiques remplacés par npm ; mêmes versions | écart autorisé (a/b) |

## Versions distinctes et écarts exclus du code

| Source | Écart avec la source React | Décision de périmètre |
|---|---|---|
| `prototype-v1/app.js:3` et `:127` | Catalogue versionné, TVA 10/20 et encadrement ; pas les trois gammes du React | Ne pas reprendre |
| `prototype-v1/app.js:109` et `:351` | Choix de rôles Owner/Editor/Viewer/Admin | Ne pas reprendre |
| `AVEREO_CONNECT_V1_Maquette_Fonctionnelle.md:18` | Stripe, partage sécurisé, audit serveur, Expo/Supabase/NestJS | Cible historique différente ; hors V1 locale |
| §2 synthèse | Supabase/NestJS/Expo proposés | Ne pas implémenter ; socle AVEREO pour les lots futurs |
| Idée cockpit fournie | Vue multi-chantiers | Sujet séparé, reporté |

## Rattachement des tests de la version précédente

Les attentes d’une autre version servent à préparer la recette. Une attente absente du React est signalée ; elle ne devient pas une exigence implémentée.

| Alias, feuille et cellule | Cas ou attente | Matrice / couverture locale |
|---|---|---|
| SRC-37, sheet1, ligne 2 | Connexion d’un utilisateur admin avec identifiants valides | P01/P02 |
| SRC-37, sheet1, ligne 3 | Tentative de connexion avec mot de passe erroné | P01 — mot de passe absent |
| SRC-37, sheet1, ligne 4 | Téléversement d’un document PDF dans un dossier client | P28/P29 |
| SRC-37, sheet1, ligne 5 | Partage de dossier avec lien temporaire (24h) | P27 — expiration absente |
| SRC-37, sheet1, ligne 6 | Ajout de pièce (salon) à un bien immobilier | P10 |
| SRC-37, sheet1, ligne 7 | Calcul automatique du montant total pour un devis (Peinture 20m²) | P16/P17 |
| SRC-37, sheet1, ligne 8 | Génération du PDF du devis | P23/P26 — TVA absente |
| SRC-37, sheet1, ligne 9 | Abonnement utilisateur via Stripe en environnement de test | P03 — Stripe absent |
| SRC-37, sheet1, ligne 10 | Notification push à l’agent immobilier après nouveau devis | Absent — notification push |
| SRC-37, sheet1, ligne 11 | Ajout/modification d’un métier dans le panneau d’administration | P30/P31/P32 |
| SRC-38, sheet1, ligne 2 | Authentification : Inscription et connexion des utilisateurs avec email/mot de passe. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 3 | Abonnements : Souscription à un plan (gratuit/payant) via Stripe lors de l'inscription. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 4 | Gestion des Biens : Création, modification et consultation des biens immobiliers. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 5 | Gestion des Dossiers : Création de dossiers de travaux associés à un bien, avec ajout/modification des pièces et de leurs surfaces. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 6 | Estimation des Coûts : Calcul automatique du coût des travaux basé sur une liste de métiers pré-définis et la surface des pièces. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 7 | Affichage Devis : Visualisation du devis en temps réel au sein de l'application. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 8 | Partage : Partage de l'accès à un bien ou à un dossier avec un autre utilisateur. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 9 | Export PDF : Génération automatique d'un fichier PDF contenant toutes les informations du devis. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 10 | Téléchargement : Possibilité de télécharger localement le fichier PDF généré. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 11 | Partage par Email : Fonctionnalité pour envoyer le PDF par email directement depuis l'application. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 12 | Interface Admin : Back-office web sécurisé pour l'administration des données de l'application. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 13 | Gestion des Métiers : CRUD (Create, Read, Update, Delete) pour les métiers et leurs tarifs associés. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 14 | Gestion des Calculs : Interface pour modifier les règles de calcul des devis. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-38, sheet1, ligne 15 | Notifications Push : Envoi de notifications pour les événements importants (nouveau devis, rappel, etc.) via Expo. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-40, sheet1, ligne 2 | TC-G-01.1 : Créer un bien immobilier (cas nominal) | P05/P10 |
| SRC-40, sheet1, ligne 3 | TC-G-01.2 : Créer un dossier de travaux pour un bien existant | P05/P10 |
| SRC-40, sheet1, ligne 4 | TC-G-01.3 : Erreur : Tenter de créer un dossier sans l'associer à un bien | P05/P10 |
| SRC-40, sheet1, ligne 5 | TC-G-02.1 : Sélectionner plusieurs artisans et leur envoyer une demande de devis | P27/P03 — artisans, paiements, rapports et chantier absents |
| SRC-40, sheet1, ligne 6 | TC-G-03.1 : Vérifier la réception et la consultation des devis soumis | P27/P03 — artisans, paiements, rapports et chantier absents |
| SRC-40, sheet1, ligne 7 | TC-G-03.2 : Accepter un des devis reçus | P27/P03 — artisans, paiements, rapports et chantier absents |
| SRC-40, sheet1, ligne 8 | TC-G-04.1 : Vérifier la redirection vers Stripe après l'acceptation d'un devis | P27/P03 — artisans, paiements, rapports et chantier absents |
| SRC-40, sheet1, ligne 9 | TC-G-04.2 : Simuler un paiement réussi et vérifier le retour sur l'application | P27/P03 — artisans, paiements, rapports et chantier absents |
| SRC-40, sheet1, ligne 10 | TC-G-04.3 : Erreur : Simuler un paiement échoué et vérifier le retour sur l'application | P27/P03 — artisans, paiements, rapports et chantier absents |
| SRC-40, sheet1, ligne 11 | TC-G-05.1 : Consulter les mises à jour d'avancement postées par un artisan | P27/P03 — artisans, paiements, rapports et chantier absents |
| SRC-40, sheet1, ligne 12 | TC-G-06.1 : AVANT PAIEMENT : Vérifier que le bouton de téléchargement du rapport est inactif/absent | P27/P03 — artisans, paiements, rapports et chantier absents |
| SRC-40, sheet1, ligne 13 | TC-G-06.2 : APRÈS PAIEMENT : Vérifier que le bouton de téléchargement du rapport est actif et fonctionnel | P27/P03 — artisans, paiements, rapports et chantier absents |
| SRC-40, sheet1, ligne 14 | TC-G-07.1 : Clôturer un dossier de travaux terminé et payé | P27/P03 — artisans, paiements, rapports et chantier absents |
| SRC-40, sheet2, ligne 2 | ACC-01 ; SUB-01 : Vérifier le processus d'inscription complet pour un nouvel utilisateur. ; Vérifier que le choix d'un plan Pro initie un abonnement Stripe. | P01/P03/P05/P10/P26/P27 — couverture partielle ; authentification, invitation, Stripe, chantier absents |
| SRC-40, sheet2, ligne 3 | AUT-001 : Vérifier la connexion réussie d'un utilisateur déjà existant. | P01/P03/P05/P10/P26/P27 — couverture partielle ; authentification, invitation, Stripe, chantier absents |
| SRC-40, sheet2, ligne 4 | SUB-02 ; SUB-03 : Vérifier le parcours d'upgrade depuis le tableau de bord. ; Vérifier la transaction Stripe pour une mise à niveau. | P01/P03/P05/P10/P26/P27 — couverture partielle ; authentification, invitation, Stripe, chantier absents |
| SRC-40, sheet3, ligne 2 | AGT-001 ; AGT-005 ; RIGHTS-01 : Vérifier qu'un utilisateur Basic peut créer un bien. ; Vérifier qu'un utilisateur Basic peut créer un dossier de travaux. ; Vérifier que l'accès à la fonctionnalité "Devis" est bloqué pour un utilisateur Basic. | P01/P03/P05/P10/P26/P27 — couverture partielle ; authentification, invitation, Stripe, chantier absents |
| SRC-40, sheet3, ligne 3 | AGT-001 ; AGT-005 ; RIGHTS-02 : Vérifier qu'un utilisateur Pro peut créer un bien. ; Vérifier qu'un utilisateur Pro peut créer un dossier de travaux. ; Vérifier que l'accès à la fonctionnalité "Devis" est bien autorisé pour un utilisateur Pro. | P01/P03/P05/P10/P26/P27 — couverture partielle ; authentification, invitation, Stripe, chantier absents |
| SRC-40, sheet4, ligne 2 | SUB-TC-01 ; SUB-TC-02 ; SUB-TC-03 : Vérifier l'inscription réussie avec un plan Basic. ; Vérifier l'inscription réussie avec un plan Pro après paiement Stripe. ; Vérifier l'échec de l'inscription si l'email existe déjà. | P01/P03/P05/P10/P26/P27 — couverture partielle ; authentification, invitation, Stripe, chantier absents |
| SRC-40, sheet4, ligne 3 | SUB-TC-04 : Vérifier le parcours complet d'upgrade : clic, paiement Stripe, et vérification des nouveaux accès. | P01/P03/P05/P10/P26/P27 — couverture partielle ; authentification, invitation, Stripe, chantier absents |
| SRC-40, sheet5, ligne 2 | AGT-TC-01 ; AGT-TC-02 ; RIGHTS-TC-01 : Vérifier qu'un utilisateur Basic peut créer un bien. ; Vérifier qu'un utilisateur Basic peut créer un dossier de travaux. ; Vérifier que l'accès à la gestion des devis est bloqué. | P01/P03/P05/P10/P26/P27 — couverture partielle ; authentification, invitation, Stripe, chantier absents |
| SRC-40, sheet5, ligne 3 | AGT-TC-07 ; AGT-TC-09 ; AGT-TC-11 : Vérifier que l'utilisateur Pro peut inviter des partenaires. ; Vérifier qu'il peut soumettre une sélection de devis au client. ; Vérifier qu'il peut consulter les mises à jour de chantier. | P01/P03/P05/P10/P26/P27 — couverture partielle ; authentification, invitation, Stripe, chantier absents |
| SRC-40, sheet5, ligne 4 | PAR-TC-01 ; PAR-TC-02 : Vérifier la consultation d'une nouvelle demande de devis. ; Vérifier la soumission d'un devis complet. | P01/P03/P05/P10/P26/P27 — couverture partielle ; authentification, invitation, Stripe, chantier absents |
| SRC-40, sheet5, ligne 5 | CLI-TC-01 ; CLI-TC-03 ; PAY-TC-01 ; AGT-TC-18 : Vérifier le premier accès à l'espace client. ; Vérifier la validation d'un devis. ; Vérifier la redirection vers Stripe. ; Vérifier que le téléchargement du rapport est impossible avant paiement. | P01/P03/P05/P10/P26/P27 — couverture partielle ; authentification, invitation, Stripe, chantier absents |
| SRC-44, sheet1, ligne 2 | Authentification : Inscription et connexion des utilisateurs avec email/mot de passe. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 3 | Abonnements : Souscription à un plan (gratuit/payant) via Stripe lors de l'inscription. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 4 | Gestion des Biens : Création, modification et consultation des biens immobiliers. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 5 | Gestion des Dossiers : Création de dossiers de travaux associés à un bien, avec ajout/modification des pièces et de leurs surfaces. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 6 | Estimation des Coûts : Calcul automatique du coût des travaux basé sur une liste de métiers pré-définis et la surface des pièces. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 7 | Affichage Devis : Visualisation du devis en temps réel au sein de l'application. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 8 | Partage : Partage de l'accès à un bien ou à un dossier avec un autre utilisateur. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 9 | Export PDF : Génération automatique d'un fichier PDF contenant toutes les informations du devis. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 10 | Téléchargement : Possibilité de télécharger localement le fichier PDF généré. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 11 | Partage par Email : Fonctionnalité pour envoyer le PDF par email directement depuis l'application. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 12 | Interface Admin : Back-office web sécurisé pour l'administration des données de l'application. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 13 | Gestion des Métiers : CRUD (Create, Read, Update, Delete) pour les métiers et leurs tarifs associés. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 14 | Gestion des Calculs : Interface pour modifier les règles de calcul des devis. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 15 | Notifications Push : Envoi de notifications pour les événements importants (nouveau devis, rappel, etc.) via Expo. | P01–P40 selon fonctionnalité ; voir écarts de version et audit |
| SRC-44, sheet1, ligne 16 | Total :  | P01–P40 selon fonctionnalité ; voir écarts de version et audit |

## Choix techniques

Copie isolée à chemin court pour éviter la limite Windows sur les chemins du clone original. Import et binaires tiers exclus de Git. Suivi au schéma du site, rendu Markdown mutualisé, aucune décision ni événement de revue créé. Installation Tailwind 3.4.17 réalisée pour les classes existantes ; configuration selon la documentation officielle Vite.

## Limites de la phase

Les captures et bilans de la version précédente ne prouvent pas le comportement de cette application. Les questions ouvertes sont dans le JSON. Le lot reste local : publication des PR, revue humaine, intégration CONNECT, Docker et hébergement ne sont pas acquis.

## Constat de recette technique locale

La reprise est disponible. Les contrôles et le décompte a/b/c sont consignés dans
[le livrable local](01-reprise-identique.md). Sur le PDF fictif exporté, la première
page est lisible et complète, la deuxième est blanche ; la pagination historique
reste inchangée (`frontend/src/App.jsx:733`). Question Q09, correction à décider.

## Actualisation de pagination
La page blanche décrite dans le résultat initial est résolue dans le candidat
suivant, après autorisation du responsable. P26 est le seul nouvel écart d.
Les preuves a/b/c restent historiques ; le contrôle actuel inverse aussi d.
[Contrôles et limites du correctif](raccordement-cockpit.md).
