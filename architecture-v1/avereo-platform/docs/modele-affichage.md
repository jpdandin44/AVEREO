---
project: avereo-platform
document_type: integration
title: Modèle d’affichage commun des applications
status: active
version: git
created: 2026-11-08
updated: 2026-11-09
owner: jpdandin
tags: [interface, administration, recette]
---

# Modèle d’affichage commun

Le logo horizontal officiel et le nom de l’application occupent le haut gauche. À droite, les commandes restent dans l’ordre **Enregistrer en ligne**, **Enregistrer en local**, **Se déconnecter**. Le bouton clair **Mon compte**, en bas à gauche, ouvre vers le haut le menu de profil, projets, préférences et missions. **Mes projets** continue d’ouvrir l’espace métier. Les commandes restent accessibles au clavier et disparaissent à l’impression. Un clic sur une action indisponible explique son état.

[Aperçu sur ordinateur](illustrations/modele-bureau.png) · [Aperçu sur mobile](illustrations/modele-mobile.png). Dans l’éditeur Rapport, Mon compte se trouve à gauche et Précédent et Suivant à droite, sur la même ligne. Les captures montrent ce pied de page avec le menu ouvert.

## Administration CONNECT

Dans **Mon compte → Apparence des applications**, choisir la hauteur du bandeau (56, 68 ou 84 px), la largeur du logo (100, 116 ou 136 px) et la couleur claire du compte (brume ou blanc). L’aperçu réagit à la sélection. Annuler ou fermer restaure les valeurs précédentes. **Appliquer à toutes les applications** publie le modèle dans cet environnement. Les applications utilisant ce portail le lisent au prochain chargement. Par défaut, le bandeau mesure 68 px, le logo 116 px et le compte utilise la teinte brume.

Le portail utilise les routes de lecture publique et d’administration décrites dans le [contrat CONNECT](../../avereo-app-connect/backend/api/openapi.yaml). La lecture publique transmet uniquement les trois réglages. Les écritures exigent une session CONNECT active, un jeton CSRF et le rôle propriétaire ou administrateur de l’organisation AVEREO désignée par `APPEARANCE_ADMIN_ORGANIZATION_ID` dans la configuration privée de cet environnement. Une valeur absente désactive l’édition. Le fichier `appearance.json`, dans le même répertoire privé que la configuration CONNECT, est remplacé en une opération. Deux enregistrements complets successifs appliquent le dernier reçu. Les répertoires privés doivent être distincts entre environnements.

Saisie unique conserve son fichier HTML autonome. Dans CONNECT, **Télécharger le modèle enregistré pour Saisie unique** exporte uniquement les trois réglages validés. Reconstruire depuis son frontend avec `npm run build -- --appearance CHEMIN_DU_JSON`. Sans ce paramètre, les valeurs par défaut s’appliquent. Le fichier autonome ne contacte aucun portail.

## Actions par application

| Application | En ligne | En local |
| --- | --- | --- |
| CONNECT | Indisponible dans le catalogue | Indisponible dans le catalogue |
| Projet | Commande native du planning lorsque prête | Export JSON complet du planning ouvert |
| Rapport | Commande du rapport quand la synchronisation et la session sont actives | Copie JSON du rapport ouvert |
| Coupe | Commande native de sauvegarde en ligne | Fichier JSON du projet |
| Drone | Indisponible | Commande de sauvegarde de la mission ouverte dans ce navigateur |
| Thermo | Indisponible | Commande « Sauver » du rapport en cours dans ce navigateur |
| Recherche | Indisponible | Sauvegarde JSON du corpus chargé et non vide |
| Passeport Immo | Enregistrement du formulaire de bien en mode serveur | Même formulaire en mode démonstration locale |
| Saisie unique | Indisponible | Export JSON de l’ensemble des dossiers locaux |
| RGA (Rapport) | Indisponible | Ouvre « Mes projets » pour nommer et enregistrer le point sélectionné sur la carte interactive |

La sortie réutilise la commande de session courante, y compris la confirmation CONNECT, la sauvegarde préalable du brouillon Rapport et la sortie propre à RGA. Les écrans sans session expliquent l’indisponibilité. Les applications gardent leur gestion des conflits, des erreurs et des droits d’accès.

## Livraison et revue

Construire chaque frontend depuis son répertoire avec `npm run build`. Depuis la racine, `node .github/scripts/check-account-menu.mjs APPLICATION` contrôle la présence du composant, du logo officiel et du module Missions dans le livrable. CONNECT PHP doit recevoir ensemble le portail, sa copie du composant, le logo et les modifications du backend. RGA provient du build Rapport. Le script de préparation des copies réutilise le logo de la [source d’identité](../shared/report-identity.js).

Avant installation, confirmer l’organisation administratrice et son répertoire privé, vérifier les cibles disponibles (notamment Recherche), sauvegarder les versions installées et répéter leur restauration sur copie. Préserver la variante hébergée de Coupe et les fichiers privés de chaque application. Recetter les deux tailles d’écran, les modes hors ligne et connecté, les sorties sans perte de brouillon et les écritures autorisées avec des dossiers fictifs. Revenir au paquet précédent en conservant les dossiers et une copie du modèle. [Suivi de l’itération](../data/suivi-modele-affichage.json).

## Préproduction de Rapport — 8 novembre 2026

La correction fusionnée de la PR #133 est installée pour Rapport. L’accueil affiche un bandeau unique. Dans l’éditeur, Accueil précède Dossier et conserve le parcours de sauvegarde du brouillon. Le serveur et les fichiers distribués ont été contrôlés. La revue visuelle connectée reste à effectuer. [Ouvrir Rapport](https://rapport-preprod.avereo.fr/) · [Reçu de livraison](../data/livraison-rapport-pr133.json).

## Généralisation et navigation métier — candidat du 9 novembre

CONNECT utilise le bandeau commun sur le portail de connexion et dans l’espace connecté. Les applications conservent leurs outils sous ce bandeau. Coupe garde sa barre de commandes de dessin, Projet son planning, Thermo son accès au référentiel, Drone ses outils de mission, Saisie unique sa navigation et son avertissement sur les données fictives. Passeport Immo et le frontend historique CONNECT proposent le retour à l’accueil depuis les vues de dossier. Recherche conserve ses onglets et RGA son accès aux cartes. [Suivi du candidat](../data/suivi-navigation-rapports.json).
