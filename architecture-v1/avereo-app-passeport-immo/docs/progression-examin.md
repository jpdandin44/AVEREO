---
project: avereo-app-passeport-immo
document_type: functional-progress
title: Progression face aux sources ExamIn
status: active
version: git
created: 2026-10-14
updated: 2026-10-14
owner: jpdandin
tags: [passeport-immo, examin, progression]
---

# Progression face aux sources ExamIn

Vue générée depuis [la matrice JSON](../data/progression-examin.json). Observation : 2026-10-14.

Couverture fonctionnelle locale ; aucun pourcentage de livraison ou de validation humaine déduit. Les résultats ExamIn de 2025 ne sont pas des tests de Passeport Immo.

## Lecture du statut

Sur les 14 fonctions de référence : **2 disponibles localement,
6 partielles, 2 simulées et 4 absentes**.
La disponibilité locale ne signifie ni stockage centralisé, ni droits réels,
ni livraison hébergée. Aucun pourcentage global n'est calculé.

| Fonction de référence | État actuel | Constat | Source initiale |
|---|---|---|---|
| Authentification | Simulé | Connexion Admin Démo imposée ; inscription et mots de passe réels absents. | SRC-38, Peux-tu me rajouter une colonne, ligne 2 |
| Abonnements | Simulé | Écran Pro simulé ; Stripe absent. | SRC-38, Peux-tu me rajouter une colonne, ligne 3 |
| Gestion des Biens | Disponible localement | Création, édition, consultation et suppression locales ; aucun droit partagé. | SRC-38, Peux-tu me rajouter une colonne, ligne 4 |
| Gestion des Dossiers | Partiel | Pièces et interventions par bien ; plusieurs dossiers de travaux et édition nom/surface de pièce absents. | SRC-38, Peux-tu me rajouter une colonne, ligne 5 |
| Estimation des Coûts | Partiel | Trois gammes vérifiées pour m², unité et forfait ; h et ml restent à zéro. | SRC-38, Peux-tu me rajouter une colonne, ligne 6 |
| Affichage Devis | Partiel | Estimation recalculée localement ; TVA indépendante et nom de devis absents. | SRC-38, Peux-tu me rajouter une colonne, ligne 7 |
| Partage | Absent | Copie de l’URL uniquement ; pas de partage de dossier, de permissions ou d’expiration. | SRC-38, Peux-tu me rajouter une colonne, ligne 8 |
| Export PDF | Partiel | Export réellement testé, pagination corrigée ; TVA et certaines règles historiques restent incomplètes. | SRC-38, Peux-tu me rajouter une colonne, ligne 9 |
| Téléchargement | Disponible localement | Le PDF généré est téléchargé localement. | SRC-38, Peux-tu me rajouter une colonne, ligne 10 |
| Partage par Email | Absent | Aucun envoi de document par email. | SRC-38, Peux-tu me rajouter une colonne, ligne 11 |
| Interface Admin | Partiel | Éditeur local de tarifs ; administration des utilisateurs et rôles serveur absente. | SRC-38, Peux-tu me rajouter une colonne, ligne 12 |
| Gestion des Métiers | Partiel | Édition/import du catalogue local ; tarifs intégrés pouvant réapparaître après suppression. | SRC-38, Peux-tu me rajouter une colonne, ligne 13 |
| Gestion des Calculs | Absent | Aucun écran de modification des règles de calcul. | SRC-38, Peux-tu me rajouter une colonne, ligne 14 |
| Notifications Push | Absent | Aucun système de notifications push. | SRC-38, Peux-tu me rajouter une colonne, ligne 15 |

## Documents du client liés au bien

Disponible localement ; coffre partagé sécurisé non livré.

- Client lié à un ou plusieurs biens
- Import de plusieurs PDF/images/documents bureautiques
- Classement et titres lisibles
- Consultation PDF/image et téléchargement
- Recherche, filtres et archive réversible
- Persistance locale et détection des doublons

Sources complémentaires : SRC-01 : coffre documentaire, page 1 ; SRC-02 : documents liés aux biens, page 3 ; SRC-37 : TC, ligne 4, PDF dans dossier client.
Les détails du lot et du cas réel sont dans [le guide](documents-bien.md) et
[son audit](source-audit-documents.md). Les documents et identifiants clients
ne sont pas copiés dans cette matrice.

## Éléments encore ouverts

- Identité CONNECT et droits réels
- Stockage serveur/chiffrement et sauvegarde centralisée
- Liens partagés expirables et traçabilité serveur
- Email, paiement, suivi artisans et notifications

Le socle initial d'audit et ses validations restent historiques. Le regroupement
du suivi est décrit dans [la correspondance des phases](mapping-phases.md).
La recette ExamIn de 2025 et ses anomalies ne mesurent pas l'état de cette version.
