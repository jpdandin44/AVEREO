---
project: avereo-platform
document_type: workflow
title: Protocole des missions, des clients et des livrables
status: active
version: git
created: 2026-11-07
updated: 2026-11-07
owner: jpdandin
tags: [avereo, missions, clients, livrables, preproduction]
---

# Protocole des missions et des livrables

Le responsable souhaite préparer la lettre, l’ordre et le rapport depuis un même dossier et saisir les coordonnées du client une seule fois. Le candidat local propose **Mon espace → Missions**. La partie sur le répertoire partagé entre applications est une proposition d’architecture à examiner.

## Parcours proposé

1. **Ouvrir le dossier** dans l’application métier. Le module reprend sa référence et les coordonnées disponibles. Distinguer l’adresse postale du client de l’adresse du bien ou du site d’intervention.
2. **Préparer la mission** en choisissant l’offre, une référence de mission, la date d’intervention et la date du document. Préciser l’objet, le périmètre et le livrable attendu. L’offre relève du devis et de la commande. Une application, un type de vol ou une catégorie de rapport ne la déterminent pas.
3. **Reporter au dossier** les coordonnées relues quand l’application propose cette action. Le formulaire métier reçoit les valeurs et conserve son mécanisme habituel de sauvegarde. Le client déjà associé à un bien Passeport se gère dans la rubrique Documents du bien.
4. **Générer la lettre de mission** pour la préparation de l’accord avec le client. Choisir le fichier Word de l’offre dans le pack AVEREO, puis « Générer la lettre Word ». Le navigateur vérifie le modèle et l’utilise en mémoire dans cet onglet. Le Word reprend le dossier, le client, le bien, la référence et le livrable convenu. Les pages de mode d’emploi et les prix internes de lancement sont retirés de cette copie.
5. **Relire le projet de lettre**. Compléter dans Word la qualité B2C ou B2B, le représentant éventuel, les questions, les limites, les options réellement vendues, la référence du devis, le prix applicable et les annexes. Les clauses et champs restant à valider proviennent des modèles métier. La date de génération reste distincte d’une acceptation ou d’une signature.
6. **Générer l’ordre de mission** pour préparer l’intervention. Choisir l’offre, vérifier les coordonnées du client et ouvrir **Étapes de l’ordre de mission** pour relire le déroulé et sélectionner les options convenues. Le Word contient les consignes et les traces à relever. Drone conserve aussi sa fiche de vol imprimable avec le scénario et les contrôles opérationnels.
7. **Émettre le rapport depuis le dossier**. Le rapport reprend les coordonnées métier. Une correction du client doit être revue sur le dossier concerné avant le prochain export. Les documents déjà téléchargés constituent des instantanés.

## Préparer l’ordre de chaque prestation

L’ordre identifie le client par son nom ou sa raison sociale, son adresse postale, son téléphone et son e-mail. Les champs disponibles viennent du dossier ouvert et restent modifiables. Compléter les coordonnées manquantes dans le formulaire. L’ordre les signale par « À renseigner ». L’adresse d’intervention, les références du dossier et de la mission, les dates et le périmètre figurent dans un bloc distinct.

| Prestation | Déroulé de l’ordre |
| --- | --- |
| Habitat & Confort | Partir des gênes rapportées par l’occupant, visiter pièce par pièce, examiner la ventilation et localiser les traces d’humidité, puis restituer les priorités. |
| Énergie & Travaux | Cadrer la décision, décrire l’état initial, comparer les scénarios, ordonner les lots, qualifier les estimations prévues au devis et restituer les arbitrages. |
| Prévention Bâti | Établir la chronologie, cartographier les fissures, examiner les façades et les points hauts accessibles, suivre les indices d’humidité, situer le contexte RGA et hiérarchiser les vigilances. |
| 360 Premium | Préparer la visite, examiner l’habitat, documenter la thermographie et la faisabilité du drone, comparer les scénarios énergétiques, construire la feuille de route et restituer l’ensemble. |

Chaque étape indique ce que l’intervenant doit faire et la trace à conserver. Pour l’ordre, l’offre propose un objet et un livrable. Un texte saisi ou repris du dossier prévaut. Une lettre ou un report au dossier demande toujours un objet personnalisé. Sélectionner les options du devis pour l’ordre en cours. Un changement d’offre ou la fermeture du formulaire efface cette sélection. Les modèles Word privés sont nécessaires pour les lettres.

Les sections « Périmètre de la mission », « Méthodes et moyens » et « Livrable et portée » des quatre lettres AVEREO ont servi à rédiger les consignes. Le catalogue associe chaque prestation à son modèle de référence et porte le détail utilisé par le formulaire et le Word. [Catalogue des prestations](../data/modeles-lettres-mission.json) · [Suivi des ordres détaillés](../data/recette-missions/ordres-prestations.json).

## Sources dans le candidat local

