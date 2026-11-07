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

La PR #124 a fusionné dans main au commit `1d483e8419f16bd34fc4809cc2e72a9065a6a2a7`. La PR #125 a ajouté le parcours de mission, puis son paquet a été installé en préproduction le 7 novembre 2026. Les coordonnées utilisées pour générer les documents de recette sont fictives.

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

Le [manifeste du paquet](../data/recette-missions/selection-preproduction.json) identifie les 27 fichiers soumis à revue en [PR #125](https://github.com/jpdandin44/AVEREO/pull/125).

La procédure serveur a aussi été exécutée dans un environnement Linux local isolé, sur sept racines fictives. La répétition a conservé leur contenu octet pour octet et refusé un paquet différent, une sauvegarde déjà présente et un fichier cible modifié entre-temps.

### Comparaison sur l’hébergement du 7 novembre 2026

Entre 12 h 48 et 12 h 51, heure de Paris, cPanel a confirmé les sept racines et le serveur a comparé leurs fichiers au manifeste. Les 13 fichiers à remplacer avaient exactement les empreintes attendues. Les 14 chemins à créer étaient libres. Les six ressources conservées correspondaient aussi, octet pour octet, aux ressources utilisées pendant la recette locale. Le contrôle a utilisé Python 3.11 de l’hébergeur.

Pour les 27 opérations, l’outil a appliqué les changements à une copie privée, rétabli son état initial puis relu les fichiers actifs. Toutes les comparaisons ont réussi. Ce premier contrôle portait sur la préparation du paquet. [Reçu du contrôle préalable](../data/recette-missions/controle-heberge.json).

**CONNECT nécessite la création de `public/assets/`** pour accueillir `missions.js`. L’essai complémentaire a créé puis retiré ce répertoire sur une copie privée. Un second essai a conservé un fichier témoin ajouté entre-temps. Lors de l’installation, vérifier à nouveau sa présence. S’il doit être créé, le consigner pour que le retour arrière retire seulement un répertoire créé par cette livraison et encore vide.

### Installation et recette hébergée du 7 novembre 2026

La PR #125 a été fusionnée à 14 h 31, heure de Paris, au commit `54af84e562d2b5dbfc32611341e386e4fee2c467`. Son arbre Git correspond exactement à celui de la version revue. Après sauvegarde et restauration sur copies privées, les 27 fichiers du paquet ont été installés à 14 h 32 sur les sept domaines. Le répertoire public `assets` de CONNECT a été créé. Les autres fichiers publics, huit fichiers protégés et les 17 fichiers du planning présents avant l’installation ont conservé leurs empreintes. Les neuf contrôles HTTPS anonymes ont donné les réponses attendues avant et après livraison.

Depuis **Mon espace → Missions**, les quatre offres ont produit leurs lettres et un ordre sur chaque cible. L’entrée RGA de Rapport a fait l’objet du même essai supplémentaire. Les 32 lettres et 8 ordres ont été ouverts dans Microsoft Word et rendus en PDF. Le nom, l’e-mail, le téléphone, les deux adresses, la référence, l’objet, le périmètre, le livrable et l’identité AVEREO ont été vérifiés. Les lettres tiennent sur cinq ou six pages et chaque ordre sur une page pour ces données fictives. La recette a utilisé la session CONNECT autorisée existante et n’a écrit dans aucun dossier métier.

Dans les onglets ouverts avant la livraison, **Ctrl+F5** a permis d’actualiser le menu. Lors de cette première recette, le navigateur intégré de Codex a généré les documents de Projet et de Coupe mais n’a pas remis les fichiers depuis leurs cadres. Les dix Word correspondants ont été récupérés en ouvrant les éditeurs hébergés directement dans un onglet. [Reçu de livraison et des documents par application](../data/recette-missions/livraison-preproduction.json).

### Vérification des cadres dans Google Chrome

Avec Google Chrome 156.0.8078.80 et un profil de test isolé sur les applications locales compilées, les quatre lettres et l’ordre de mission de chaque application ont été téléchargés en actionnant leurs boutons à l’intérieur de l’iframe. Les dix Word contiennent les coordonnées fictives attendues et le logo AVEREO. L’adresse de la page principale est restée identique et aucun autre onglet ne s’est ouvert. Le banc d’essai était configuré pour accepter les téléchargements de ce profil.

Les scripts servis en préproduction sur les deux domaines correspondent au paquet installé. Dans Google Chrome sur Windows avec une session CONNECT authentifiée, **Mon espace → Missions** a remis les quatre lettres et un ordre depuis le cadre de chaque application. Pour les lettres, le pack privé a été sélectionné dans **Modèles Word de lettre de mission**. Les dix fichiers sont arrivés dans Téléchargements. Projet est resté dans sa fenêtre à un onglet et Coupe dans la sienne à cinq onglets, sur la même adresse et avec son éditeur intégré ouvert.

Microsoft Word a ouvert les dix fichiers. Le passage en PDF a permis de vérifier le client fictif, les deux adresses, la référence, l’objet, l’offre et la mention de formation. Les documents contiennent le logo officiel AVEREO. Chaque ordre tient sur une page. Les lettres Habitat & Confort et Énergie & Travaux comptent cinq pages, celles de Prévention Bâti et 360 Premium en comptent six. Ce parcours fonctionne avec le paquet déjà installé. [Résultats par application et par document](../data/recette-missions/chrome-cadres.json).

### Ordres détaillés de la PR #127 en préproduction

Le 7 novembre 2026 à 22 h 42, heure de Paris, le paquet de la PR #127 a été installé sur les sept sites. Le serveur a comparé les douze chemins, exercé leur restauration sur copies privées, puis relu la livraison. Les 17 fichiers du planning et les huit fichiers de protection ont gardé leurs empreintes. Les points d’entrée de Rapport et de Thermo chargent les ressources correspondant au correctif des coordonnées.

Depuis **Mon espace → Missions** dans les cadres de Projet et de Coupe, Google Chrome a téléchargé un Word par offre et par application en gardant le même onglet. Chaque essai utilisait un client fictif différent. Microsoft Word a ouvert les huit fichiers de deux pages. Sur la première page, le nom, le téléphone, l’e-mail et l’adresse postale correspondent à la saisie et l’adresse du site est distincte.

| Prestation | Étapes présentes dans chaque ordre de Projet et de Coupe |
| --- | ---: |
| Habitat & Confort | 5 |
| Énergie & Travaux | 6 |
| Prévention Bâti | 6 |
| 360 Premium | 7 |

La seconde page a été comparée au catalogue fusionné, dans l’ordre prévu, pour chaque titre, consigne et trace à conserver. Les huit ordres ont été émis avec les tâches de base. Les fichiers Word et les PDF correspondants sont conservés en privé. [Reçu des contrôles et empreintes des huit documents](../data/recette-missions/livraison-ordres-preproduction.json).

## Mise en production

À la fusion de #124, les workflows Drone et Thermo se sont arrêtés à l’étape d’autorisation du serveur avant tout transfert. Le prototype GitHub Pages s’est arrêté à sa configuration avant publication. Le candidat propose de passer ces trois workflows et celui de Projet au lancement manuel sur main avec confirmation explicite. Ces modifications prennent effet après leur fusion. Le job de production conserve son fonctionnement lors d’une publication volontaire.

[Exécution Drone](https://github.com/jpdandin44/AVEREO/actions/runs/42357325193) · [Exécution Thermo](https://github.com/jpdandin44/AVEREO/actions/runs/42357325153) · [Exécution Pages](https://github.com/jpdandin44/AVEREO/actions/runs/42357325158).

Aucune installation en production. La recette hébergée, la relecture métier des lettres, les autorisations de livraison et l’ouverture publique sont des décisions distinctes. L’immatriculation, l’assurance et les mentions complémentaires suivront les données fournies par le responsable.
