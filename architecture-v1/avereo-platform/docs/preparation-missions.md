---
project: avereo-platform
document_type: qualification
title: Recette des rapports et préparation des missions
status: active
version: git
created: 2026-11-07
updated: 2026-11-07
owner: jpdandin
tags: [avereo, missions, rapports, recette, preproduction]
---

# Recette des rapports et préparation des missions

La PR #124 a fusionné dans main au commit `1d483e8419f16bd34fc4809cc2e72a9065a6a2a7`. Le candidat suivant ajoute le parcours de mission et les corrections révélées par la génération réelle des documents. Toutes les manipulations de dossiers décrites ici concernent des données fictives locales.

[Protocole métier](protocole-missions.md) · [Suivi de l’itération](../data/suivi-missions.json) · [Empreintes et résultats](../data/recette-missions/qualification.json).

## Cadrage

Deux livrables distincts sont disponibles. La lettre prépare l’accord avec le client selon l’une des quatre offres. L’ordre décrit l’intervention. Le même formulaire distingue le client, son courrier et le lieu de la visite. Le rapprochement en ligne entre applications figure dans le protocole comme étape ultérieure.

## Développement local

| Application ou document | Essai et résultat |
| --- | --- |
| Rapport | Expertise et Visite globale, chacune en Word expert et synthèse client. Ouverture dans Microsoft Word et rendus de 7, 3, 8 et 3 pages. La mention témoin réservée à l’expert est absente des synthèses. Le dossier Expertise fournit cinq coordonnées concordantes et le second dossier reste indépendant. Le candidat a été construit avec `VITE_ENABLE_ONLINE_SYNC=true` et ouvert avec une session PHP locale fictive. |
| Thermo | Seize sous-types générés depuis les quatre familles. Le Word ouvert avec Microsoft Word contient les coordonnées en couverture, le sommaire en page 2 et la signature texte en page 7. Une signature graphique embarquée est également acceptée. |
| Drone | Enregistrement puis ouverture d’un ordre depuis la liste des missions. Les cinq types de mission produisent chacun une page PDF par le moteur d’impression du navigateur. Une sixième sortie vérifie les coordonnées du client et du site. Aucun tirage sur imprimante physique. |
| Passeport Immo | Estimation de travaux A4 du bien exemple, puis sortie avec le client associé au bien. Montants contrôlés dans le PDF. Le test de parité détecte une modification témoin étrangère sur une copie. |
| Recherche | Six formats de citation téléchargés à partir d’une référence fictive dans le parcours de recherche. |
| Saisie unique | Treize formulaires imprimés à partir d’un dossier fictif. L’attestation factures et le rapport de fin d’accompagnement ont été imprimés après gel du budget. Les deux procurations conservent un champ métier à compléter sur cette fixture. |
| Lettres et ordre | Quatre modèles préparés et comparés aux sources métier. Quatre lettres de dossier générées et ouvertes dans Word, de 5 à 6 pages, sans les consignes internes du modèle. L’ordre Word natif tient sur une page sur le dossier témoin. Un fichier Word hors catalogue est refusé. |

Les commandes de l’application ont été essayées dans les neuf menus et dans RGA, hébergé par Rapport. Coupe a repris le nom et l’adresse saisis dans un dessin. Les 231 tests couvrent six applications, le navigateur de Saisie unique et les composants de compte et dossier. Les huit applications compilées ont aussi passé le contrôle de présence du menu et du module Missions. CONNECT sert directement sa copie versionnée.

Passeport Immo distribue le module par le chemin protégé `assets/missions.js`, commun aux applications. Les 80 vérifications Apache/PHP locales couvrent notamment le refus anonyme, le contenu JavaScript reçu avec un ticket valide, le refus du cookie invalide et les requêtes HEAD. Les 19 essais du paquet Passeport et la reconstruction de son archive ont également réussi. L’ordre et la lettre Habitat & Confort ont été régénérés depuis le dossier conservé après ce changement de chemin.

Le pack de modèles est privé. Son manifeste et ses empreintes identifient les quatre Word de travail. Les copies client sont générées en mémoire. Les originaux commerciaux, les prix internes et les coordonnées du dossier ne sont pas publiés dans le dépôt. Avant remise au client, compléter et relire les champs de l’offre, les conditions économiques et les annexes.

## Préproduction

Le préparateur sélectionne le menu et son module sur sept domaines. Sur les quatre applications qui éditent les rapports, il reprend le point d’entrée et les ressources de la compilation éprouvée. Projet reçoit aussi son raccordement au dossier. Pour Coupe, il ajoute le seul bloc Missions à la copie effectivement livrée par #121 puis vérifie que son retrait restitue exactement cette copie. Le correctif de navigation RGA de #122 est hors des chemins de remplacement. Les fichiers PHP, les protections d’accès, les comptes, plannings, dossiers et modèles Word privés sont exclus. Recherche et Saisie unique gardent leur périmètre local actuel.

Le paquet est comparé aux empreintes des fichiers utilisés pendant la recette. Le préparateur répète l’écriture et la restauration sur des copies de référence. Avant installation, la commande `rehearse` relit les sept racines déclarées par cPanel, compare les empreintes réellement présentes et répète la restauration dans un répertoire privé propre. Un écart impose d’examiner le fichier concerné et de préparer une nouvelle sélection si nécessaire.

Pour une livraison autorisée, installer les nouvelles ressources puis les menus et les points d’entrée. Conserver les anciennes ressources référencées par les onglets ouverts. Contrôler les sept protections d’accès et le parcours sur un compte fictif. En cas d’échec, restaurer les fichiers remplacés, retirer seulement les fichiers ajoutés encore identiques et comparer l’intégralité du périmètre au manifeste de sauvegarde.

[Outil de préparation et de répétition](../../../outillage/acces-preproduction/prepare_mission_delivery.py) · [État du paquet et du contrôle hébergé](../data/suivi-missions.json).

Le [manifeste du paquet](../data/recette-missions/selection-preproduction.json) identifie 27 fichiers, dont 13 remplacements et 14 ajouts. L’écriture et la restauration ont été vérifiées sur copies de référence. Le contrôle des sept sites actifs attend l’accès à cPanel. La version et son contenu sont soumis à revue en [PR #125](https://github.com/jpdandin44/AVEREO/pull/125).

La procédure serveur a aussi été exécutée dans un environnement Linux local isolé, sur sept racines fictives. La répétition a conservé leur contenu octet pour octet et refusé un paquet différent, une sauvegarde déjà présente et un fichier cible modifié entre-temps.

## Mise en production

À la fusion de #124, les workflows Drone et Thermo se sont arrêtés à l’étape d’autorisation du serveur avant tout transfert. Le prototype GitHub Pages s’est arrêté à sa configuration avant publication. Le candidat propose de passer ces trois workflows et celui de Projet au lancement manuel sur main avec confirmation explicite. Ces modifications prennent effet après leur fusion. Le job de production conserve son fonctionnement lors d’une publication volontaire.

[Exécution Drone](https://github.com/jpdandin44/AVEREO/actions/runs/42357325193) · [Exécution Thermo](https://github.com/jpdandin44/AVEREO/actions/runs/42357325153) · [Exécution Pages](https://github.com/jpdandin44/AVEREO/actions/runs/42357325158).

Aucune installation en production. La recette hébergée, la relecture métier des lettres, les autorisations de livraison et l’ouverture publique sont des décisions distinctes. L’immatriculation, l’assurance et les mentions complémentaires suivront les données fournies par le responsable.