| Application | Données disponibles à l’ouverture de Missions | Effet sur le dossier ou le rapport |
| --- | --- | --- |
| Rapport | Client, e-mail, site d’intervention, date et référence | Reporter au dossier met à jour le formulaire. Les deux Word reprennent les coordonnées de mission. |
| Thermo | Client, site, date et référence du rapport | Reporter au dossier alimente le rapport thermographique. Les coordonnées supplémentaires figurent en couverture. |
| Drone | Client, adresse, date et identifiant de la mission | Reporter au dossier prépare la fiche de vol. Sauvegarder rend l’ordre accessible depuis la liste des missions. |
| Passeport Immo | Bien ouvert et client déjà associé à ses documents | Lecture du lien existant. Le PDF d’estimation reprend le nom du client associé. |
| Projet | Référence du projet en ligne lorsque le catalogue et le projet actif concordent | Le champ « Client / référence » est présenté pour lecture. L’opérateur confirme l’identité du client dans la mission. |
| Coupe | Nom et adresse renseignés dans la coupe ouverte | Reprise des informations disponibles sans écrire dans le dessin. |
| Saisie unique | Client et logement du dossier fictif ouvert | Lecture seule des champs de la fiche. L’application autonome conserve ses formulaires et son usage fictif. |
| RGA | Module du menu parent sur la carte intégrée, formulaire autonome ailleurs | Une adresse de carte ou une parcelle ne suffit pas à identifier le client. |
| CONNECT et Recherche | Formulaire autonome | Le portail et le corpus ne portent pas de dossier client métier. |

Les coordonnées supplémentaires sont optionnelles dans les anciens dossiers. Rapport, Thermo et Drone gardent dans leur dossier un petit bloc de mission pour les données complémentaires. Leurs champs natifs font foi pour le client et le site. L’action de génération ne crée pas de base clients, de compte ou de projet. Le modèle d’entreprise reste fixe dans ce candidat. La sélection d’un fichier de modèle ne modifie aucun réglage d’organisation.

Dans Thermo, une adresse e-mail déjà présente dans un ancien rapport préremplit la mission. Un courriel confirmé dans le bloc de mission prime sur cette ancienne valeur. Après un effacement explicite avec **Reporter au dossier**, le champ reste vide à la réouverture.

## Les quatre modèles Word

Le modèle maître AVEREO du 2 août 2026 et ses quatre déclinaisons Word sont les références métier pour Habitat & Confort, Énergie & Travaux, Prévention Bâti et 360 Premium. Le catalogue identifie leurs fichiers et empreintes. Le préparateur produit des copies internes personnalisables avec l’identité provisoire AVEREO. La version de travail destinée au dossier est créée à partir de la copie correspondant à l’offre choisie.

Le pack de modèles reste fourni séparément aux utilisateurs de la recette. Une fois les fichiers choisis, plusieurs missions peuvent être préparées dans le même onglet. Les Word métier privés ne sont pas distribués dans les scripts publics des applications. La préparation et l’impression n’établissent aucune acceptation commerciale.

[Catalogue des modèles](../data/modeles-lettres-mission.json) · [Identité de l’entreprise](identite-livrables.md) · [Préparation des modèles](../workflows/preparer-lettres-mission.py).

## Partage en ligne proposé pour la suite

| Objet | Identité proposée | Responsabilité |
| --- | --- | --- |
| Organisation | Identifiant CONNECT de l’organisation active | Seul son administrateur modifie le logo, l’identité légale, les mentions et les modèles publiés. |
| Client | Identifiant stable dans l’organisation et révision | Nom ou raison sociale, contacts, adresse postale et représentant si nécessaire. Recherche et sélection explicites. |
| Bien ou site | Identifiant propre lié au dossier | Adresse d’intervention et périmètre physique. Un client peut avoir plusieurs biens. |
| Dossier | Identifiant propre et applications autorisées | Lie le client et le bien. Les dossiers existants sont raccordés explicitement. |
| Mission | Identifiant, référence lisible, offre, révision et état | Décrit l’intervention et ses livrables. Un dossier peut porter plusieurs missions successives. |
| Document émis | Identifiant, type, révision de mission et empreinte | Archive l’identité d’entreprise, le client, le site et le modèle effectivement employés lors de l’émission. |

Le service futur vérifierait côté serveur l’organisation, l’accès au dossier et le droit d’écriture à chaque lecture ou modification. Il contrôlerait la révision lors des mises à jour concurrentes. Les applications transmettraient des identifiants et reliraient le dossier autorisé. Les coordonnées personnelles resteraient hors des adresses URL. La fusion de clients homonymes demanderait une décision explicite.

Le parcours métier proposé est **brouillon → lettre relue → acceptation consignée → intervention → rapport émis → archivage**. L’organisation doit définir qui peut prononcer chaque transition et quelle pièce en fait foi. La recette du service en ligne devra couvrir deux organisations, deux clients homonymes, plusieurs biens pour un client, deux missions pour un dossier, les droits d’un membre, un conflit de révision, une indisponibilité et la conservation des documents déjà émis.

## Préparation de livraison

Cycle du projet **Cadrage → Développement local → Préproduction → Mise en production**. Le candidat et le protocole sont soumis à revue locale. Le suivi de l’itération référence les essais, le paquet et les réserves de préparation. La préproduction utilisera le même paquet et un contrôle frais de ses cibles avant installation.

[Suivi de l’itération](../data/suivi-missions.json).
